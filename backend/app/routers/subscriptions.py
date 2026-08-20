from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import datetime

from ..database import get_db
from .. import models, schemas, auth

router = APIRouter(
    prefix="/api/subscriptions",
    tags=["Subscriptions"]
)

@router.get("", response_model=List[schemas.SubscriptionResponse])
def get_my_subscriptions(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    return db.query(models.Subscription).filter(
        models.Subscription.user_id == current_user.id,
        models.Subscription.status == "active"
    ).all()

@router.post("/subscribe", response_model=schemas.SubscriptionResponse)
def subscribe_to_agent(
    sub_in: schemas.SubscriptionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # Verify agent exists
    agent = db.query(models.Agent).filter(models.Agent.id == sub_in.agent_id).first()
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found"
        )

    # Check if already active subscription exists
    existing = db.query(models.Subscription).filter(
        models.Subscription.user_id == current_user.id,
        models.Subscription.agent_id == sub_in.agent_id,
        models.Subscription.status == "active"
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Vous êtes déjà abonné à l'agent '{agent.name}'"
        )
    
    # Create subscription
    subscription = models.Subscription(
        user_id=current_user.id,
        agent_id=sub_in.agent_id,
        status="active",
        start_date=datetime.datetime.utcnow()
    )
    db.add(subscription)
    db.commit()
    db.refresh(subscription)
    return subscription

@router.post("/unsubscribe", response_model=schemas.SubscriptionResponse)
def unsubscribe_from_agent(
    sub_in: schemas.SubscriptionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    subscription = db.query(models.Subscription).filter(
        models.Subscription.user_id == current_user.id,
        models.Subscription.agent_id == sub_in.agent_id,
        models.Subscription.status == "active"
    ).first()

    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Abonnement actif non trouvé pour cet agent"
        )
    
    subscription.status = "cancelled"
    subscription.end_date = datetime.datetime.utcnow()
    db.commit()
    db.refresh(subscription)
    return subscription
