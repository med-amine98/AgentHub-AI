from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from decimal import Decimal
import datetime

from ..database import get_db
from .. import models, schemas, auth
from .agents import simulate_agent_execution, gemini_execution

router = APIRouter(
    prefix="/api/workflows",
    tags=["Workflows"]
)

# ─── High-Value Prebuilt Workflow Templates ──────────────────────────────────

WORKFLOW_TEMPLATES = [
    {
        "id": "tpl-marketing-360",
        "name": "Campagne Marketing & SEO 360°",
        "category": "marketing",
        "badge": "Marketing 360°",
        "description": "Orchestre la stratégie de marque, la rédaction d'un article de blog complet, l'optimisation SEO et la création des publications LinkedIn/X en une seule exécution.",
        "estimated_time_saved_hours": 4.5,
        "estimated_value_eur": 180.0,
        "sample_inputs": {
            "company_name": "NovaSaaS AI",
            "product_desc": "Plateforme d'automatisation intelligente pour les PME",
            "topic": "Comment l'IA multiplie la productivité des équipes par 3",
            "target_keyword": "automatisation IA entreprise",
            "announcement": "Lancement officiel de NovaSaaS AI 2.0"
        },
        "definition": [
            {
                "agent_id": "marketing-agent",
                "input_mappings": {
                    "company_name": "company_name",
                    "product_desc": "product_desc"
                }
            },
            {
                "agent_id": "content-creator-agent",
                "input_mappings": {
                    "topic": "topic"
                }
            },
            {
                "agent_id": "seo-agent",
                "input_mappings": {
                    "target_keyword": "target_keyword"
                }
            },
            {
                "agent_id": "social-media-agent",
                "input_mappings": {
                    "announcement": "announcement"
                }
            }
        ]
    },
    {
        "id": "tpl-b2b-sales-pipeline",
        "name": "Pipeline Prospection & Scoring B2B",
        "category": "sales",
        "badge": "Ventes & Prospection",
        "description": "Identifie les prospects cibles selon votre ICP, évalue leur score de maturité d'achat et rédige un e-mail commercial d'accroche personnalisé.",
        "estimated_time_saved_hours": 3.0,
        "estimated_value_eur": 150.0,
        "sample_inputs": {
            "icp": "PME et ETI de services de 20 à 100 salariés cherchant à digitaliser leurs processus",
            "interaction_data": "Téléchargement du livre blanc et inscription au webinaire de démonstration",
            "prospect_name": "Alexandre Dupont, Directeur Général",
            "prospect_context": "Digitalisation des opérations et recherche de gains d'efficacité rapides"
        },
        "definition": [
            {
                "agent_id": "lead-generation-agent",
                "input_mappings": {
                    "icp": "icp"
                }
            },
            {
                "agent_id": "lead-scoring-agent",
                "input_mappings": {
                    "interaction_data": "interaction_data"
                }
            },
            {
                "agent_id": "sales-email-agent",
                "input_mappings": {
                    "prospect_name": "prospect_name",
                    "prospect_context": "prospect_context"
                }
            }
        ]
    },
    {
        "id": "tpl-cfo-audit-forecast",
        "name": "Audit Financier, Cash-Flow & Prévisions CFO",
        "category": "finance",
        "badge": "Finance & Trésorerie",
        "description": "Calcule la trésorerie nette et le burn-rate, émet les recommandations stratégiques d'arbitrage du CFO et génère les prévisions de revenus à 6 mois.",
        "estimated_time_saved_hours": 5.0,
        "estimated_value_eur": 250.0,
        "sample_inputs": {
            "revenue": "85000",
            "expenses": "42000",
            "business_goal": "Doubler la capacité serveur tout en maintenant 18 mois de runway",
            "cash_reserve": "300000",
            "growth_rate": "8"
        },
        "definition": [
            {
                "agent_id": "finance-agent",
                "input_mappings": {
                    "revenue": "revenue",
                    "expenses": "expenses"
                }
            },
            {
                "agent_id": "cfo-agent",
                "input_mappings": {
                    "business_goal": "business_goal",
                    "cash_reserve": "cash_reserve"
                }
            },
            {
                "agent_id": "financial-forecast-agent",
                "input_mappings": {
                    "growth_rate": "growth_rate"
                }
            }
        ]
    },
    {
        "id": "tpl-recruitment-screening",
        "name": "Recrutement, Match RH & Grille d'Entretien",
        "category": "hr",
        "badge": "Ressources Humaines",
        "description": "Analyse le CV du candidat, valide l'adéquation au poste visé et produit la grille complète de questions d'entretien technique & soft-skills.",
        "estimated_time_saved_hours": 3.5,
        "estimated_value_eur": 130.0,
        "sample_inputs": {
            "cv_text": "Développeur Fullstack 5 ans d'expérience React, Python, FastAPI, Docker, PostgreSQL. Conduite de projets agiles.",
            "candidate_skills": "React, Python, FastAPI, Architecture Microservices, SQL, CI/CD",
            "candidate_profile": "Développeur Fullstack Senior postulant pour le poste de Lead Tech"
        },
        "definition": [
            {
                "agent_id": "recruitment-agent",
                "input_mappings": {
                    "cv_text": "cv_text"
                }
            },
            {
                "agent_id": "talent-agent",
                "input_mappings": {
                    "candidate_skills": "candidate_skills"
                }
            },
            {
                "agent_id": "interview-agent",
                "input_mappings": {
                    "candidate_profile": "candidate_profile"
                }
            }
        ]
    },
    {
        "id": "tpl-code-devops-audit",
        "name": "Revue de Code, Audit Cybersécurité & CI/CD",
        "category": "it",
        "badge": "IT & Sécurité",
        "description": "Génère l'implémentation de la fonction requise, effectue la revue de code statique, analyse les vulnérabilités de sécurité et produit la configuration CI/CD.",
        "estimated_time_saved_hours": 4.0,
        "estimated_value_eur": 210.0,
        "sample_inputs": {
            "programming_language": "Python",
            "request": "Algorithme de traitement de données volumineuses avec filtrage et déduplication",
            "incident": "Lenteur constatée lors de l'accès aux endpoints d'exportation de données"
        },
        "definition": [
            {
                "agent_id": "developer-agent",
                "input_mappings": {
                    "programming_language": "programming_language",
                    "request": "request"
                }
            },
            {
                "agent_id": "code-review-agent",
                "input_mappings": {}
            },
            {
                "agent_id": "cybersecurity-agent",
                "input_mappings": {}
            },
            {
                "agent_id": "devops-agent",
                "input_mappings": {}
            }
        ]
    }
]


# ─── Endpoints ──────────────────────────────────────────────────────────────

@router.get("/templates")
def list_workflow_templates():
    """Returns the list of ready-to-use high-value workflow demo templates."""
    return WORKFLOW_TEMPLATES


@router.post("/from-template/{template_id}", response_model=schemas.WorkflowResponse)
def create_workflow_from_template(
    template_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Instantiate a pre-configured template into the current user's workspace."""
    template = next((t for t in WORKFLOW_TEMPLATES if t["id"] == template_id), None)
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Template de workflow '{template_id}' introuvable."
        )

    db_wf = models.Workflow(
        user_id=current_user.id,
        name=template["name"],
        description=template["description"],
        definition=template["definition"]
    )
    db.add(db_wf)
    db.commit()
    db.refresh(db_wf)
    return db_wf


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
    return None


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

        # Check permission (admins bypass subscription requirements)
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
                step_inputs[target_key] = state.get(target_key)
        
        # Fallback: if inputs not fully satisfied, match from global state
        if agent.input_schema:
            for expected_key in agent.input_schema.keys():
                if expected_key not in step_inputs or step_inputs[expected_key] is None:
                    if expected_key in state:
                        step_inputs[expected_key] = state[expected_key]

        # Execute via Gemini (if key present) or smart simulator
        step_outputs = gemini_execution(agent, step_inputs)
        if not step_outputs:
            step_outputs = simulate_agent_execution(agent_id, step_inputs)

        # Log usage in db
        cost_map = {"free": 0.0, "premium": 0.05, "enterprise": 0.20}
        cost = cost_map.get(agent.tier, 0.0)
        log = models.UsageLog(
            user_id=current_user.id,
            agent_id=agent_id,
            tokens_or_calls=1,
            cost=Decimal(str(cost))
        )
        db.add(log)

        # Update state with this step's outputs
        for out_key, out_val in step_outputs.items():
            state[out_key] = out_val
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
