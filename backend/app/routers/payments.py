from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
import datetime
import uuid
import json
import urllib.request
import urllib.parse
import urllib.error

# Try importing the official stripe SDK if installed, otherwise fallback gracefully to Stripe REST API
try:
    import stripe
    stripe.api_key = None
except ImportError:
    stripe = None

from ..database import get_db
from .. import models, auth
from ..config import settings

# Initialize Stripe SDK if available
if stripe:
    stripe.api_key = settings.STRIPE_SECRET_KEY

router = APIRouter(
    prefix="/api/payments",
    tags=["Payments"]
)


# ─── Schemas ────────────────────────────────────────────────────────────────

class CreatePaymentIntentRequest(BaseModel):
    amount_cents: int       # Amount in euro cents, e.g. 499 = 4.99 €
    currency: str = "eur"
    description: Optional[str] = None


class CreatePaymentIntentResponse(BaseModel):
    client_secret: str
    payment_intent_id: str
    amount_cents: int
    currency: str


class UsageSummary(BaseModel):
    total_calls: int
    total_cost: float
    currency: str = "EUR"


class InvoiceItem(BaseModel):
    invoice_id: str
    period: str
    total_calls: int
    total_cost: float
    currency: str
    status: str


class PublicKeyResponse(BaseModel):
    publishable_key: str


# ─── Stripe REST Helper (Zero-dependency fallback) ──────────────────────────

def _create_stripe_payment_intent_rest(amount_cents: int, currency: str, description: str, user_id: int, user_email: str) -> dict:
    """Create a PaymentIntent directly using Stripe REST API via standard library."""
    url = "https://api.stripe.com/v1/payment_intents"
    headers = {
        "Authorization": f"Bearer {settings.STRIPE_SECRET_KEY}",
        "Content-Type": "application/x-www-form-urlencoded",
    }
    
    data = {
        "amount": str(amount_cents),
        "currency": currency,
        "description": description,
        "automatic_payment_methods[enabled]": "true",
        "metadata[agenthub_user_id]": str(user_id),
        "metadata[agenthub_user_email]": user_email,
    }
    encoded_data = urllib.parse.urlencode(data).encode("utf-8")

    req = urllib.request.Request(url, data=encoded_data, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            res_body = response.read().decode("utf-8")
            return json.loads(res_body)
    except urllib.error.HTTPError as e:
        error_content = e.read().decode("utf-8")
        try:
            err_json = json.loads(error_content)
            msg = err_json.get("error", {}).get("message", error_content)
        except Exception:
            msg = error_content
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Stripe API error: {msg}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Stripe connection error: {str(e)}"
        )


# ─── Endpoints ──────────────────────────────────────────────────────────────

@router.get("/config", response_model=PublicKeyResponse)
def get_stripe_config():
    """
    Returns the Stripe publishable key so the frontend can initialise
    Stripe.js without embedding secrets in the source code.
    """
    return PublicKeyResponse(publishable_key=settings.STRIPE_PUBLIC_KEY)


@router.get("/usage", response_model=UsageSummary)
def get_usage_summary(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Return a cumulative usage cost summary for the authenticated user."""
    logs = (
        db.query(models.UsageLog)
        .filter(models.UsageLog.user_id == current_user.id)
        .all()
    )
    total_calls = len(logs)
    total_cost = float(sum(log.cost for log in logs))
    return UsageSummary(total_calls=total_calls, total_cost=round(total_cost, 4))


@router.post("/create-payment-intent", response_model=CreatePaymentIntentResponse)
def create_payment_intent(
    payload: CreatePaymentIntentRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Creates a Stripe PaymentIntent and returns the client_secret to the
    frontend so Stripe.js can confirm the payment securely (card data
    never touches our server — PCI-compliant).
    """
    if payload.amount_cents < 50:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le montant minimal est de 0.50 € (50 centimes)."
        )

    description = payload.description or f"AgentHub AI - Paiement utilisateur #{current_user.id}"

    # Use official Stripe SDK if installed, otherwise use pure Python REST API
    if stripe:
        try:
            intent = stripe.PaymentIntent.create(
                amount=payload.amount_cents,
                currency=payload.currency,
                description=description,
                automatic_payment_methods={"enabled": True},
                metadata={
                    "agenthub_user_id": str(current_user.id),
                    "agenthub_user_email": current_user.email,
                }
            )
            return CreatePaymentIntentResponse(
                client_secret=intent.client_secret,
                payment_intent_id=intent.id,
                amount_cents=intent.amount,
                currency=intent.currency,
            )
        except stripe.StripeError as e:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Stripe error: {e.user_message or str(e)}"
            )
    else:
        # Zero-dependency fallback
        res = _create_stripe_payment_intent_rest(
            amount_cents=payload.amount_cents,
            currency=payload.currency,
            description=description,
            user_id=current_user.id,
            user_email=current_user.email
        )
        return CreatePaymentIntentResponse(
            client_secret=res["client_secret"],
            payment_intent_id=res["id"],
            amount_cents=res["amount"],
            currency=res["currency"],
        )


@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Stripe webhook handler.
    Processes Stripe events such as `payment_intent.succeeded`.
    """
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")
    webhook_secret = settings.STRIPE_WEBHOOK_SECRET

    try:
        if stripe and webhook_secret:
            event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
        else:
            # Fallback payload parsing
            event = json.loads(payload.decode("utf-8"))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    # Handle events
    event_type = event.get("type") if isinstance(event, dict) else getattr(event, "type", "")
    if event_type == "payment_intent.succeeded":
        data_obj = event.get("data", {}).get("object", {}) if isinstance(event, dict) else event["data"]["object"]
        user_id = data_obj.get("metadata", {}).get("agenthub_user_id", 0)
        amount_eur = (data_obj.get("amount", 0)) / 100.0
        print(f"[Webhook] PaymentIntent {data_obj.get('id')} succeeded for user {user_id}: {amount_eur} EUR")

    return {"received": True}


@router.get("/invoices", response_model=List[InvoiceItem])
def list_invoices(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Returns usage grouped by month as invoices."""
    logs = (
        db.query(models.UsageLog)
        .filter(models.UsageLog.user_id == current_user.id)
        .order_by(models.UsageLog.timestamp.desc())
        .all()
    )

    monthly: dict = {}
    for log in logs:
        key = log.timestamp.strftime("%Y-%m")
        if key not in monthly:
            monthly[key] = {"calls": 0, "cost": 0.0}
        monthly[key]["calls"] += log.tokens_or_calls
        monthly[key]["cost"] += float(log.cost)

    invoices = []
    for month_key, data in sorted(monthly.items(), reverse=True):
        invoices.append(InvoiceItem(
            invoice_id=f"INV-{uuid.uuid4().hex[:8].upper()}",
            period=month_key,
            total_calls=data["calls"],
            total_cost=round(data["cost"], 4),
            currency="EUR",
            status="paid" if data["cost"] > 0 else "free",
        ))

    return invoices
