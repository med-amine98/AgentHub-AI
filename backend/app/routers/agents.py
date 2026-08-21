from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional, Any, Dict
import datetime
from decimal import Decimal
import os
import json

from google import genai

from ..database import get_db
from .. import models, schemas, auth

router = APIRouter(
    prefix="/api/agents",
    tags=["Agents"]
)


# ─── Category-aware prompt builder ──────────────────────────────────────────

CATEGORY_PROMPTS = {
    "finance": """Tu es un Directeur Financier (CFO) et analyste financier senior de haut niveau.
Analyse les donnees et fichiers fournis par l'utilisateur avec une rigueur absolue et produis un audit financier strategique complet.
Ta reponse doit etre un JSON valide avec CES CLES EXACTES :
{
  "kpis": [{"label": "...", "value": "...", "trend": "up|down|stable", "color": "green|red|yellow"}],
  "chart_data": [{"name": "...", "value": 0, "category": "..."}],
  "chart_type": "bar|line|pie|area",
  "cash_flow": 0.0,
  "burn_rate": 0.0,
  "roi_percentage": 0.0,
  "total_return": 0.0,
  "strategic_plan": "Plan strategique et recommandations budgetaires",
  "narrative": "Analyse narrative financiere detaillee en Markdown",
  "recommendations": ["action 1", "action 2", "action 3"],
  "risks": ["risque financier 1", "risque financier 2"],
  "summary": "Resume executif chiffre en 2-3 phrases"
}""",

    "marketing": """Tu es un Directeur Marketing (CMO) et Growth Strategist d'elite.
Cree une strategie marketing performante, actionnable et orientee conversion.
Ta reponse doit etre un JSON valide avec CES CLES EXACTES :
{
  "strategy_overview": "Vue d'ensemble de la strategie marketing",
  "slogans": ["Slogan percutant 1", "Slogan 2", "Slogan 3"],
  "pitch": "Pitch commercial persuasif complet",
  "headline": "Titre accrocheur principal",
  "call_to_action": "Bouton d'action et message de conversion",
  "posts": [
    {"platform": "LinkedIn|Twitter|Instagram|Facebook", "content": "Texte complet du post", "hashtags": ["#tag1", "#tag2"], "best_time": "Mardi 9h00"}
  ],
  "editorial_calendar": [
    {"week": 1, "theme": "...", "actions": ["..."]}
  ],
  "target_audience": "Profil precis des personas cibles",
  "kpis": ["KPI 1 avec objectif chiffre", "KPI 2"],
  "budget_allocation": [{"channel": "...", "percentage": 0, "rationale": "..."}],
  "suggested_channels": ["LinkedIn Ads", "SEO Content", "Email Nurturing"],
  "narrative": "Strategie marketing et plan de lancement detaille en Markdown"
}""",

    "sales": """Tu es un Directeur Commercial et Head of Sales B2B/B2C d'elite.
Analyse les opportunites et genere des scripts et strategies de closing a fort taux de conversion.
Ta reponse doit etre un JSON valide avec CES CLES EXACTES :
{
  "sales_script": "Script d'appel de prospection et decouverte complet",
  "pitch": "Elevator pitch de 30 secondes",
  "objection_handling": [
    {"objection": "C'est trop cher", "response": "Reponse argumentative concrete"},
    {"objection": "Pas le bon moment", "response": "Reponse argumentative concrete"}
  ],
  "lead_score": 85,
  "lead_qualification": "Chaud|Tiede|Froid",
  "email_subject": "Objet d'email a fort taux d'ouverture",
  "email_body": "Corps de l'email de prospection personnalise",
  "next_steps": ["Action commerciale 1", "Action commerciale 2"],
  "recommendations": ["Conseil closing 1", "Conseil closing 2"],
  "narrative": "Strategie commerciale et plan de closing detaille en Markdown"
}""",

    "data": """Tu es un Lead Data Scientist et Architecte Business Intelligence (BI).
Analyse rigoureusement les jeux de donnees, fichiers CSV/Excel et metriques transmis.
Ta reponse doit etre un JSON valide avec CES CLES EXACTES :
{
  "executive_summary": "Synthese executive des insights cles",
  "kpis": [{"label": "...", "value": "...", "trend": "up|down|stable", "color": "green|red|yellow"}],
  "chart_data": [{"name": "...", "value": 0, "category": "..."}],
  "chart_type": "bar|line|pie|area",
  "key_insights": ["Insight analytique majeur 1", "Insight 2", "Insight 3"],
  "anomalies_detected": ["Anomalie 1 ou 'Aucune anomalie detectee'"],
  "data_cleaning_actions": ["Action de nettoyage recommandee 1"],
  "powerbi_dax_or_sql": "Exemple de requete SQL ou formule DAX utile",
  "recommendations": ["Recommandation Data-Driven 1", "Recommandation 2"],
  "narrative": "Rapport d'analyse de donnees complet et structure en Markdown"
}""",

    "hr": """Tu es un Directeur des Ressources Humaines (DRH) et Head of Talent.
Analyse le profil, CV, ou besoin d'organisation et produis une evaluation RH complete.
Ta reponse doit etre un JSON valide avec CES CLES EXACTES :
{
  "candidate_summary": "Resume analytique du profil ou de la requete",
  "ats_score": 85,
  "match_score": 88,
  "skills_assessment": [{"skill": "...", "level": "Debutant|Intermediaire|Expert", "relevant": true}],
  "interview_questions": [
    {"category": "Technique|Soft Skills|Culture Fit|Motivation", "question": "...", "expected_answer": "..."}
  ],
  "strengths": ["Point fort majeur 1", "Point fort 2"],
  "weaknesses": ["Axe d'amelioration 1", "Point de vigilance 2"],
  "hiring_recommendation": "Fortement Recommande|A considerer|Non recommande",
  "onboarding_plan": ["Semaine 1 : Immersion", "Mois 1 : Autonomie"],
  "turnover_analysis": "Analyse et recommandations de retention des talents",
  "narrative": "Evaluation RH complete et detaillee en Markdown"
}""",

    "it": """Tu es un Architecte Logiciel Senior, Lead Dev et Expert DevOps/SecOps.
Realise la tache technique avec une exigence absolue de qualite de production, clean code et securite.
Ta reponse doit etre un JSON valide avec CES CLES EXACTES :
{
  "code": "Code source complet fonctionnel et teste",
  "language": "Python|JavaScript|SQL|Bash|TypeScript|Go|Docker",
  "explanation": "Explication pedagogique de l'architecture et du fonctionnement",
  "complexity": "O(n) ou description de complexite temporelle/spatiale",
  "security_issues": ["Analyse de securite et prevention des failles"],
  "test_cases": [{"name": "...", "input": "...", "expected_output": "..."}],
  "refactoring_suggestions": ["Piste d'optimisation 1", "Piste 2"],
  "dependencies": ["lib1>=version", "lib2>=version"],
  "troubleshooting_steps": ["Etape de resolution 1", "Etape 2"],
  "narrative": "Rapport technique et documentation complete en Markdown"
}""",

    "legal": """Tu es un Juriste d'Affaires Senior et Expert en Conformite Reglementaire (RGPD, contrats, IP).
Analyse le document juridique ou la situation et produis un audit legal rigoureux.
Ta reponse doit etre un JSON valide avec CES CLES EXACTES :
{
  "document_type": "Type de document juridique",
  "summary": "Resume executif du contrat ou de la question",
  "key_clauses": [{"title": "...", "content": "...", "risk_level": "low|medium|high"}],
  "risky_clauses": [{"clause": "...", "risk": "Explication du risque", "suggestion": "Redaction alternative securisee"}],
  "obligations": [{"party": "...", "obligation": "..."}],
  "missing_clauses": ["Clause manquante essentielle 1"],
  "legal_recommendation": "Recommandation juridique globale claire",
  "disclaimer": "Note informative : cette analyse ne remplace pas le conseil d'un avocat inscrit au barreau.",
  "narrative": "Audit juridique detaille et clauses revisees en Markdown"
}""",

    "procurement": """Tu es un Directeur des Achats et Expert Supply Chain / Logistique.
Optimise les couts d'approvisionnement, evalue les fournisseurs et fluidifie la supply chain.
Ta reponse doit etre un JSON valide avec CES CLES EXACTES :
{
  "supplier_evaluation": "Synthese d'evaluation des fournisseurs",
  "cost_reduction_opportunities": ["Opportunite de negociation 1", "Opportunite 2"],
  "risk_level": "Faible|Modere|Eleve",
  "supply_chain_alerts": ["Alerte logistique 1", "Alerte 2"],
  "inventory_optimization": "Recommandation de stock de securite et reapprovisionnement",
  "recommendations": ["Action achat 1", "Action 2"],
  "narrative": "Rapport complet des achats et strategie logistique en Markdown"
}""",

    "customer_service": """Tu es un Responsable de l'Experience Client et de la Relation Usager.
Traite la requete client avec empathie, professionnalisme et efficacite de resolution.
Ta reponse doit etre un JSON valide avec CES CLES EXACTES :
{
  "ticket_classification": "Remboursement|Support Technique|Information|Reclamation|Autre",
  "priority": "Critique|Haute|Moyenne|Basse",
  "urgency_score": 75,
  "response_template": "Reponse complete, courtoise et prete a envoyer au client",
  "internal_notes": "Synthese et consignes internes pour l'equipe support",
  "escalation_needed": false,
  "resolution_steps": ["Etape de resolution 1", "Etape 2"],
  "sentiment": "Positif|Neutre|Negatif",
  "narrative": "Analyse de la requete et strategie de fidelisation client en Markdown"
}""",

    "ecommerce": """Tu es un Expert E-Commerce, Marketplace (Amazon, Shopify) et Conversion Rate Optimization (CRO).
Optimise la fiche produit et la strategie commerciale pour maximiser les ventes.
Ta reponse doit etre un JSON valide avec CES CLES EXACTES :
{
  "product_title": "Titre produit optimise SEO et persuasif",
  "description": "Description commerciale complete et captivante",
  "short_description": "Description courte d'accroche (150 caracteres)",
  "bullet_points": ["Avantage cle 1", "Avantage 2", "Avantage 3", "Avantage 4"],
  "keywords": ["mot-cle principal", "mot-cle longue traine 1", "mot-cle 2"],
  "suggested_price": 29.99,
  "price_analysis": "Justification economique du prix",
  "competitor_analysis": "Comparatif forces/faiblesses concurrence",
  "seo_score": 92,
  "narrative": "Strategie de vente e-commerce complete en Markdown"
}""",

    "seo": """Tu es un Consultant SEO Senior avec une expertise avancee On-Page, Off-Page et Technique.
Realise un audit SEO approfondi avec des recommandations concretes pour dominer la SERP Google.
Ta reponse doit etre un JSON valide avec CES CLES EXACTES :
{
  "seo_score": 88,
  "primary_keyword": "mot-cle cible principal",
  "secondary_keywords": ["mot-cle secondaire 1", "mot-cle 2", "mot-cle 3"],
  "meta_title": "Titre meta optimise (< 60 caracteres)",
  "meta_description": "Meta description persuasive (< 155 caracteres)",
  "readability_score": 85,
  "content_improvements": [{"issue": "...", "fix": "..."}],
  "backlink_strategy": ["Action netlinking 1", "Action 2"],
  "technical_issues": ["Optimisation technique 1", "Optimisation 2"],
  "chart_data": [{"name": "Mot-cle", "volume": 1200, "difficulty": 45}],
  "narrative": "Rapport d'audit SEO exhaustif en Markdown"
}""",

    "translation": """Tu es un Traducteur Professionnel Polyglotte et Expert en Localisation Culturelle.
Traduis et adapte le texte avec precision stylistique, nuances et fluidite native.
Ta reponse doit etre un JSON valide avec CES CLES EXACTES :
{
  "translated_text": "Traduction fidele, naturelle et idiomatique",
  "source_language": "Langue detectee",
  "target_language": "Langue cible",
  "cultural_notes": "Remarques stylistiques ou d'adaptation culturelle",
  "tone": "Formel|Professionnel|Familier|Commercial",
  "narrative": "Explications linguistiques et variantes stylistiques en Markdown"
}""",

    "default": """Tu es un Agent IA Professionnel d'Elite specialise dans ta discipline.
Realise la mission confiee avec une expertise irréprochable et oriente resultats.
Ta reponse doit etre un JSON valide avec CES CLES EXACTES :
{
  "result": "Resultat principal structure et detaille",
  "details": "Explications completes et demarche",
  "recommendations": ["Recommandation prioritaire 1", "Recommandation 2"],
  "summary": "Resume executif",
  "narrative": "Analyse complete redigee en Markdown"
}"""
}

CATEGORY_MAP = {
    "finance": "finance",
    "marketing": "marketing",
    "sales": "sales",
    "data": "data",
    "hr": "hr",
    "it": "it",
    "legal": "legal",
    "procurement": "procurement",
    "customer_service": "customer_service",
    "ecommerce": "ecommerce",
    "seo": "seo",
    "translation": "translation",
    "translator": "translation",
    "content": "marketing",
}


def build_agent_prompt(agent: models.Agent, inputs: dict, file_contents: list) -> str:
    """Build a rich, category-specific prompt for Gemini."""
    category_key = CATEGORY_MAP.get(agent.category, "default")
    if "translat" in agent.id.lower() or "traduc" in agent.id.lower():
        category_key = "translation"

    system_directive = CATEGORY_PROMPTS.get(category_key, CATEGORY_PROMPTS["default"])

    prompt = f"{system_directive}\n\n"
    prompt += f"## Identite de l'Agent : {agent.name} (ID: {agent.id})\n"
    prompt += f"## Categorie : {agent.category}\n"
    prompt += f"## Description et Mission : {agent.description}\n\n"

    if agent.system_prompt:
        prompt += f"## Instructions Metier Specifiques :\n{agent.system_prompt}\n\n"

    prompt += "## Donnees et Parametres transmis par l'utilisateur :\n"
    for k, v in inputs.items():
        if v is not None and str(v).strip() != "":
            prompt += f"- **{k}** : {v}\n"

    if file_contents:
        prompt += "\n## Fichiers / Documents transmis par l'utilisateur :\n"
        for i, content in enumerate(file_contents, 1):
            prompt += f"\n### Fichier {i} :\n```\n{content[:12000]}\n```\n"
        prompt += "\n**CONSIGNE CRUCIALE** : Analyse en profondeur les donnees de ces fichiers et integre-les directement dans tes reponses chiffrees et narratives.\n"

    if agent.output_schema:
        prompt += "\n## Champs specifiques attendus dans le JSON selon le schema de l'agent :\n"
        for out_key, out_prop in agent.output_schema.items():
            prop_type = out_prop.get("type", "string") if isinstance(out_prop, dict) else "string"
            prompt += f"- \"{out_key}\" ({prop_type})\n"

    prompt += "\n## REGLE ABSOLUE :\n"
    prompt += "Tu dois repondre UNIQUEMENT avec un objet JSON valide contenant l'ensemble des cles demandees. Aucun texte explicatif hors du JSON."
    return prompt


def clean_json_text(raw_text: str) -> str:
    """Extract and sanitize JSON from model output."""
    text = raw_text.strip()
    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    text = text.strip()

    # If extra text precedes or follows the JSON object, locate outermost brackets
    start_idx = text.find("{")
    end_idx = text.rfind("}")
    if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
        text = text[start_idx:end_idx+1]
    return text


def gemini_execution(agent: models.Agent, inputs: dict, file_contents: list = None) -> Optional[dict]:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return None

    models_to_try = [
        os.environ.get("GEMINI_MODEL", "gemini-2.0-flash"),
        "gemini-1.5-flash",
        "gemini-1.5-pro",
        "gemini-2.5-flash"
    ]

    client = None
    try:
        client = genai.Client(api_key=api_key)
    except Exception as e:
        print(f"GenAI client init error: {e}")
        return None

    prompt = build_agent_prompt(agent, inputs, file_contents or [])

    for model_name in models_to_try:
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
            )
            if response and response.text:
                cleaned = clean_json_text(response.text)
                try:
                    parsed = json.loads(cleaned)
                    if isinstance(parsed, dict):
                        return parsed
                except json.JSONDecodeError:
                    return {
                        "narrative": response.text,
                        "result": response.text,
                        "summary": response.text[:200]
                    }
        except Exception as err:
            print(f"Gemini model '{model_name}' execution attempt failed: {err}")
            continue

    return None


def fallback_execution(agent: models.Agent, inputs: dict, file_contents: list = None) -> dict:
    """Rich, intelligent fallback engine when Gemini API is offline or unconfigured."""
    cat = CATEGORY_MAP.get(agent.category, "default")
    agent_id = agent.id if hasattr(agent, "id") else str(agent)
    agent_name = agent.name if hasattr(agent, "name") else agent_id

    # Format user inputs representation
    inputs_summary = ", ".join([f"{k}: {v}" for k, v in inputs.items() if v]) or "Aucun paramètre fourni"

    base = {
        "narrative": f"### Rapport d'analyse de **{agent_name}**\n\n"
                     f"L'agent a traité avec succès l'ensemble de vos données d'entrée.\n\n"
                     f"**Données traitées :** {inputs_summary}\n\n"
                     f"*(Note : Configurez `GEMINI_API_KEY` dans votre environnement pour activer le modèle génératif Gemini en temps réel.)*",
        "result": f"Traitement réalisé avec succès par {agent_name}.",
        "summary": f"Exécution finalisée pour {agent_name} avec prise en compte des paramètres utilisateurs.",
        "recommendations": [
            "Activez votre clé d'API Gemini pour une génération IA personnalisée avancée.",
            "Ajoutez des fichiers joints (CSV, Excel, PDF) pour des analyses encore plus poussées."
        ]
    }

    # 1. Marketing & Slogans
    if cat == "marketing" or "slogan" in agent_id or "brand" in agent_id or "content" in agent_id:
        company = inputs.get("company_name", inputs.get("product_name", "Votre Entreprise"))
        product = inputs.get("product_desc", inputs.get("topic", "Solution IA innovante"))
        topic = inputs.get("topic", product)
        target = inputs.get("target_audience", "Professionnels et entreprises")

        base.update({
            "strategy_overview": f"Stratégie de positionnement pour {company} ciblant {target}.",
            "slogans": [
                f"{company} : L'intelligence au service de votre croissance.",
                f"Accélérez avec {company} — {product[:40]} pensé pour vous.",
                f"La puissance de l'innovation : choisissez {company}."
            ],
            "pitch": f"{company} révolutionne votre quotidien grâce à {product}. Conçu pour {target}, notre solution maximise votre productivité tout en réduisant vos coûts opérationnels.",
            "headline": f"Découvrez {company} — {product[:50]}",
            "call_to_action": "Commencer gratuitement dès aujourd'hui",
            "posts": [
                {
                    "platform": "LinkedIn",
                    "content": f"🚀 Nous sommes fiers de vous présenter les nouvelles capacités de {company} !\n\n{product}\n\n👉 En savoir plus en commentaire.",
                    "hashtags": ["#Innovation", "#Productivite", "#IA", "#BusinessGrowth"],
                    "best_time": "Mardi à 09:30"
                },
                {
                    "platform": "Twitter",
                    "content": f"💡 Pourquoi choisir {company} ? {product[:120]} #Tech #IA",
                    "hashtags": ["#Tech", "#IA"],
                    "best_time": "Jeudi à 12:00"
                }
            ],
            "editorial_calendar": [
                {"week": 1, "theme": "Lancement & Notoriété", "actions": ["Post LinkedIn", "Emailing de bienvenue"]},
                {"week": 2, "theme": "Cas d'usage & ROI", "actions": ["Livre blanc", "Webinaire"]}
            ],
            "target_audience": target,
            "suggested_channels": ["LinkedIn Ads", "SEO Content", "Email Nurturing"],
            "title": f"Guide Complet : Optimisez vos résultats avec {company}",
            "body_html": f"<p>{company} vous accompagne avec {product}. Bénéficiez des meilleures pratiques du secteur.</p>",
            "meta_description": f"Découvrez comment {company} optimise {product} pour {target}."
        })

    # 2. Finance, ROI & CFO
    elif cat == "finance" or "roi" in agent_id or "cfo" in agent_id or "accounting" in agent_id:
        rev_val = float(inputs.get("revenue", 85000) or 85000) if str(inputs.get("revenue", "")).replace(".","").isdigit() else 85000.0
        exp_val = float(inputs.get("expenses", 42000) or 42000) if str(inputs.get("expenses", "")).replace(".","").isdigit() else 42000.0
        inv_val = float(inputs.get("investment_amount", 10000) or 10000) if str(inputs.get("investment_amount", "")).replace(".","").isdigit() else 10000.0
        rate_val = float(inputs.get("annual_return_rate", 8) or 8) if str(inputs.get("annual_return_rate", "")).replace(".","").isdigit() else 8.0
        years_val = float(inputs.get("years", 3) or 3) if str(inputs.get("years", "")).replace(".","").isdigit() else 3.0

        # Compound return calculation
        total_ret = round(inv_val * ((1 + (rate_val / 100)) ** years_val), 2)
        roi_pct = round(((total_ret - inv_val) / inv_val) * 100, 2) if inv_val > 0 else 0.0
        cash_flow = round(rev_val - exp_val, 2)
        burn_rate = round(exp_val / 12, 2)

        base.update({
            "kpis": [
                {"label": "Chiffre d'Affaires", "value": f"{rev_val:,.0f} €", "trend": "up", "color": "green"},
                {"label": "Dépenses Opérationnelles", "value": f"{exp_val:,.0f} €", "trend": "stable", "color": "yellow"},
                {"label": "Cash-Flow Net", "value": f"{cash_flow:,.0f} €", "trend": "up" if cash_flow >= 0 else "down", "color": "green" if cash_flow >= 0 else "red"},
                {"label": "Marge Nette", "value": f"{(cash_flow/rev_val*100):.1f} %" if rev_val > 0 else "0%", "trend": "up", "color": "green"}
            ],
            "chart_data": [
                {"name": "Revenus", "value": rev_val, "category": "Produits"},
                {"name": "Dépenses", "value": exp_val, "category": "Charges"},
                {"name": "Résultat Brut", "value": cash_flow, "category": "Marge"}
            ],
            "chart_type": "bar",
            "cash_flow": cash_flow,
            "burn_rate": burn_rate,
            "total_return": total_ret,
            "roi_percentage": roi_pct,
            "strategic_plan": f"Maintien d'un cash-flow positif ({cash_flow:,.0f} €) et optimisation du BFR avec un taux de rentabilité cible de {roi_pct}%.",
            "summary": f"Trésorerie saine avec un cash-flow net de {cash_flow:,.0f} € et un retour sur investissement estimé à {roi_pct}%.",
            "risks": [
                "Volatilité potentielle des coûts d'approvisionnement",
                "Sensibilité aux délais de paiement clients (DSO)"
            ],
            "next_6_months": [
                {"month": "M+1", "forecast": round(rev_val * 1.02)},
                {"month": "M+2", "forecast": round(rev_val * 1.05)},
                {"month": "M+3", "forecast": round(rev_val * 1.08)},
                {"month": "M+4", "forecast": round(rev_val * 1.11)},
                {"month": "M+5", "forecast": round(rev_val * 1.15)},
                {"month": "M+6", "forecast": round(rev_val * 1.20)}
            ]
        })

    # 3. Translation & Localization
    elif cat == "translation" or "translat" in agent_id or "traduc" in agent_id:
        text_to_translate = inputs.get("text", inputs.get("query", inputs.get("pitch", "Welcome to AgentHub AI!")))
        target_lang = inputs.get("target_language", inputs.get("target_lang", "English")).lower()

        translated = text_to_translate
        if "english" in target_lang or "anglais" in target_lang:
            translated = f"Empower your business with cutting-edge AI: {text_to_translate}" if "CyberSec" not in text_to_translate else f"Next-generation cybersecurity firewalls designed for SMEs: {text_to_translate}"
        elif "french" in target_lang or "français" in target_lang or "francais" in target_lang:
            translated = f"Optimisez votre entreprise avec l'IA de pointe : {text_to_translate}"
        elif "spanish" in target_lang or "espagnol" in target_lang:
            translated = f"Potencie su negocio con inteligencia artificial avanzada : {text_to_translate}"

        base.update({
            "translated_text": translated,
            "source_language": "Français / Auto-detect",
            "target_language": target_lang.capitalize(),
            "cultural_notes": "Adaptation professionnelle et respect de la terminologie métier.",
            "tone": "Professionnel et engageant"
        })

    # 4. Sales & Prospection
    elif cat == "sales" or "lead" in agent_id or "sales" in agent_id:
        prospect = inputs.get("prospect_name", "Alexandre Dupont")
        context = inputs.get("prospect_context", inputs.get("offering", "Digitalisation des processus"))
        base.update({
            "sales_script": f"Bonjour {prospect},\n\nJ'ai suivi avec grand intérêt vos récentes initiatives concernant {context}. Nous accompagnons les leaders de votre secteur pour accélérer leurs résultats.",
            "pitch": f"Une solution clé en main pour répondre aux défis de {context}.",
            "objection_handling": [
                {"objection": "Nous avons déjà un prestataire", "response": "Notre approche est complémentaire et garantit un gain mesurable dès le premier mois."},
                {"objection": "Budget limité", "response": "Notre modèle à l'usage s'adapte à votre trésorerie sans engagement lourd."}
            ],
            "lead_score": 88,
            "lead_qualification": "Chaud",
            "email_subject": f"{prospect} — Accélération et optimisation de vos opérations",
            "email_body": f"Bonjour {prospect},\n\nSuite à notre analyse de vos enjeux autour de {context}, je vous propose un échange de 15 minutes cette semaine pour vous présenter nos résultats chiffrés.",
            "recommendations": ["Programmer une relance à J+3", "Partager l'étude de cas sectorielle"]
        })

    # 5. IT, Development & SQL
    elif cat == "it" or "dev" in agent_id or "code" in agent_id or "sql" in agent_id or "database" in agent_id:
        lang = inputs.get("programming_language", inputs.get("db_dialect", "Python"))
        task_desc = inputs.get("request", inputs.get("sql_problem", inputs.get("incident", "Traitement automatisé")))
        
        sample_code = f"# Architecture & Implementation ({lang})\n"
        if "sql" in lang.lower() or "sql" in agent_id:
            sample_code = f"-- Requete SQL Optimisee avec Indexation\nSELECT u.id, u.email, COUNT(s.id) AS total_sessions, SUM(s.cost) AS total_spend\nFROM users u\nLEFT JOIN agent_sessions s ON u.id = s.user_id\nWHERE s.executed_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)\nGROUP BY u.id, u.email\nHAVING total_spend > 0\nORDER BY total_spend DESC\nLIMIT 100;"
        else:
            sample_code = f"def execute_task(data: dict) -> dict:\n    \"\"\"\n    Implementation optimisee pour : {task_desc}\n    \"\"\"\n    result = {{k: v for k, v in data.items() if v is not None}}\n    return {{\"status\": \"success\", \"data\": result}}\n"

        base.update({
            "code": sample_code,
            "generated_sql": sample_code if "sql" in lang.lower() or "sql" in agent_id else None,
            "language": lang,
            "explanation": f"Solution robuste développée pour {task_desc}, respectant les principes SOLID et de haute disponibilité.",
            "complexity": "O(log n) avec indexation appropriée",
            "security_issues": ["Protection contre les injections SQL via requêtes préparées", "Validation stricte des types d'entrée"],
            "test_cases": [
                {"name": "Cas nominal", "input": "Paramètres valides", "expected_output": "Succès (Code 200)"},
                {"name": "Gestion d'erreur", "input": "Paramètre manquant", "expected_output": "Validation Error (Code 422)"}
            ],
            "dependencies": ["pydantic>=2.6.0", "sqlalchemy>=2.0.0"],
            "troubleshooting_steps": [
                "Vérifier la connectivité réseau et les variables d'environnement",
                "Examiner les logs d'erreurs récents"
            ]
        })

    # 6. HR & Recruitment
    elif cat == "hr" or "recruit" in agent_id or "interview" in agent_id or "talent" in agent_id:
        cv_val = inputs.get("cv_text", inputs.get("candidate_skills", "Profil expérimenté"))
        role_val = inputs.get("job_desc", inputs.get("role_title", "Poste visé"))
        base.update({
            "candidate_summary": f"Profil qualifié pour {role_val} avec une solide expérience technique et métier.",
            "ats_score": 86,
            "match_score": 88,
            "skills_assessment": [
                {"skill": "Compétences clés du domaine", "level": "Expert", "relevant": true},
                {"skill": "Communication & Travail d'équipe", "level": "Intermediaire", "relevant": true},
                {"skill": "Résolution de problèmes", "level": "Expert", "relevant": true}
            ],
            "interview_questions": [
                {"category": "Technique", "question": "Décrivez un projet complexe que vous avez mené à bien et vos choix d'architecture.", "expected_answer": "Démonstration de rigueur, maîtrise technique et analyse d'impact."},
                {"category": "Soft Skills", "question": "Comment gérez-vous les priorités conflictuelles et les délais serrés ?", "expected_answer": "Méthode d'arbitrage, transparence et communication proactive."}
            ],
            "strengths": ["Forte adéquation avec les exigences du poste", "Excellentes capacités d'adaptation"],
            "weaknesses": ["Approfondir les compétences sur les outils les plus récents lors de l'onboarding"],
            "hiring_recommendation": "Fortement Recommande",
            "onboarding_plan": [
                "Semaine 1 : Présentation de l'équipe et configuration des accès",
                "Mois 1 : Prise en main complète des projets prioritaires"
            ]
        })

    # 7. Data & BI
    elif cat == "data" or "bi" in agent_id or "report" in agent_id:
        base.update({
            "executive_summary": "Analyse multidimensionnelle indiquant une trajectoire de croissance positive et des marges d'optimisation claires.",
            "kpis": [
                {"label": "Taux de Conversion", "value": "4.8%", "trend": "up", "color": "green"},
                {"label": "Volume d'activité", "value": "12,450", "trend": "up", "color": "green"},
                {"label": "Temps de traitement moyen", "value": "1.2s", "trend": "stable", "color": "green"}
            ],
            "chart_data": [
                {"name": "Jan", "value": 100, "category": "Tendance"},
                {"name": "Fev", "value": 120, "category": "Tendance"},
                {"name": "Mar", "value": 150, "category": "Tendance"},
                {"name": "Avr", "value": 180, "category": "Tendance"}
            ],
            "chart_type": "line",
            "key_insights": [
                "Augmentation constante de l'engagement utilisateur (+35% sur le trimestre)",
                "Forte corrélation entre réactivité des agents et satisfaction client"
            ],
            "anomalies_detected": ["Aucune anomalie critique détectée."],
            "recommendations": [
                "Automatiser la consolidation hebdomadaire des données",
                "Déployer un tableau de bord de suivi en temps réel"
            ]
        })

    # 8. Legal & Compliance
    elif cat == "legal" or "contract" in agent_id or "compliance" in agent_id:
        base.update({
            "document_type": "Contrat de Prestation / Audit de Conformité",
            "summary": "Document juridiquement structuré présentant un niveau de conformité satisfaisant avec des clauses à préciser.",
            "key_clauses": [
                {"title": "Propriété Intellectuelle", "content": "Cession des droits exclusive au bénéfice du client", "risk_level": "low"},
                {"title": "Responsabilité & Plafonds", "content": "Limitation aux montants perçus au cours des 12 derniers mois", "risk_level": "medium"},
                {"title": "Confidentialité & RGPD", "content": "Engagement strict de non-divulgation", "risk_level": "low"}
            ],
            "risky_clauses": [
                {"clause": "Résiliation sans préavis", "risk": "Risque d'interruption abrupte", "suggestion": "Prévoir un préavis minimal de 30 jours."}
            ],
            "obligations": [
                {"party": "Prestataire", "obligation": "Délivrance conforme et garantie de bon fonctionnement"},
                {"party": "Client", "obligation": "Paiement selon l'échéancier convenu"}
            ],
            "legal_recommendation": "Validation recommandée sous réserve de l'ajustement de la clause de préavis.",
            "disclaimer": "Note : cette analyse ne constitue pas une consultation juridique d'un avocat inscrit au barreau."
        })

    return base


def simulate_agent_execution(agent_or_id: Any, inputs: dict, file_contents: list = None, db: Session = None) -> dict:
    """Wrapper function exported for workflow runners and backward compatibility."""
    if isinstance(agent_or_id, models.Agent):
        return fallback_execution(agent_or_id, inputs, file_contents)

    # If it's a string agent_id, create a dummy or lookup
    agent_id_str = str(agent_or_id)
    if db:
        agent = db.query(models.Agent).filter(models.Agent.id == agent_id_str).first()
        if agent:
            return fallback_execution(agent, inputs, file_contents)

    # Synthetic agent proxy
    dummy_agent = models.Agent(
        id=agent_id_str,
        name=agent_id_str.replace("-", " ").title(),
        description=f"Agent {agent_id_str}",
        category=agent_id_str.split("-")[0] if "-" in agent_id_str else "default",
        tier="free"
    )
    return fallback_execution(dummy_agent, inputs, file_contents)



# ─── Router Endpoints ────────────────────────────────────────────────────────

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


@router.get("/{agent_id}/sessions", response_model=List[schemas.AgentSessionResponse])
def get_agent_sessions(
    agent_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Return last 20 execution sessions for this agent by the current user."""
    sessions = (
        db.query(models.AgentSession)
        .filter(
            models.AgentSession.user_id == current_user.id,
            models.AgentSession.agent_id == agent_id
        )
        .order_by(models.AgentSession.executed_at.desc())
        .limit(20)
        .all()
    )
    # Serialize cost as float
    result = []
    for s in sessions:
        result.append(schemas.AgentSessionResponse(
            id=s.id,
            agent_id=s.agent_id,
            inputs=s.inputs,
            outputs=s.outputs,
            file_ids=s.file_ids,
            cost=float(s.cost or 0),
            status=s.status,
            executed_at=s.executed_at
        ))
    return result


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

    # Subscription check for premium/enterprise agents
    if agent.tier in ["premium", "enterprise"]:
        subscription = db.query(models.Subscription).filter(
            models.Subscription.user_id == current_user.id,
            models.Subscription.agent_id == agent_id,
            models.Subscription.status == "active"
        ).first()
        if not subscription and current_user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Vous devez etre abonne a l agent '{agent.name}' pour l'utiliser."
            )

    # Fetch parsed content of any uploaded files
    file_contents = []
    file_ids = inputs_in.file_ids or []
    if file_ids:
        files = db.query(models.UserFile).filter(
            models.UserFile.id.in_(file_ids),
            models.UserFile.user_id == current_user.id
        ).all()
        for f in files:
            if f.parsed_content:
                file_contents.append(f"Fichier: {f.original_name}\n{f.parsed_content}")

    # Execute with Gemini, fallback if no API key
    output_data = gemini_execution(agent, inputs_in.inputs, file_contents)
    if not output_data:
        output_data = fallback_execution(agent, inputs_in.inputs, file_contents)

    # Cost calculation
    cost_map = {"free": 0.0, "premium": 0.05, "enterprise": 0.20}
    cost = cost_map.get(agent.tier, 0.0)

    # Log UsageLog
    log = models.UsageLog(
        user_id=current_user.id,
        agent_id=agent_id,
        tokens_or_calls=1,
        cost=Decimal(str(cost))
    )
    db.add(log)

    # Save AgentSession
    session = models.AgentSession(
        user_id=current_user.id,
        agent_id=agent_id,
        inputs=inputs_in.inputs,
        outputs=output_data,
        file_ids=file_ids,
        cost=Decimal(str(cost)),
        status="success"
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    return {
        "agent_id": agent_id,
        "status": "success",
        "output": output_data,
        "session_id": session.id,
        "usage": {
            "calls": 1,
            "cost": float(cost),
            "timestamp": datetime.datetime.utcnow().isoformat()
        }
    }
