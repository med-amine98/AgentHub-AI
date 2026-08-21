from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
import datetime
from decimal import Decimal

from ..database import get_db
from .. import models, schemas, auth

router = APIRouter(
    prefix="/api/admin",
    tags=["Admin"]
)


@router.get("/stats", response_model=schemas.PlatformStats)
def get_platform_stats(
    db: Session = Depends(get_db),
    admin: models.User = Depends(auth.get_admin_user)
):
    """Retrieve global platform statistics for admin dashboard."""
    total_users = db.query(models.User).count()
    total_agents = db.query(models.Agent).count()
    total_subscriptions = db.query(models.Subscription).filter(models.Subscription.status == "active").count()
    
    usage_logs = db.query(models.UsageLog).all()
    total_usage_calls = sum(log.tokens_or_calls for log in usage_logs)
    total_revenue_eur = float(sum(log.cost for log in usage_logs))

    # Calculate this month's stats
    now = datetime.datetime.utcnow()
    first_of_month = datetime.datetime(now.year, now.month, 1)

    users_this_month = db.query(models.User).filter(models.User.created_at >= first_of_month).count()
    monthly_logs = db.query(models.UsageLog).filter(models.UsageLog.timestamp >= first_of_month).all()
    calls_this_month = sum(log.tokens_or_calls for log in monthly_logs)

    return schemas.PlatformStats(
        total_users=total_users,
        total_agents=total_agents,
        total_subscriptions=total_subscriptions,
        total_usage_calls=total_usage_calls,
        total_revenue_eur=round(total_revenue_eur, 2),
        users_this_month=users_this_month,
        calls_this_month=calls_this_month
    )


@router.get("/users", response_model=List[schemas.UserAdminResponse])
def list_users(
    db: Session = Depends(get_db),
    admin: models.User = Depends(auth.get_admin_user)
):
    """List all registered users with their statistics."""
    users = db.query(models.User).order_by(models.User.created_at.desc()).all()
    result = []
    for u in users:
        sub_count = db.query(models.Subscription).filter(
            models.Subscription.user_id == u.id,
            models.Subscription.status == "active"
        ).count()
        use_count = db.query(models.UsageLog).filter(models.UsageLog.user_id == u.id).count()
        result.append(schemas.UserAdminResponse(
            id=u.id,
            email=u.email,
            role=u.role,
            created_at=u.created_at,
            subscription_count=sub_count,
            usage_count=use_count
        ))
    return result


@router.put("/users/{user_id}/role", response_model=schemas.UserResponse)
def update_user_role(
    user_id: int,
    role_in: schemas.UserRoleUpdate,
    db: Session = Depends(get_db),
    admin: models.User = Depends(auth.get_admin_user)
):
    """Change a user's role (admin or user)."""
    if role_in.role not in ["admin", "user"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le rôle doit être soit 'admin' soit 'user'."
        )
    
    target_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Utilisateur non trouvé")
    
    if target_user.id == admin.id and role_in.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vous ne pouvez pas retirer vos propres droits d'administrateur."
        )

    target_user.role = role_in.role
    db.commit()
    db.refresh(target_user)
    return target_user


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: models.User = Depends(auth.get_admin_user)
):
    """Delete a user account."""
    if user_id == admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vous ne pouvez pas supprimer votre propre compte administrateur."
        )
    
    target_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Utilisateur non trouvé")
    
    db.delete(target_user)
    db.commit()
    return None


@router.get("/agents", response_model=List[schemas.AgentAdminResponse])
def list_admin_agents(
    db: Session = Depends(get_db),
    admin: models.User = Depends(auth.get_admin_user)
):
    """List all agents with usage and subscriber metrics."""
    agents = db.query(models.Agent).all()
    result = []
    for a in agents:
        sub_count = db.query(models.Subscription).filter(
            models.Subscription.agent_id == a.id,
            models.Subscription.status == "active"
        ).count()
        use_count = db.query(models.UsageLog).filter(models.UsageLog.agent_id == a.id).count()
        
        result.append(schemas.AgentAdminResponse(
            id=a.id,
            name=a.name,
            description=a.description,
            category=a.category,
            tier=a.tier,
            price_month=a.price_month,
            price_use=a.price_use,
            input_schema=a.input_schema,
            output_schema=a.output_schema,
            system_prompt=a.system_prompt,
            created_at=a.created_at,
            subscription_count=sub_count,
            usage_count=use_count
        ))
    return result


@router.post("/agents", response_model=schemas.AgentResponse, status_code=status.HTTP_201_CREATED)
def create_admin_agent(
    agent_in: schemas.AgentCreate,
    db: Session = Depends(get_db),
    admin: models.User = Depends(auth.get_admin_user)
):
    """Create a new AI agent."""
    existing = db.query(models.Agent).filter(models.Agent.id == agent_in.id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Un agent avec l'identifiant '{agent_in.id}' existe déjà."
        )
    
    db_agent = models.Agent(**agent_in.model_dump())
    db.add(db_agent)
    db.commit()
    db.refresh(db_agent)
    return db_agent


@router.put("/agents/{agent_id}", response_model=schemas.AgentResponse)
def update_admin_agent(
    agent_id: str,
    agent_in: schemas.AgentUpdate,
    db: Session = Depends(get_db),
    admin: models.User = Depends(auth.get_admin_user)
):
    """Update an existing AI agent."""
    db_agent = db.query(models.Agent).filter(models.Agent.id == agent_id).first()
    if not db_agent:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent non trouvé")
    
    update_data = agent_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_agent, field, value)
    
    db.commit()
    db.refresh(db_agent)
    return db_agent


@router.delete("/agents/{agent_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_admin_agent(
    agent_id: str,
    db: Session = Depends(get_db),
    admin: models.User = Depends(auth.get_admin_user)
):
    """Delete an AI agent."""
    db_agent = db.query(models.Agent).filter(models.Agent.id == agent_id).first()
    if not db_agent:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent non trouvé")
    
    db.delete(db_agent)
    db.commit()
    return None


@router.get("/usage-logs", response_model=List[schemas.AdminUsageLogResponse])
def list_admin_usage_logs(
    limit: int = 50,
    db: Session = Depends(get_db),
    admin: models.User = Depends(auth.get_admin_user)
):
    """Retrieve recent usage activity across all users."""
    logs = db.query(models.UsageLog).order_by(models.UsageLog.timestamp.desc()).limit(limit).all()
    
    # Pre-fetch users for email resolution
    user_ids = {log.user_id for log in logs}
    users_map = {u.id: u.email for u in db.query(models.User).filter(models.User.id.in_(user_ids)).all()} if user_ids else {}

    result = []
    for log in logs:
        result.append(schemas.AdminUsageLogResponse(
            id=log.id,
            user_id=log.user_id,
            user_email=users_map.get(log.user_id, "Inconnu"),
            agent_id=log.agent_id,
            tokens_or_calls=log.tokens_or_calls,
            cost=float(log.cost),
            timestamp=log.timestamp
        ))
    return result
