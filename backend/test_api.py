import requests
import json
import time

BASE_URL = "http://localhost:8000"

def test_flow():
    print("=== Démarrage des Tests Automatiques d'AgentHub AI ===")
    
    # 1. Test Ping
    print("\n1. Test du point de terminaison racine...")
    r = requests.get(f"{BASE_URL}/")
    assert r.status_code == 200
    print("Résultat :", r.json())

    # Generate a unique email using timestamp to avoid conflict
    email = f"test_{int(time.time())}@agenthub.ai"
    password = "superpassword123"

    # 2. Inscription
    # First register a dummy user to absorb the admin role if DB is empty
    dummy_email = f"dummy_{int(time.time())}@agenthub.ai"
    requests.post(f"{BASE_URL}/api/auth/register", json={"email": dummy_email, "password": password})

    print(f"\n2. Inscription d'un nouvel utilisateur : {email}...")
    r = requests.post(f"{BASE_URL}/api/auth/register", json={"email": email, "password": password})
    assert r.status_code == 201
    user_data = r.json()
    print("Utilisateur créé : ID", user_data["id"], "Rôle", user_data["role"])

    # 3. Connexion
    print("\n3. Connexion de l'utilisateur...")
    r = requests.post(f"{BASE_URL}/api/auth/login", data={"username": email, "password": password})
    assert r.status_code == 200
    token = r.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("Token d'accès JWT généré avec succès.")

    # 4. Liste des agents
    print("\n4. Récupération du catalogue d'agents...")
    r = requests.get(f"{BASE_URL}/api/agents")
    assert r.status_code == 200
    agents = r.json()
    print(f"Trouvé {len(agents)} agents dans la base de données :")
    for agent in agents:
        print(f"  - [{agent['tier'].upper()}] {agent['name']} (ID: {agent['id']})")

    # 5. Exécution d'un agent gratuit (Générateur de slogans)
    print("\n5. Test de l'agent gratuit 'marketing-slogan'...")
    inputs = {
        "company_name": "Nexora Corp",
        "product_desc": "un CRM intelligent pour agents immobiliers"
    }
    r = requests.post(f"{BASE_URL}/api/agents/marketing-slogan/execute", json={"inputs": inputs}, headers=headers)
    assert r.status_code == 200
    exec_res = r.json()
    print("Statut :", exec_res["status"])
    print("Slogans générés :", exec_res["output"]["slogans"])
    print("Pitch :", exec_res["output"]["pitch"])

    # 6. Test d'exécution d'un agent Premium sans abonnement (Calculateur de ROI)
    print("\n6. Test de sécurité : exécution de l'agent premium 'finance-roi' sans abonnement...")
    finance_inputs = {
        "investment_amount": 10000,
        "annual_return_rate": 7,
        "years": 4
    }
    r = requests.post(f"{BASE_URL}/api/agents/finance-roi/execute", json={"inputs": finance_inputs}, headers=headers)
    print(f"Statut HTTP reçu (doit être 403) : {r.status_code}")
    assert r.status_code == 403
    print("Détail de l'erreur :", r.json()["detail"])

    # 7. Souscription à l'agent Premium
    print("\n7. Souscription à l'agent premium 'finance-roi'...")
    r = requests.post(f"{BASE_URL}/api/subscriptions/subscribe", json={"agent_id": "finance-roi"}, headers=headers)
    assert r.status_code == 200
    sub_data = r.json()
    print(f"Abonnement créé avec succès (ID: {sub_data['id']}, Statut: {sub_data['status']})")

    # 8. Exécution après souscription
    print("\n8. Ré-essai de l'exécution de 'finance-roi' après abonnement...")
    r = requests.post(f"{BASE_URL}/api/agents/finance-roi/execute", json={"inputs": finance_inputs}, headers=headers)
    assert r.status_code == 200
    roi_res = r.json()
    print("Calcul réussi !")
    print("Retour total :", roi_res["output"]["total_return"], "€")
    print("ROI (%) :", roi_res["output"]["roi_percentage"], "%")
    print("Résumé :", roi_res["output"]["summary"])

    # 9. Création d'un workflow multi-agents
    # Étape 1 : marketing-slogan -> prend company_name et product_desc
    # Étape 2 : translator -> prend 'text' mappé sur le 'pitch' produit par marketing-slogan
    print("\n9. Création d'un workflow multi-agents (Marketing Slogan -> Traducteur Anglais)...")
    wf_definition = [
        {
            "agent_id": "marketing-slogan",
            "input_mappings": {
                "company_name": "company_name",
                "product_desc": "product_desc"
            }
        },
        {
            "agent_id": "translator",
            "input_mappings": {
                "text": "pitch", # Mappe le champ 'pitch' de la sortie de l'étape précédente
                "target_language": "target_lang"
            }
        }
    ]
    r = requests.post(
        f"{BASE_URL}/api/workflows", 
        json={
            "name": "Chaîne de Communication Marketing",
            "description": "Génère des slogans et traduit le pitch de vente final en anglais.",
            "definition": wf_definition
        }, 
        headers=headers
    )
    assert r.status_code == 201
    wf_data = r.json()
    wf_id = wf_data["id"]
    print(f"Workflow créé avec succès (ID: {wf_id}, Nom: {wf_data['name']})")

    # 10. Exécution du workflow
    # L'utilisateur doit d'abord être abonné à 'translator' (Premium) pour lancer le workflow qui l'inclut !
    # Testons le blocage du workflow sans abonnement à 'translator'
    print("\n10. Essai d'exécution du workflow sans abonnement à l'agent premium 'translator'...")
    wf_run_inputs = {
        "company_name": "CyberSec Systems",
        "product_desc": "des pare-feux pour les PME",
        "target_lang": "english"
    }
    r = requests.post(f"{BASE_URL}/api/workflows/{wf_id}/run", json={"initial_inputs": wf_run_inputs}, headers=headers)
    print(f"Statut HTTP reçu (doit être 403) : {r.status_code}")
    assert r.status_code == 403
    print("Détail de l'erreur :", r.json()["detail"])

    # Souscription à 'translator'
    print("\nSouscription à 'translator'...")
    r = requests.post(f"{BASE_URL}/api/subscriptions/subscribe", json={"agent_id": "translator"}, headers=headers)
    assert r.status_code == 200

    # Lancement réussi du workflow
    print("\nLancement du workflow avec tous les abonnements requis...")
    r = requests.post(f"{BASE_URL}/api/workflows/{wf_id}/run", json={"initial_inputs": wf_run_inputs}, headers=headers)
    assert r.status_code == 200
    run_res = r.json()
    print("Workflow exécuté avec succès. Résultats pas-à-pas :")
    for step in run_res["results"]:
        print(f"  - Étape {step['step_index']+1} ({step['agent_id']}) exécutée.")
        print(f"    Inputs : {step['inputs']}")
        print(f"    Outputs : {step['outputs']}")
    
    print("\nTexte traduit final (anglais) :", run_res["final_output"]["translated_text"])
    
    print("\n=== TOUS LES TESTS SONT PASSÉS AVEC SUCCÈS ! ===")

if __name__ == "__main__":
    try:
        test_flow()
    except AssertionError as e:
        print("\n[ERREUR] Assert a échoué. Vérifiez la réponse de l'API.")
    except Exception as e:
        print("\n[ERREUR] Une exception s'est produite :", e)
