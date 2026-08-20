from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
import datetime
from decimal import Decimal

from ..database import get_db
from .. import models, schemas, auth

router = APIRouter(
    prefix="/api/agents",
    tags=["Agents"]
)

@router.get("", response_model=List[schemas.AgentResponse])
def list_agents(
    category: Optional[str] = None,
    tier: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Agent)
    if category:
        query = query.filter(models.Agent.category == category)
    if tier:
        query = query.filter(models.Agent.tier == tier)
    return query.all()

@router.get("/{agent_id}", response_model=schemas.AgentResponse)
def get_agent(agent_id: str, db: Session = Depends(get_db)):
    agent = db.query(models.Agent).filter(models.Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Agent with ID '{agent_id}' not found"
        )
    return agent

@router.post("", response_model=schemas.AgentResponse, status_code=status.HTTP_201_CREATED)
def create_agent(
    agent_in: schemas.AgentCreate,
    db: Session = Depends(get_db),
    admin: models.User = Depends(auth.get_admin_user)
):
    existing = db.query(models.Agent).filter(models.Agent.id == agent_in.id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Agent with this ID already exists"
        )
    
    db_agent = models.Agent(**agent_in.model_dump())
    db.add(db_agent)
    db.commit()
    db.refresh(db_agent)
    return db_agent

def simulate_agent_execution(agent_id: str, inputs: dict) -> dict:
    """
    Simulates a smart response for each agent type based on input keys.
    """
    # === 1. FINANCE & BUSINESS ===
    if agent_id == "finance-agent":
        rev = float(inputs.get("revenue", 50000))
        exp = float(inputs.get("expenses", 35000))
        cf = rev - exp
        burn = exp / 3.0
        return {
            "cash_flow": round(cf, 2),
            "burn_rate": round(burn, 2),
            "analysis": f"La trésorerie du trimestre est positive de {round(cf, 2)} €. Le taux de dépenses mensuel moyen est de {round(burn, 2)} €."
        }
    elif agent_id == "cfo-agent":
        goal = inputs.get("business_goal", "Optimisation")
        reserve = float(inputs.get("cash_reserve", 10000))
        return {
            "strategic_plan": f"Pour atteindre l'objectif '{goal}', il est recommandé d'allouer 30% des {reserve} € de réserves en R&D et de renégocier les contrats fournisseurs.",
            "risk_assessment": "Risque modéré sur les taux d'intérêt, haute liquidité disponible."
        }
    elif agent_id == "accounting-agent":
        desc = inputs.get("transaction_desc", "Achat")
        return {
            "category": "SaaS / Logiciel" if "aws" in desc.lower() or "adobe" in desc.lower() else "Fournitures bureau",
            "vat_amount": 20.0,
            "reconciliation_status": "Rapproché automatiquement avec la facture correspondante."
        }
    elif agent_id == "financial-forecast-agent":
        hist = inputs.get("historical_data", "10000")
        rate = float(inputs.get("growth_rate", 5)) / 100
        return {
            "next_6_months": ["Mois 1: +5%", "Mois 2: +10%", "Mois 3: +15%", "Mois 4: +20%", "Mois 5: +25%", "Mois 6: +30%"],
            "forecast_summary": f"Sur la base de la tendance et d'une croissance de {rate*100}%, les revenus prévisionnels pour les 6 prochains mois affichent une trajectoire haussière stable."
        }
    elif agent_id == "fraud-detection-agent":
        return {
            "risk_score": 85.5,
            "flagged_transactions": ["TX-9982 (3000.00 €)"],
            "reason": "Indice de risque élevé : transaction initiée depuis un pays tiers inhabituel dans un délai de 5 minutes après une transaction locale."
        }
    elif agent_id == "business-analyst-agent":
        kpis = inputs.get("kpis", "CAC: 50€")
        return {
            "performance_evaluation": f"L'analyse des indicateurs '{kpis}' montre une performance solide, mais le taux d'attrition (churn) est légèrement au-dessus du benchmark sectoriel.",
            "actionable_recommendations": ["1. Lancer une campagne de rétention", "2. Réduire le CAC via du référencement naturel (SEO)"]
        }

    # === 2. HR & RECRUITMENT ===
    elif agent_id == "hr-agent":
        query = inputs.get("employee_query", "")
        return {
            "response": f"En réponse à '{query}' : Selon la convention collective, vous bénéficiez de 25 jours de congés payés par an + RTT légaux.",
            "required_form": "Formulaire de demande de congés (disponible sur l'intranet)"
        }
    elif agent_id == "recruitment-agent":
        cv = inputs.get("cv_text", "")
        return {
            "match_score": 78,
            "strengths": ["Bonne maîtrise des langages demandés", "Expérience en environnement agile"],
            "weaknesses": ["Manque de certification cloud", "Expérience managériale limitée"]
        }
    elif agent_id == "talent-agent":
        skills = inputs.get("candidate_skills", "")
        return {
            "recommended_position": "Développeur Fullstack (React / Python)",
            "justification": f"Le profil possède les compétences clés requises : '{skills}'."
        }
    elif agent_id == "interview-agent":
        profile = inputs.get("candidate_profile", "")
        return {
            "interview_questions": [
                "Décrivez un projet complexe réalisé avec React/Python.",
                "Comment gérez-vous la dette technique dans vos projets ?",
                "Donnez un exemple de résolution de conflit en équipe."
            ],
            "assessment_rubric": "Grille d'évaluation : Compétences Techniques (1-5), Communication (1-5), Fit Culturel (1-5)"
        }
    elif agent_id == "employee-assistant":
        query = inputs.get("query", "")
        return {
            "answer": f"Voici les informations concernant votre demande '{query}' : Les demandes de mutuelle doivent être soumises avant le 5 de chaque mois."
        }
    elif agent_id == "hr-analytics-agent":
        return {
            "turnover_analysis": "Le taux de turnover a baissé de 2% ce trimestre grâce aux nouveaux programmes de onboarding.",
            "workforce_forecast": "Besoin estimé de 4 nouveaux ingénieurs et 2 commerciaux pour le semestre prochain."
        }

    # === 3. MARKETING ===
    elif agent_id == "marketing-agent" or agent_id == "marketing-slogan":
        company = inputs.get("company_name", inputs.get("product_name", "Startup"))
        desc = inputs.get("product_desc", inputs.get("target_audience", "marché cible"))
        return {
            "slogans": [
                f"{company} : L'avenir du futur, dès aujourd'hui.",
                f"Simplifiez votre vie avec {company}.",
                f"Pourquoi chercher ailleurs ? {company} répond à vos besoins pour {desc}."
            ],
            "pitch": f"Découvrez {company}, la solution révolutionnaire conçue spécifiquement pour répondre à la problématique de {desc}. Rapide, fiable et innovante.",
            "suggested_channels": ["LinkedIn (B2B)", "Google Ads (Search)", "Content Marketing (SEO)"],
            "strategy_overview": f"Stratégie axée sur le positionnement de {company} comme leader innovant auprès des {desc}."
        }
    elif agent_id == "content-creator-agent":
        topic = inputs.get("topic", "IA")
        return {
            "title": f"L'Impact Révolutionnaire de : {topic}",
            "body_html": f"<p>Dans le monde moderne, {topic} redéfinit les règles du jeu. Les entreprises qui l'adoptent multiplient leur efficacité par 3.</p>",
            "meta_description": f"Découvrez comment {topic} transforme l'industrie et comment l'implémenter facilement."
        }
    elif agent_id == "social-media-agent":
        ann = inputs.get("announcement", "Nouveauté")
        return {
            "linkedin_post": f"🚀 Grande nouvelle ! {ann}. Nous sommes fiers de vous présenter cette innovation. #IA #SaaS",
            "x_post": f"🔥 Nouvelle annonce : {ann} ! Découvrez-en plus sur notre site. #Innovation",
            "suggested_hashtags": ["IA", "Tech", "Productivité", "SaaS"]
        }
    elif agent_id == "seo-agent":
        kw = inputs.get("target_keyword", "marketing")
        return {
            "keyword_difficulty": "Moyenne (Score: 45/100)",
            "recommended_headers": ["H1: Guide complet sur " + kw, "H2: Pourquoi choisir cette méthode ?", "H2: 3 étapes pour réussir"],
            "backlink_strategy": "Cibler des blogs technologiques invités et optimiser le maillage interne."
        }
    elif agent_id == "ads-agent":
        benefit = inputs.get("product_benefit", "Gain de temps")
        return {
            "headline": f"Économisez grâce à notre solution",
            "primary_text": f"Marre de perdre des heures ? Notre produit vous permet : {benefit}. Essayez-le gratuitement !",
            "call_to_action": "En savoir plus"
        }
    elif agent_id == "brand-agent":
        val = inputs.get("core_values", "Qualité")
        return {
            "brand_voice": "Professionnelle, chaleureuse et axée sur la transparence.",
            "positioning_statement": f"La marque de confiance pour les professionnels exigeants, bâtie sur : {val}."
        }

    # === 4. SALES ===
    elif agent_id == "sales-agent":
        offering = inputs.get("offering", "Solution")
        return {
            "sales_script": f"Bonjour, je vous appelle car j'ai vu que vous cherchez à améliorer votre gestion de {offering}...",
            "objection_handling": ["Objection Prix -> Mettre en avant le ROI", "Objection Temps -> Expliquer la simplicité d'installation"]
        }
    elif agent_id == "lead-generation-agent":
        icp = inputs.get("icp", "PME")
        return {
            "potential_leads": [
                {"company": "TechCorp", "contact": "cto@techcorp.com", "reason": "Correspond à l'ICP"},
                {"company": "RetailSoft", "contact": "sales@retailsoft.com", "reason": "Intérêt manifesté sur LinkedIn"}
            ],
            "enrichment_tips": "Cibler les décideurs qui ont posté sur le recrutement récemment."
        }
    elif agent_id == "lead-scoring-agent":
        data = inputs.get("interaction_data", "")
        return {
            "score": 85,
            "tier": "Hot Lead (Priorité A)",
            "action_required": "Prendre contact par téléphone sous 24 heures."
        }
    elif agent_id == "sales-email-agent":
        name = inputs.get("prospect_name", "Client")
        ctx = inputs.get("prospect_context", "")
        return {
            "subject_line": f"Partenariat potentiel avec votre entreprise - {ctx}",
            "email_body": f"Bonjour {name},\n\nJ'ai suivi votre actualité : '{ctx}'. Chez AgentHub AI, nous aidons les entreprises comme la vôtre à automatiser leurs tâches grâce à l'IA..."
        }
    elif agent_id == "crm-agent":
        return {
            "deal_stage": "Proposition envoyée",
            "next_steps": ["1. Envoyer le contrat", "2. Planifier l'appel de suivi"],
            "clean_json": '{"status": "negotiation", "value": 5000}'
        }
    elif agent_id == "sales-forecast-agent":
        return {
            "weighted_forecast": 45000.00,
            "confidence_interval": "Entre 40k € et 52k € (Niveau de confiance 90%)"
        }

    # === 5. DATA & BI ===
    elif agent_id == "data-analyzer-agent" or agent_id == "data-analyzer":
        nums_str = inputs.get("numbers_list", "1, 2, 3")
        try:
            nums = [float(x.strip()) for x in nums_str.split(",") if x.strip()]
            mean = sum(nums) / len(nums)
            return {
                "mean": round(mean, 2),
                "median": nums[len(nums)//2],
                "analysis": f"Calcul statistique effectué sur {len(nums)} nombres. Moyenne : {round(mean, 2)}."
            }
        except Exception:
            return {"error": "Format de données invalide."}
    elif agent_id == "bi-agent":
        b_type = inputs.get("business_type", "SaaS")
        return {
            "recommended_kpis": [f"1. LTV/CAC ({b_type})", "2. Churn Mensuel", "3. MRR & ARR"],
            "dashboard_layout": "3 indicateurs en haut, graphique linéaire des ventes au milieu, tableau détaillé en bas."
        }
    elif agent_id == "report-agent":
        raw = inputs.get("raw_data", "")
        return {
            "executive_summary": "Rapport résumé : Les indicateurs opérationnels affichent des progrès constants.",
            "full_report": f"### Rapport Complet\nDonnées analysées :\n{raw}\n\n*Recommandations : Maintenir l'effort de vente.*"
        }
    elif agent_id == "excel-agent":
        prob = inputs.get("problem_desc", "formule")
        return {
            "excel_formula": "=RECHERCHEV(A2, B:C, 2, FAUX)",
            "vba_code": "Sub Action()\n  MsgBox \"Formule appliquée\"\nEnd Sub"
        }
    elif agent_id == "power-bi-agent":
        need = inputs.get("query_need", "")
        return {
            "dax_formula": f"CalculatedSales = CALCULATE(SUM(Sales[Amount]), ALL(Sales[Date])) /* Pour {need} */",
            "visual_guidelines": "Utiliser un graphique en cascade (Waterfall chart) pour montrer les évolutions."
        }
    elif agent_id == "data-cleaning-agent":
        return {
            "clean_data_sample": "id,name,email\n1,Jean Dupont,jean@example.com",
            "anomalies_detected": ["Ligne 43: Email invalide (corrigé)", "Ligne 104: Doublon supprimé"]
        }

    # === 6. LEGAL & COMPLIANCE ===
    elif agent_id == "legal-agent":
        q = inputs.get("legal_question", "")
        return {
            "simplified_explanation": f"Explication simplifiée pour '{q}' : La loi encadre strictement ces délais. Par exemple, le préavis légal pour un bail commercial est généralement de 6 mois.",
            "relevant_code_articles": ["Article L145-9 du Code de commerce", "Article 1103 du Code civil"]
        }
    elif agent_id == "contract-agent":
        return {
            "risky_clauses": ["Clause de non-concurrence trop large géographiquement", "Pénalités de retard excessives (15% par jour)"],
            "suggested_modifications": ["Restreindre la clause au département", "Ramener les pénalités à 1.5 fois le taux légal"]
        }
    elif agent_id == "compliance-agent":
        desc = inputs.get("process_description", "")
        return {
            "compliance_score": 65.0,
            "violations": [f"Manque de consentement explicite (Opt-in) pour : '{desc}'", "Délai de conservation des données non spécifié"]
        }
    elif agent_id == "policy-agent":
        ptype = inputs.get("policy_type", "RGPD")
        return {
            "policy_template": f"# Politique de Sécurité - {ptype}\n\n1. Rôles et responsabilités\n2. Accès physiques et logiques\n3. Gestion des incidents."
        }
    elif agent_id == "risk-agent":
        return {
            "risks_matrix": ["Risque 1: Propriété intellectuelle (Fort)", "Risque 2: Conformité locale (Moyen)"],
            "mitigation_plan": "Mettre en place des contrats de cession de droits clairs avant le début du projet."
        }

    # === 7. PROCUREMENT & SUPPLY CHAIN ===
    elif agent_id == "procurement-agent":
        item = inputs.get("item_needed", "")
        return {
            "buying_strategy": f"Pour l'achat de '{item}', il est conseillé de faire un appel d'offres auprès de 3 grossistes et de négocier un paiement à 60 jours.",
            "estimated_pricing": "Ordinateurs: 800€ - 1200€ par unité selon spécifications."
        }
    elif agent_id == "supplier-agent":
        return {
            "cheapest_option": "Fournisseur A (500 € au total)",
            "best_value_option": "Fournisseur B (540 € avec garantie de 3 ans incluse)",
            "comparison_matrix": ["A: Prix bas, pas de garantie", "B: Prix moyen, garantie complète"]
        }
    elif agent_id == "supply-chain-agent":
        flow = inputs.get("supply_flow", "")
        return {
            "bottlenecks": ["Temps de dédouanement au port de Marseille (moyen: 5 jours)", "Dépendance à un seul transporteur terrestre"],
            "optimization_plan": f"Diversifier les transporteurs et utiliser le port de Gênes en alternative pour fluidifier : {flow}."
        }
    elif agent_id == "inventory-agent":
        sales = float(inputs.get("sales_rate", 10))
        stock = float(inputs.get("current_stock", 50))
        lead = float(inputs.get("lead_time_days", 5))
        reorder = sales * lead
        return {
            "safety_stock": round(sales * 2, 2),
            "reorder_point": round(reorder, 2),
            "forecast_status": "Stock suffisant pour 5 jours. Il faut commander dès que le stock atteint " + str(reorder) + " unités."
        }
    elif agent_id == "logistics-agent":
        return {
            "optimized_route": ["Départ Entrepôt", "Point A: Paris", "Point B: Lyon", "Retour"],
            "carrier_recommendation": "DHL Express pour la rapidité nationale."
        }
    elif agent_id == "purchase-agent":
        info = inputs.get("purchaser_info", "Acheteur")
        items = inputs.get("item_list", "")
        return {
            "purchase_order": f"BONS DE COMMANDE #10293\nÉmis par: {info}\nArticles: {items}\nStatut: En attente d'approbation financière"
        }

    # === 8. CUSTOMER SERVICE ===
    elif agent_id == "customer-support-agent":
        msg = inputs.get("customer_message", "")
        return {
            "support_response": f"Bonjour, merci pour votre message : '{msg}'. Nous sommes désolés pour ce désagrément. Veuillez nous retourner l'article pour un remboursement complet."
        }
    elif agent_id == "ticket-agent":
        content = inputs.get("ticket_content", "")
        is_urgent = "urgence" in content.lower() or "hors ligne" in content.lower() or "panne" in content.lower()
        return {
            "priority": "Haute (P1)" if is_urgent else "Moyenne (P3)",
            "department": "Infrastructure / Support Technique" if is_urgent else "Support Facturation",
            "suggested_tags": ["Urgent", "Infrastructure"]
        }
    elif agent_id == "customer-success-agent":
        return {
            "churn_risk": "Faible (Score 15/100)",
            "action_plan": "Envoyer un e-mail de remerciement et proposer une démonstration de la nouvelle mise à jour."
        }
    elif agent_id == "voice-support-agent":
        flow = inputs.get("ivr_flow", "")
        return {
            "voice_script": f"Assistant vocal: Bonjour. Vous m'appelez pour '{flow}'. Veuillez prononcer 'oui' pour confirmer ou expliquez votre problème...",
            "recommended_tone": "Calme, professionnel et débit modéré."
        }
    elif agent_id == "knowledge-agent":
        question = inputs.get("question", "")
        return {
            "answer": f"Voici ce que dit notre base de connaissances concernant '{question}' : Le remboursement est possible sous 14 jours.",
            "source_referenced": "FAQ Section 4.2 - Conditions de Retours"
        }

    # === 9. IT & DEVELOPMENT ===
    elif agent_id == "developer-agent":
        lang = inputs.get("programming_language", "Python")
        req = inputs.get("request", "trier")
        return {
            "code": f"def process_data():\n    # Résolution de la requête: {req}\n    data = [5, 2, 8, 1]\n    return sorted(data) if '{lang}'.lower() == 'python' else None",
            "explanation": f"Voici une implémentation propre en {lang} répondant à la demande."
        }
    elif agent_id == "code-review-agent":
        return {
            "bugs_found": ["Ligne 12: Possibilité de Division par zéro si la liste est vide"],
            "security_flaws": ["Ligne 4: Injection SQL potentielle via concaténation brute"],
            "refactoring_suggestion": "Utiliser des requêtes SQL paramétrées et extraire la logique de tri dans une fonction pure."
        }
    elif agent_id == "devops-agent":
        return {
            "config_file": "name: CI\non: [push]\njobs:\n  build:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v2\n      - run: npm install && npm test",
            "steps_explanation": "Ce workflow se lance à chaque push, récupère le code, installe les dépendances et lance les tests unitaires."
        }
    elif agent_id == "database-agent":
        db = inputs.get("db_dialect", "SQL")
        prob = inputs.get("sql_problem", "")
        return {
            "generated_sql": f"SELECT u.id, COUNT(o.id) FROM users u LEFT JOIN orders o ON u.id = o.user_id GROUP BY u.id; -- Résout: {prob}",
            "optimizations_done": "Création d'un index composé sur (user_id, status) pour accélérer la jointure."
        }
    elif agent_id == "cybersecurity-agent":
        return {
            "vulnerability_detected": "Exposition accidentelle d'une clé API en clair dans les variables d'environnement frontend.",
            "cve_reference": "CWE-522: Insufficiently Protected Credentials",
            "mitigation_code": "Déplacer la clé côté backend et utiliser un proxy d'API sécurisé."
        }
    elif agent_id == "it-support-agent":
        inc = inputs.get("incident", "")
        return {
            "troubleshooting_steps": [
                f"1. Vérifier si le problème '{inc}' persiste en changeant de réseau (WiFi vers partage de connexion).",
                "2. Réinstaller le profil de configuration VPN fourni par le service informatique.",
                "3. Contacter l'administrateur réseau si le serveur distant ne répond pas au ping."
            ]
        }

    # Fallback/Backward compatibility
    elif agent_id == "translator":
        text = inputs.get("text", "Bonjour tout le monde")
        lang = inputs.get("target_language", "english").lower()
        translations = {"english": "Hello everyone", "spanish": "Hola a todos", "german": "Hallo allerseits"}
        translated = translations.get(lang, f"[Traduction simulée en {lang}] : {text}")
        return {
            "translated_text": translated,
            "target_language": lang,
            "char_count": len(text)
        }

    return {
        "message": f"L'agent '{agent_id}' a été exécuté avec succès.",
        "received_inputs": inputs
    }

@router.post("/{agent_id}/execute", response_model=schemas.AgentExecuteResponse)
def execute_agent(
    agent_id: str,
    inputs_in: schemas.AgentExecuteInput,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    agent = db.query(models.Agent).filter(models.Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found"
        )

    # Subscription Check if Agent is Premium or Enterprise
    if agent.tier in ["premium", "enterprise"]:
        subscription = db.query(models.Subscription).filter(
            models.Subscription.user_id == current_user.id,
            models.Subscription.agent_id == agent_id,
            models.Subscription.status == "active"
        ).first()

        # Admins bypass subscription check
        if not subscription and current_user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Vous devez être abonné à l'agent '{agent.name}' pour l'utiliser."
            )
            
    # Execute the simulation
    output_data = simulate_agent_execution(agent_id, inputs_in.inputs)
    
    # Calculate dummy cost based on tier
    cost_map = {"free": 0.0, "premium": 0.05, "enterprise": 0.20}
    cost = cost_map.get(agent.tier, 0.0)

    # Log usage
    log = models.UsageLog(
        user_id=current_user.id,
        agent_id=agent_id,
        tokens_or_calls=1,
        cost=Decimal(str(cost))
    )
    db.add(log)
    db.commit()

    return {
        "agent_id": agent_id,
        "status": "success",
        "output": output_data,
        "usage": {
            "calls": 1,
            "cost": float(cost),
            "timestamp": datetime.datetime.utcnow().isoformat()
        }
    }
