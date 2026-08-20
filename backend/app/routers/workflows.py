from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from ..database import get_db
from .. import models, schemas, auth
from .agents import simulate_agent_execution

router = APIRouter(
    prefix="/api/workflows",
    tags=["Workflows"]
)

@router.get("", response_model=List[schemas.WorkflowResponse])
def list_workflows(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    return db.query(models.Workflow).filter(models.Workflow.user_id == current_user.id).all()

@router.post("", response_model=schemas.WorkflowResponse, status_code=status.HTTP_201_CREATED)
def create_workflow(
    wf_in: schemas.WorkflowCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # Validate that all agents in the workflow definition exist
    for step in wf_in.definition:
        agent_id = step.get("agent_id")
        if not agent_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Chaque étape du workflow doit contenir un 'agent_id'"
            )
        agent = db.query(models.Agent).filter(models.Agent.id == agent_id).first()
        if not agent:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"L'agent '{agent_id}' spécifié dans le workflow n'existe pas."
            )

    db_wf = models.Workflow(
        user_id=current_user.id,
        name=wf_in.name,
        description=wf_in.description,
        definition=wf_in.definition
    )
    db.add(db_wf)
    db.commit()
    db.refresh(db_wf)
    return db_wf

@router.get("/{workflow_id}", response_model=schemas.WorkflowResponse)
def get_workflow(
    workflow_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    wf = db.query(models.Workflow).filter(
        models.Workflow.id == workflow_id,
        models.Workflow.user_id == current_user.id
    ).first()
    if not wf:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow non trouvé"
        )
    return wf

@router.delete("/{workflow_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_workflow(
    workflow_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    wf = db.query(models.Workflow).filter(
        models.Workflow.id == workflow_id,
        models.Workflow.user_id == current_user.id
    ).first()
    if not wf:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow non trouvé"
        )
    db.delete(wf)
    db.commit()
    return

@router.post("/{workflow_id}/run", response_model=schemas.WorkflowRunResponse)
def run_workflow(
    workflow_id: int,
    input_data: schemas.WorkflowRunInput,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    wf = db.query(models.Workflow).filter(
        models.Workflow.id == workflow_id,
        models.Workflow.user_id == current_user.id
    ).first()
    if not wf:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow non trouvé"
        )

    # Initialize execution state
    state = {**input_data.initial_inputs}
    results = []

    for index, step in enumerate(wf.definition):
        agent_id = step.get("agent_id")
        input_mappings = step.get("input_mappings", {})

        agent = db.query(models.Agent).filter(models.Agent.id == agent_id).first()
        if not agent:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"L'agent '{agent_id}' n'existe plus."
            )

        # Check permission (same as direct execute)
        if agent.tier in ["premium", "enterprise"] and current_user.role != "admin":
            subscription = db.query(models.Subscription).filter(
                models.Subscription.user_id == current_user.id,
                models.Subscription.agent_id == agent_id,
                models.Subscription.status == "active"
            ).first()
            if not subscription:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Workflow bloqué : vous devez être abonné à l'agent payant '{agent.name}' ({agent_id})."
                )

        # Resolve inputs for this step using the mapping
        step_inputs = {}
        for target_key, source_key in input_mappings.items():
            if source_key in state:
                step_inputs[target_key] = state[source_key]
            else:
                # Fallback: check if the target_key itself exists in state
                step_inputs[target_key] = state.get(target_key)
        
        # If no mapping was specified, try to populate inputs from state directly
        if not step_inputs and agent.input_schema:
            for expected_key in agent.input_schema.keys():
                if expected_key in state:
                    step_inputs[expected_key] = state[expected_key]

        # Execute simulation
        step_outputs = simulate_agent_execution(agent_id, step_inputs)

        # Log usage in db
        cost_map = {"free": 0.0, "premium": 0.05, "enterprise": 0.20}
        cost = cost_map.get(agent.tier, 0.0)
        log = models.UsageLog(
            user_id=current_user.id,
            agent_id=agent_id,
            tokens_or_calls=1,
            cost=cost
        )
        db.add(log)

        # Update state with this step's outputs
        # We can store with agent_id prefix and also merge directly
        for out_key, out_val in step_outputs.items():
            state[out_key] = out_val
            # Also support step prefix like "step_0_slogans" or "marketing-slogan_slogans"
            state[f"step_{index}_{out_key}"] = out_val
            state[f"{agent_id}_{out_key}"] = out_val

        results.append(
            schemas.WorkflowRunStepResult(
                step_index=index,
                agent_id=agent_id,
                agent_name=agent.name,
                inputs=step_inputs,
                outputs=step_outputs
            )
        )

    db.commit()

    return schemas.WorkflowRunResponse(
        workflow_id=wf.id,
        status="completed",
        results=results,
        final_output=state
    )
