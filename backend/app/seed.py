from sqlalchemy.orm import Session
from decimal import Decimal
from .database import engine, SessionLocal, Base
from . import models

def seed_agents(db: Session):
    default_agents = [
        # === 1. FINANCE & BUSINESS ===
        {
            "id": "finance-agent",
            "name": "Finance Agent",
            "description": "Analyse financière générale, trésorerie, dépenses, revenus et prévisions.",
            "category": "finance",
            "tier": "free",
            "price_month": Decimal("0.00"),
            "price_use": Decimal("0.00"),
            "input_schema": {"quarter": {"type": "string", "label": "Trimestre", "placeholder": "Q3 2026"}, "revenue": {"type": "number", "label": "Revenus (€)"}, "expenses": {"type": "number", "label": "Dépenses (€)"}},
            "output_schema": {"cash_flow": {"type": "number"}, "burn_rate": {"type": "number"}, "analysis": {"type": "string"}},
            "system_prompt": "Tu es un agent d'analyse financière et gestion de trésorerie."
        },
        {
            "id": "cfo-agent",
            "name": "CFO Agent",
            "description": "Aide à la décision financière de haut niveau et recommandations stratégiques.",
            "category": "finance",
            "tier": "enterprise",
            "price_month": Decimal("149.99"),
            "price_use": Decimal("0.50"),
            "input_schema": {"business_goal": {"type": "string", "label": "Objectif commercial", "placeholder": "Augmenter la marge de 5%"}, "current_debt": {"type": "number", "label": "Dette actuelle"}, "cash_reserve": {"type": "number", "label": "Réserves de trésorerie"}},
            "output_schema": {"strategic_plan": {"type": "string"}, "risk_assessment": {"type": "string"}},
            "system_prompt": "Tu es un CFO virtuel (Directeur Financier) expert en stratégie d'entreprise."
        },
        {
            "id": "accounting-agent",
            "name": "Accounting Agent",
            "description": "Gestion des factures, rapprochements, catégorisation des transactions bancaires.",
            "category": "finance",
            "tier": "premium",
            "price_month": Decimal("29.99"),
            "price_use": Decimal("0.10"),
            "input_schema": {"transaction_desc": {"type": "string", "label": "Description de transaction", "placeholder": "Abonnement AWS 243.50€"}, "raw_invoice": {"type": "string", "label": "Détails facture"}},
            "output_schema": {"category": {"type": "string"}, "vat_amount": {"type": "number"}, "reconciliation_status": {"type": "string"}},
            "system_prompt": "Tu es un agent comptable spécialisé dans le classement et le rapprochement."
        },
        {
            "id": "financial-forecast-agent",
            "name": "Financial Forecast Agent",
            "description": "Prévisions avancées de revenus, dépenses et cash-flow à court et long terme.",
            "category": "finance",
            "tier": "premium",
            "price_month": Decimal("39.99"),
            "price_use": Decimal("0.15"),
            "input_schema": {"historical_data": {"type": "string", "label": "Historique mensuel", "placeholder": "Jan: 10k, Fev: 12k, Mar: 15k"}, "growth_rate": {"type": "number", "label": "Taux de croissance estimé (%)"}},
            "output_schema": {"next_6_months": {"type": "array"}, "forecast_summary": {"type": "string"}},
            "system_prompt": "Tu es un agent prévisionniste financier utilisant des modélisations mathématiques."
        },
        {
            "id": "fraud-detection-agent",
            "name": "Fraud Detection Agent",
            "description": "Détection d'anomalies de transactions suspectes et de fraudes potentielles.",
            "category": "finance",
            "tier": "enterprise",
            "price_month": Decimal("199.99"),
            "price_use": Decimal("0.05"),
            "input_schema": {"transaction_history": {"type": "string", "label": "Historique de transactions", "placeholder": "ID1: 15€ Paris, ID2: 3000€ Tokyo (5 min après)"}},
            "output_schema": {"risk_score": {"type": "number"}, "flagged_transactions": {"type": "array"}, "reason": {"type": "string"}},
            "system_prompt": "Tu es un agent de cybersécurité financière spécialisé dans la détection des fraudes de paiement."
        },
        {
            "id": "business-analyst-agent",
            "name": "Business Analyst Agent",
            "description": "Analyse des performances opérationnelles et recommandations d'optimisation.",
            "category": "finance",
            "tier": "premium",
            "price_month": Decimal("24.99"),
            "price_use": Decimal("0.08"),
            "input_schema": {"kpis": {"type": "string", "label": "KPIs actuels", "placeholder": "CAC: 50€, LTV: 200€, Churn: 8%"}},
            "output_schema": {"performance_evaluation": {"type": "string"}, "actionable_recommendations": {"type": "array"}},
            "system_prompt": "Tu es un Business Analyst expert en optimisation de métriques SaaS et e-commerce."
        },

        # === 2. HR & RECRUITMENT ===
        {
            "id": "hr-agent",
            "name": "HR Agent",
            "description": "Gestion des demandes RH courantes, congés, règlements et procédures internes.",
            "category": "hr",
            "tier": "free",
            "price_month": Decimal("0.00"),
            "price_use": Decimal("0.00"),
            "input_schema": {"employee_query": {"type": "string", "label": "Question de l'employé", "placeholder": "Combien de jours de RTT ai-je par an ?"}},
            "output_schema": {"response": {"type": "string"}, "required_form": {"type": "string"}},
            "system_prompt": "Tu es un assistant RH automatisé répondant selon le code du travail."
        },
        {
            "id": "recruitment-agent",
            "name": "Recruitment Agent",
            "description": "Analyse de CV (parsing) et présélection automatique des candidats par rapport au profil recherché.",
            "category": "hr",
            "tier": "premium",
            "price_month": Decimal("49.99"),
            "price_use": Decimal("0.20"),
            "input_schema": {"cv_text": {"type": "string", "label": "Contenu du CV"}, "job_desc": {"type": "string", "label": "Description du poste"}},
            "output_schema": {"match_score": {"type": "number"}, "strengths": {"type": "array"}, "weaknesses": {"type": "array"}},
            "system_prompt": "Tu es un recruteur technique chargé d'analyser la pertinence des candidatures."
        },
        {
            "id": "talent-agent",
            "name": "Talent Agent",
            "description": "Matching intelligent bidirectionnel entre candidats disponibles et postes ouverts.",
            "category": "hr",
            "tier": "premium",
            "price_month": Decimal("39.99"),
            "price_use": Decimal("0.15"),
            "input_schema": {"candidate_skills": {"type": "string", "label": "Compétences candidat", "placeholder": "React, TypeScript, Node.js"}, "open_positions": {"type": "string", "label": "Postes ouverts", "placeholder": "Poste A: Python Dev, Poste B: Fullstack Dev"}},
            "output_schema": {"recommended_position": {"type": "string"}, "justification": {"type": "string"}},
            "system_prompt": "Tu es un agent de placement de talents optimisant les correspondances de postes."
        },
        {
            "id": "interview-agent",
            "name": "Interview Agent",
            "description": "Préparation de grilles d'entretien personnalisées et analyse des comptes-rendus d'entretiens.",
            "category": "hr",
            "tier": "premium",
            "price_month": Decimal("19.99"),
            "price_use": Decimal("0.10"),
            "input_schema": {"candidate_profile": {"type": "string", "label": "Profil du candidat"}, "role_title": {"type": "string", "label": "Intitulé du poste"}},
            "output_schema": {"interview_questions": {"type": "array"}, "assessment_rubric": {"type": "string"}},
            "system_prompt": "Tu es un spécialiste de l'évaluation des compétences en entretien d'embauche."
        },
        {
            "id": "employee-assistant",
            "name": "Employee Assistant",
            "description": "Assistant RH conversationnel pour aider les employés au quotidien.",
            "category": "hr",
            "tier": "free",
            "price_month": Decimal("0.00"),
            "price_use": Decimal("0.00"),
            "input_schema": {"query": {"type": "string", "label": "Votre question", "placeholder": "Comment fonctionne la mutuelle ?"}},
            "output_schema": {"answer": {"type": "string"}},
            "system_prompt": "Tu es un assistant virtuel bienveillant pour les employés d'une entreprise."
        },
        {
            "id": "hr-analytics-agent",
            "name": "HR Analytics Agent",
            "description": "Analyse du turnover, de la performance globale et prévisions de recrutement (Workforce planning).",
            "category": "hr",
            "tier": "enterprise",
            "price_month": Decimal("129.99"),
            "price_use": Decimal("0.40"),
            "input_schema": {"hr_metrics": {"type": "string", "label": "Données RH brutes", "placeholder": "Départs: 12%, Recrutements: 15, Délai moyen: 45 jours"}},
            "output_schema": {"turnover_analysis": {"type": "string"}, "workforce_forecast": {"type": "string"}},
            "system_prompt": "Tu es un data analyst expert en ressources humaines et planification des effectifs."
        },

        # === 3. MARKETING ===
        {
            "id": "marketing-agent",
            "name": "Marketing Agent",
            "description": "Élaboration de stratégies marketing, plans de lancement et recommandations de canaux publicitaires.",
            "category": "marketing",
            "tier": "free",
            "price_month": Decimal("0.00"),
            "price_use": Decimal("0.00"),
            "input_schema": {"product_name": {"type": "string", "label": "Nom du produit"}, "target_audience": {"type": "string", "label": "Public cible", "placeholder": "Jeunes professionnels 25-35 ans"}},
            "output_schema": {"suggested_channels": {"type": "array"}, "strategy_overview": {"type": "string"}},
            "system_prompt": "Tu es un consultant en stratégie marketing digitale."
        },
        {
            "id": "content-creator-agent",
            "name": "Content Creator Agent",
            "description": "Création automatique d'articles de blog optimisés, de newsletters captivantes et d'ebooks.",
            "category": "marketing",
            "tier": "premium",
            "price_month": Decimal("19.99"),
            "price_use": Decimal("0.05"),
            "input_schema": {"topic": {"type": "string", "label": "Sujet", "placeholder": "Les bienfaits des agents d'IA"}, "tone": {"type": "string", "label": "Ton", "placeholder": "Professionnel et engageant"}},
            "output_schema": {"title": {"type": "string"}, "body_html": {"type": "string"}, "meta_description": {"type": "string"}},
            "system_prompt": "Tu es un rédacteur web SEO et copywriter d'élite."
        },
        {
            "id": "social-media-agent",
            "name": "Social Media Agent",
            "description": "Création et planification de posts adaptés pour LinkedIn, X, Facebook et Instagram.",
            "category": "marketing",
            "tier": "premium",
            "price_month": Decimal("14.99"),
            "price_use": Decimal("0.02"),
            "input_schema": {"announcement": {"type": "string", "label": "Annonce / Idée principale"}, "platforms": {"type": "string", "label": "Réseaux cibles", "placeholder": "LinkedIn, X"}},
            "output_schema": {"linkedin_post": {"type": "string"}, "x_post": {"type": "string"}, "suggested_hashtags": {"type": "array"}},
            "system_prompt": "Tu es un Community Manager créatif et dynamique."
        },
        {
            "id": "seo-agent",
            "name": "SEO Agent",
            "description": "Analyse technique SEO de mots-clés et recommandations de structure de pages (On-Page).",
            "category": "marketing",
            "tier": "premium",
            "price_month": Decimal("24.99"),
            "price_use": Decimal("0.08"),
            "input_schema": {"target_keyword": {"type": "string", "label": "Mot-clé cible"}, "competitor_url": {"type": "string", "label": "URL concurrente (facultatif)"}},
            "output_schema": {"keyword_difficulty": {"type": "string"}, "recommended_headers": {"type": "array"}, "backlink_strategy": {"type": "string"}},
            "system_prompt": "Tu es un consultant SEO expert en référencement naturel Google."
        },
        {
            "id": "ads-agent",
            "name": "Ads Agent",
            "description": "Création et optimisation de textes publicitaires pour Google Ads et Meta (Facebook/Instagram).",
            "category": "marketing",
            "tier": "premium",
            "price_month": Decimal("29.99"),
            "price_use": Decimal("0.06"),
            "input_schema": {"product_benefit": {"type": "string", "label": "Avantage clé", "placeholder": "Économisez 2 heures par jour"}, "ad_platform": {"type": "string", "label": "Plateforme publicitaire", "placeholder": "Google Ads"}},
            "output_schema": {"headline": {"type": "string"}, "primary_text": {"type": "string"}, "call_to_action": {"type": "string"}},
            "system_prompt": "Tu es un Media Buyer spécialisé en rédaction publicitaire à fort taux de conversion."
        },
        {
            "id": "brand-agent",
            "name": "Brand Agent",
            "description": "Définition de l'identité de marque, charte éditoriale et positionnement sur le marché.",
            "category": "marketing",
            "tier": "free",
            "price_month": Decimal("0.00"),
            "price_use": Decimal("0.00"),
            "input_schema": {"core_values": {"type": "string", "label": "Valeurs fondamentales", "placeholder": "Transparence, Vitesse, Innovation"}},
            "output_schema": {"brand_voice": {"type": "string"}, "positioning_statement": {"type": "string"}},
            "system_prompt": "Tu es un Brand Strategist expert en image de marque."
        },

        # === 4. SALES ===
        {
            "id": "sales-agent",
            "name": "Sales Agent",
            "description": "Élaboration de stratégies commerciales globales et scripts d'appels commerciaux.",
            "category": "sales",
            "tier": "free",
            "price_month": Decimal("0.00"),
            "price_use": Decimal("0.00"),
            "input_schema": {"offering": {"type": "string", "label": "Votre produit/service"}, "target_vertical": {"type": "string", "label": "Secteur visé", "placeholder": "PME dans le retail"}},
            "output_schema": {"sales_script": {"type": "string"}, "objection_handling": {"type": "array"}},
            "system_prompt": "Tu es un directeur commercial et coach de vente expérimenté."
        },
        {
            "id": "lead-generation-agent",
            "name": "Lead Generation Agent",
            "description": "Recherche, identification et qualification de prospects pertinents selon vos critères.",
            "category": "sales",
            "tier": "premium",
            "price_month": Decimal("49.99"),
            "price_use": Decimal("0.25"),
            "input_schema": {"icp": {"type": "string", "label": "Profil Client Idéal (ICP)", "placeholder": "CTO de startups tech en France de 10-50 salariés"}},
            "output_schema": {"potential_leads": {"type": "array"}, "enrichment_tips": {"type": "string"}},
            "system_prompt": "Tu es un spécialiste de la prospection et de la génération de leads B2B."
        },
        {
            "id": "lead-scoring-agent",
            "name": "Lead Scoring Agent",
            "description": "Évaluation et notation automatique de vos prospects en fonction de leur intérêt et budget.",
            "category": "sales",
            "tier": "premium",
            "price_month": Decimal("29.99"),
            "price_use": Decimal("0.10"),
            "input_schema": {"interaction_data": {"type": "string", "label": "Données d'interactions", "placeholder": "Visite tarifs 3x, téléchargement ebook, entreprise 100 pers"}},
            "output_schema": {"score": {"type": "number"}, "tier": {"type": "string"}, "action_required": {"type": "string"}},
            "system_prompt": "Tu es un ingénieur commercial SalesOps expert en scoring."
        },
        {
            "id": "sales-email-agent",
            "name": "Sales Email Agent",
            "description": "Rédaction d'e-mails commerciaux (cold outreach) hyper-personnalisés pour de meilleurs taux de réponse.",
            "category": "sales",
            "tier": "premium",
            "price_month": Decimal("19.99"),
            "price_use": Decimal("0.05"),
            "input_schema": {"prospect_name": {"type": "string", "label": "Nom du prospect"}, "prospect_context": {"type": "string", "label": "Contexte / Actualité", "placeholder": "Vient de lever 2M€"}},
            "output_schema": {"subject_line": {"type": "string"}, "email_body": {"type": "string"}},
            "system_prompt": "Tu es un spécialiste de la prospection par e-mail B2B."
        },
        {
            "id": "crm-agent",
            "name": "CRM Agent",
            "description": "Orchestration, structuration et mise à jour intelligente des fiches CRM clients.",
            "category": "sales",
            "tier": "premium",
            "price_month": Decimal("34.99"),
            "price_use": Decimal("0.08"),
            "input_schema": {"raw_notes": {"type": "string", "label": "Notes brutes de réunion", "placeholder": "Rdv avec Marc, intéressé par pack Pro, budget 5k max"}},
            "output_schema": {"deal_stage": {"type": "string"}, "next_steps": {"type": "array"}, "clean_json": {"type": "string"}},
            "system_prompt": "Tu es un assistant CRM expert en nettoyage et traitement de données de vente."
        },
        {
            "id": "sales-forecast-agent",
            "name": "Sales Forecast Agent",
            "description": "Estimation des ventes à venir basées sur le pipeline actuel du CRM.",
            "category": "sales",
            "tier": "enterprise",
            "price_month": Decimal("119.99"),
            "price_use": Decimal("0.30"),
            "input_schema": {"current_pipeline": {"type": "string", "label": "Pipeline commercial", "placeholder": "Deal 1: 5k€ (80%), Deal 2: 15k€ (20%)"}},
            "output_schema": {"weighted_forecast": {"type": "number"}, "confidence_interval": {"type": "string"}},
            "system_prompt": "Tu es un analyste de données de vente prédictives."
        },

        # === 5. DATA & BI ===
        {
            "id": "data-analyzer-agent",
            "name": "Data Analyst Agent",
            "description": "Analyse statistique automatique des jeux de données fournis.",
            "category": "analytics",
            "tier": "premium",
            "price_month": Decimal("49.99"),
            "price_use": Decimal("0.10"),
            "input_schema": {"numbers_list": {"type": "string", "label": "Liste de nombres", "placeholder": "10, 20, 30"}},
            "output_schema": {"mean": {"type": "number"}, "median": {"type": "number"}, "analysis": {"type": "string"}},
            "system_prompt": "Tu es un agent data scientist spécialisé dans les calculs mathématiques et statistiques."
        },
        {
            "id": "bi-agent",
            "name": "BI Agent",
            "description": "Définition de structures d'indicateurs clés (KPI) et conceptions de tableaux de bord décisionnels.",
            "category": "analytics",
            "tier": "premium",
            "price_month": Decimal("39.99"),
            "price_use": Decimal("0.15"),
            "input_schema": {"business_type": {"type": "string", "label": "Type d'activité", "placeholder": "Plateforme SaaS B2B"}},
            "output_schema": {"recommended_kpis": {"type": "array"}, "dashboard_layout": {"type": "string"}},
            "system_prompt": "Tu es un Business Intelligence Architect expert en KPI d'entreprise."
        },
        {
            "id": "report-agent",
            "name": "Report Agent",
            "description": "Génération automatisée de rapports clairs à partir de données synthétiques brutes.",
            "category": "analytics",
            "tier": "free",
            "price_month": Decimal("0.00"),
            "price_use": Decimal("0.00"),
            "input_schema": {"raw_data": {"type": "string", "label": "Données brutes", "placeholder": "Ventes en hausse de 5%, 3 nouveaux clients recrutés"}},
            "output_schema": {"executive_summary": {"type": "string"}, "full_report": {"type": "string"}},
            "system_prompt": "Tu es un rédacteur de rapports professionnels synthétiques."
        },
        {
            "id": "excel-agent",
            "name": "Excel Agent",
            "description": "Génération de formules Excel complexes, macros VBA et automatisation de tableurs.",
            "category": "analytics",
            "tier": "premium",
            "price_month": Decimal("19.99"),
            "price_use": Decimal("0.04"),
            "input_schema": {"problem_desc": {"type": "string", "label": "Problème Excel", "placeholder": "Chercher la valeur X dans la colonne A et sommer la colonne B correspondante"}},
            "output_schema": {"excel_formula": {"type": "string"}, "vba_code": {"type": "string"}},
            "system_prompt": "Tu es un expert mondial de Microsoft Excel et de la programmation VBA."
        },
        {
            "id": "power-bi-agent",
            "name": "Power BI Agent",
            "description": "Génération de requêtes DAX et conseils pour vos visualisations Power BI.",
            "category": "analytics",
            "tier": "premium",
            "price_month": Decimal("29.99"),
            "price_use": Decimal("0.10"),
            "input_schema": {"query_need": {"type": "string", "label": "Besoin de calcul DAX", "placeholder": "Cumul annuel glissant des ventes"}},
            "output_schema": {"dax_formula": {"type": "string"}, "visual_guidelines": {"type": "string"}},
            "system_prompt": "Tu es un expert certifié Power BI et spécialiste du langage DAX."
        },
        {
            "id": "data-cleaning-agent",
            "name": "Data Cleaning Agent",
            "description": "Identification des doublons, valeurs aberrantes et préparation au formatage de fichiers CSV.",
            "category": "analytics",
            "tier": "premium",
            "price_month": Decimal("24.99"),
            "price_use": Decimal("0.08"),
            "input_schema": {"dirty_csv": {"type": "string", "label": "Contenu CSV brut"}},
            "output_schema": {"clean_data_sample": {"type": "string"}, "anomalies_detected": {"type": "array"}},
            "system_prompt": "Tu es un data engineer chargé du nettoyage de jeux de données corrompus."
        },

        # === 6. LEGAL & COMPLIANCE (WITH DISCLAIMERS) ===
        {
            "id": "legal-agent",
            "name": "Legal Agent",
            "description": "Assistance juridique générale et explication simplifiée des textes de lois. [ATTENTION : Outil d'assistance, ne remplace pas un avocat]",
            "category": "legal",
            "tier": "free",
            "price_month": Decimal("0.00"),
            "price_use": Decimal("0.00"),
            "input_schema": {"legal_question": {"type": "string", "label": "Votre question juridique", "placeholder": "Quelle est la durée de préavis pour un bail commercial ?"}},
            "output_schema": {"simplified_explanation": {"type": "string"}, "relevant_code_articles": {"type": "array"}},
            "system_prompt": "Tu es un assistant d'information juridique. Tu vulgarises le droit sans donner de consultation d'avocat officielle."
        },
        {
            "id": "contract-agent",
            "name": "Contract Agent",
            "description": "Analyse, comparaison et détection de clauses abusives ou à risques dans vos contrats. [ATTENTION : Outil d'assistance, ne remplace pas un professionnel]",
            "category": "legal",
            "tier": "premium",
            "price_month": Decimal("49.99"),
            "price_use": Decimal("0.30"),
            "input_schema": {"contract_text": {"type": "string", "label": "Texte du contrat"}},
            "output_schema": {"risky_clauses": {"type": "array"}, "suggested_modifications": {"type": "array"}},
            "system_prompt": "Tu es un assistant d'analyse de contrats. Tu pointes les risques potentiels pour examen par un avocat."
        },
        {
            "id": "compliance-agent",
            "name": "Compliance Agent",
            "description": "Vérification de conformité de vos processus et sites (ex: RGPD). [ATTENTION : Outil d'assistance, ne remplace pas un audit réglementé]",
            "category": "legal",
            "tier": "premium",
            "price_month": Decimal("59.99"),
            "price_use": Decimal("0.20"),
            "input_schema": {"process_description": {"type": "string", "label": "Description du traitement", "placeholder": "Enregistrement des e-mails clients sans consentement préalable"}},
            "output_schema": {"compliance_score": {"type": "number"}, "violations": {"type": "array"}},
            "system_prompt": "Tu es un DPO virtuel et expert en conformité réglementaire (RGPD, etc.)."
        },
        {
            "id": "policy-agent",
            "name": "Policy Agent",
            "description": "Aide à la rédaction de politiques internes de sécurité et conditions d'utilisation. [ATTENTION : Outil de rédaction préliminaire]",
            "category": "legal",
            "tier": "premium",
            "price_month": Decimal("39.99"),
            "price_use": Decimal("0.10"),
            "input_schema": {"policy_type": {"type": "string", "label": "Type de politique souhaitée", "placeholder": "Charte informatique d'entreprise"}},
            "output_schema": {"policy_template": {"type": "string"}},
            "system_prompt": "Tu es un assistant de rédaction administrative et de politiques de conformité."
        },
        {
            "id": "risk-agent",
            "name": "Risk Agent",
            "description": "Analyse globale des risques juridiques et opérationnels de projets. [ATTENTION : Outil d'aide à la décision]",
            "category": "legal",
            "tier": "enterprise",
            "price_month": Decimal("149.99"),
            "price_use": Decimal("0.50"),
            "input_schema": {"project_scope": {"type": "string", "label": "Portée du projet commercial", "placeholder": "Lancement d'un service de livraison par drone"}},
            "output_schema": {"risks_matrix": {"type": "array"}, "mitigation_plan": {"type": "string"}},
            "system_prompt": "Tu es un analyste de risques réglementaires et opérationnels."
        },

        # === 7. PROCUREMENT & SUPPLY CHAIN ===
        {
            "id": "procurement-agent",
            "name": "Procurement Agent",
            "description": "Optimisation de la stratégie d'achat, de négociation et de sélection des produits.",
            "category": "procurement",
            "tier": "free",
            "price_month": Decimal("0.00"),
            "price_use": Decimal("0.00"),
            "input_schema": {"item_needed": {"type": "string", "label": "Matériel / Service requis", "placeholder": "Flotte de 20 ordinateurs portables"}},
            "output_schema": {"buying_strategy": {"type": "string"}, "estimated_pricing": {"type": "string"}},
            "system_prompt": "Tu es un acheteur professionnel et négociateur industriel."
        },
        {
            "id": "supplier-agent",
            "name": "Supplier Agent",
            "description": "Analyse comparative des propositions tarifaires des fournisseurs.",
            "category": "procurement",
            "tier": "premium",
            "price_month": Decimal("39.99"),
            "price_use": Decimal("0.15"),
            "input_schema": {"quotes_details": {"type": "string", "label": "Détails des devis reçus", "placeholder": "Fournisseur A: 100 unités à 5€, Fournisseur B: 90 unités à 6€ + livraison offerte"}},
            "output_schema": {"cheapest_option": {"type": "string"}, "best_value_option": {"type": "string"}, "comparison_matrix": {"type": "array"}},
            "system_prompt": "Tu es un analyste achats spécialisé dans l'évaluation des fournisseurs B2B."
        },
        {
            "id": "supply-chain-agent",
            "name": "Supply Chain Agent",
            "description": "Recommandation d'optimisation des flux logistiques et réduction des délais de livraison.",
            "category": "procurement",
            "tier": "enterprise",
            "price_month": Decimal("199.99"),
            "price_use": Decimal("0.40"),
            "input_schema": {"supply_flow": {"type": "string", "label": "Description de la chaîne logistique actuelle", "placeholder": "Usine en Chine, Stockage en Allemagne, Distribution France"}},
            "output_schema": {"bottlenecks": {"type": "array"}, "optimization_plan": {"type": "string"}},
            "system_prompt": "Tu es un ingénieur expert en Supply Chain et gestion des flux."
        },
        {
            "id": "inventory-agent",
            "name": "Inventory Agent",
            "description": "Prévisions de stocks et de réapprovisionnements pour éviter les ruptures.",
            "category": "procurement",
            "tier": "premium",
            "price_month": Decimal("29.99"),
            "price_use": Decimal("0.10"),
            "input_schema": {"sales_rate": {"type": "number", "label": "Ventes quotidiennes moyennes"}, "current_stock": {"type": "number", "label": "Stock actuel"}, "lead_time_days": {"type": "number", "label": "Délai de réapprovisionnement (jours)"}},
            "output_schema": {"safety_stock": {"type": "number"}, "reorder_point": {"type": "number"}, "forecast_status": {"type": "string"}},
            "system_prompt": "Tu es un gestionnaire de stocks et prévisionniste de la demande."
        },
        {
            "id": "logistics-agent",
            "name": "Logistics Agent",
            "description": "Optimisation des tournées de livraison et choix des transporteurs partenaires.",
            "category": "procurement",
            "tier": "premium",
            "price_month": Decimal("49.99"),
            "price_use": Decimal("0.20"),
            "input_schema": {"destinations": {"type": "string", "label": "Adresses de livraison", "placeholder": "Paris, Lyon, Marseille"}},
            "output_schema": {"optimized_route": {"type": "array"}, "carrier_recommendation": {"type": "string"}},
            "system_prompt": "Tu es un coordinateur logistique et planificateur de tournées."
        },
        {
            "id": "purchase-agent",
            "name": "Purchase Agent",
            "description": "Automatisation des formulaires de demandes d'achat et bons de commande.",
            "category": "procurement",
            "tier": "free",
            "price_month": Decimal("0.00"),
            "price_use": Decimal("0.00"),
            "input_schema": {"purchaser_info": {"type": "string", "label": "Nom de l'acheteur"}, "item_list": {"type": "string", "label": "Liste d'articles"}},
            "output_schema": {"purchase_order": {"type": "string"}},
            "system_prompt": "Tu es un assistant administratif d'achats."
        },

        # === 8. CUSTOMER SERVICE ===
        {
            "id": "customer-support-agent",
            "name": "Customer Support Agent",
            "description": "Réponses instantanées et polies aux questions fréquentes des clients.",
            "category": "customer_service",
            "tier": "free",
            "price_month": Decimal("0.00"),
            "price_use": Decimal("0.00"),
            "input_schema": {"customer_message": {"type": "string", "label": "Message du client", "placeholder": "Mon colis est endommagé, que faire ?"}},
            "output_schema": {"support_response": {"type": "string"}},
            "system_prompt": "Tu es un agent de support client attentionné, efficace et empathique."
        },
        {
            "id": "ticket-agent",
            "name": "Ticket Agent",
            "description": "Classification de tickets de support par priorité et attribution automatique.",
            "category": "customer_service",
            "tier": "premium",
            "price_month": Decimal("19.99"),
            "price_use": Decimal("0.02"),
            "input_schema": {"ticket_content": {"type": "string", "label": "Contenu du ticket", "placeholder": "Le serveur de production est hors ligne !"}},
            "output_schema": {"priority": {"type": "string"}, "department": {"type": "string"}, "suggested_tags": {"type": "array"}},
            "system_prompt": "Tu es un répartiteur de tickets de support technique."
        },
        {
            "id": "customer-success-agent",
            "name": "Customer Success Agent",
            "description": "Suivi proactif de la satisfaction client et gestion du risque de résiliation (Churn).",
            "category": "customer_service",
            "tier": "premium",
            "price_month": Decimal("39.99"),
            "price_use": Decimal("0.08"),
            "input_schema": {"nps_feedback": {"type": "string", "label": "Commentaire de satisfaction", "placeholder": "NPS: 6/10, pas assez rapide"}},
            "output_schema": {"churn_risk": {"type": "string"}, "action_plan": {"type": "string"}},
            "system_prompt": "Tu es un Customer Success Manager dédié à la rétention et satisfaction."
        },
        {
            "id": "voice-support-agent",
            "name": "Voice Support Agent",
            "description": "Génération de scripts conversationnels et d'assistants vocaux pour le support.",
            "category": "customer_service",
            "tier": "enterprise",
            "price_month": Decimal("149.99"),
            "price_use": Decimal("0.10"),
            "input_schema": {"ivr_flow": {"type": "string", "label": "Objectif de l'appel", "placeholder": "Prendre un rendez-vous médical"}},
            "output_schema": {"voice_script": {"type": "string"}, "recommended_tone": {"type": "string"}},
            "system_prompt": "Tu es un concepteur d'interfaces vocales et de scripts téléphoniques."
        },
        {
            "id": "knowledge-agent",
            "name": "Knowledge Agent",
            "description": "Réponses clients basées strictement sur la documentation interne de l'entreprise.",
            "category": "customer_service",
            "tier": "premium",
            "price_month": Decimal("29.99"),
            "price_use": Decimal("0.05"),
            "input_schema": {"doc_context": {"type": "string", "label": "Extrait de documentation"}, "question": {"type": "string", "label": "Question client"}},
            "output_schema": {"answer": {"type": "string"}, "source_referenced": {"type": "string"}},
            "system_prompt": "Tu es un agent d'assistance documentaire (RAG) répondant uniquement sur la base fournie."
        },

        # === 9. IT & DEVELOPMENT ===
        {
            "id": "developer-agent",
            "name": "Developer Agent",
            "description": "Génération et modification de code informatique multi-langages à la demande.",
            "category": "it",
            "tier": "premium",
            "price_month": Decimal("49.99"),
            "price_use": Decimal("0.10"),
            "input_schema": {"programming_language": {"type": "string", "label": "Langage de programmation", "placeholder": "Python"}, "request": {"type": "string", "label": "Fonctionnalité demandée", "placeholder": "Créer une fonction de tri fusion"}},
            "output_schema": {"code": {"type": "string"}, "explanation": {"type": "string"}},
            "system_prompt": "Tu es un développeur logiciel expert résolvant les problèmes de code proprement."
        },
        {
            "id": "code-review-agent",
            "name": "Code Review Agent",
            "description": "Analyse statique et suggestions d'amélioration de la qualité de votre code.",
            "category": "it",
            "tier": "premium",
            "price_month": Decimal("29.99"),
            "price_use": Decimal("0.05"),
            "input_schema": {"code_to_review": {"type": "string", "label": "Code à analyser"}},
            "output_schema": {"bugs_found": {"type": "array"}, "security_flaws": {"type": "array"}, "refactoring_suggestion": {"type": "string"}},
            "system_prompt": "Tu es un relecteur de code et tech lead très pointilleux sur les bonnes pratiques."
        },
        {
            "id": "devops-agent",
            "name": "DevOps Agent",
            "description": "Configuration de pipelines CI/CD, scripts d'infrastructure (Terraform) et monitoring.",
            "category": "it",
            "tier": "premium",
            "price_month": Decimal("39.99"),
            "price_use": Decimal("0.12"),
            "input_schema": {"ci_need": {"type": "string", "label": "Besoin DevOps", "placeholder": "Créer un fichier GitHub Actions pour tester une application Node.js"}},
            "output_schema": {"config_file": {"type": "string"}, "steps_explanation": {"type": "string"}},
            "system_prompt": "Tu es un ingénieur DevOps expert en automatisation CI/CD et Cloud."
        },
        {
            "id": "database-agent",
            "name": "Database Agent",
            "description": "Conception de schémas de bases de données, génération et optimisation de requêtes SQL.",
            "category": "it",
            "tier": "premium",
            "price_month": Decimal("24.99"),
            "price_use": Decimal("0.06"),
            "input_schema": {"db_dialect": {"type": "string", "label": "Dialecte SQL", "placeholder": "MySQL"}, "sql_problem": {"type": "string", "label": "Besoin / Problème SQL", "placeholder": "Optimiser un JOIN sur 3 tables"}},
            "output_schema": {"generated_sql": {"type": "string"}, "optimizations_done": {"type": "string"}},
            "system_prompt": "Tu es un DBA (Administrateur de bases de données) expert en SQL et indexation."
        },
        {
            "id": "cybersecurity-agent",
            "name": "Cybersecurity Agent",
            "description": "Analyse de vulnérabilités logicielles et recommandations de correctifs de sécurité.",
            "category": "it",
            "tier": "enterprise",
            "price_month": Decimal("149.99"),
            "price_use": Decimal("0.50"),
            "input_schema": {"code_or_log": {"type": "string", "label": "Code ou Log suspect"}},
            "output_schema": {"vulnerability_detected": {"type": "string"}, "cve_reference": {"type": "string"}, "mitigation_code": {"type": "string"}},
            "system_prompt": "Tu es un ingénieur de sécurité applicative (AppSec) et Hacker Éthique."
        },
        {
            "id": "it-support-agent",
            "name": "IT Support Agent",
            "description": "Aide à la résolution des problèmes informatiques matériels, de messagerie et de réseau.",
            "category": "it",
            "tier": "free",
            "price_month": Decimal("0.00"),
            "price_use": Decimal("0.00"),
            "input_schema": {"incident": {"type": "string", "label": "Incident informatique", "placeholder": "Mon client VPN se déconnecte toutes les 10 minutes"}},
            "output_schema": {"troubleshooting_steps": {"type": "array"}},
            "system_prompt": "Tu es un technicien de support informatique Helpdesk niveau 2."
        }
    ]

    # Map defaults
    for agent_data in default_agents:
        existing = db.query(models.Agent).filter(models.Agent.id == agent_data["id"]).first()
        if not existing:
            new_agent = models.Agent(**agent_data)
            db.add(new_agent)
            print(f"Seeding agent: {agent_data['name']}")
        else:
            # Update schema and values to match new defaults
            for key, val in agent_data.items():
                setattr(existing, key, val)
    db.commit()

if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_agents(db)
        print("Database seeded successfully!")
    finally:
        db.close()
