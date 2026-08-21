import requests
import json
import time
import io
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

BASE_URL = "http://localhost:8000"

def get_client():
    """Return requests or FastAPI TestClient if live server is offline."""
    try:
        r = requests.get(f"{BASE_URL}/", timeout=1.0)
        if r.status_code == 200:
            print("[INFO] Testing against LIVE server on", BASE_URL)
            return requests, False
    except Exception:
        pass
    
    print("[INFO] Live server offline -> Testing via in-process FastAPI TestClient")
    from fastapi.testclient import TestClient
    from app.main import app
    return TestClient(app), True

def test_flow():
    print("=== Démarrage des Tests Automatiques d'AgentHub AI ===")
    http_client, is_in_process = get_client()

    def post(url, **kwargs):
        if is_in_process:
            return http_client.post(url.replace(BASE_URL, ""), **kwargs)
        return http_client.post(url, **kwargs)

    def get(url, **kwargs):
        if is_in_process:
            return http_client.get(url.replace(BASE_URL, ""), **kwargs)
        return http_client.get(url, **kwargs)

    # 1. Test Ping
    print("\n1. Test du point de terminaison racine...")
    r = get(f"{BASE_URL}/")
    assert r.status_code == 200
    print("Résultat :", r.json())

    # Generate a unique email using timestamp to avoid conflict
    email = f"test_{int(time.time() * 1000)}@agenthub.ai"
    password = "superpassword123"

    # 2. Inscription
    print(f"\n2. Inscription d'un nouvel utilisateur : {email}...")
    r = post(f"{BASE_URL}/api/auth/register", json={"email": email, "password": password})
    assert r.status_code == 201, r.text
    user_data = r.json()
    print("Utilisateur créé : ID", user_data["id"], "Rôle", user_data["role"])

    # 3. Connexion
    print("\n3. Connexion de l'utilisateur...")
    r = post(f"{BASE_URL}/api/auth/login", data={"username": email, "password": password})
    assert r.status_code == 200, r.text
    token = r.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("Token d'accès JWT généré avec succès.")

    # 4. Liste des agents
    print("\n4. Récupération du catalogue d'agents...")
    r = get(f"{BASE_URL}/api/agents")
    assert r.status_code == 200
    agents = r.json()
    print(f"Trouvé {len(agents)} agents dans la base de données.")
    assert len(agents) >= 40

    # 5. Upload d'un fichier de données
    print("\n5. Test de téléversement et parsing de fichier CSV...")
    csv_bytes = b"date,montant,client,statut\n2026-08-01,1500,Client A,Paye\n2026-08-05,2400,Client B,Paye\n2026-08-10,3200,Client C,En attente"
    r = post(
        f"{BASE_URL}/api/uploads",
        files={"file": ("ventes_aout.csv", io.BytesIO(csv_bytes), "text/csv")},
        headers=headers
    )
    assert r.status_code == 201, r.text
    file_id = r.json()["id"]
    print("Fichier CSV uploadé et indexé : ID =", file_id)

    # 6. Exécution d'un agent gratuit avec fichier joint (Générateur de slogans)
    print("\n6. Test de l'agent gratuit 'marketing-slogan' avec données...")
    inputs = {
        "company_name": "Nexora Corp",
        "product_desc": "un CRM intelligent pour agents immobiliers"
    }
    r = post(
        f"{BASE_URL}/api/agents/marketing-slogan/execute", 
        json={"inputs": inputs, "file_ids": [file_id]}, 
        headers=headers
    )
    assert r.status_code == 200, r.text
    exec_res = r.json()
    assert exec_res["status"] == "success"
    print("Statut :", exec_res["status"])
    print("Slogans générés :", exec_res["output"]["slogans"])
    print("Pitch :", exec_res["output"]["pitch"])

    # 7. Test d'exécution d'un agent Premium sans abonnement (Calculateur de ROI)
    print("\n7. Test de sécurité : exécution de l'agent premium 'finance-roi' sans abonnement...")
    finance_inputs = {
        "investment_amount": 10000,
        "annual_return_rate": 7,
        "years": 4
    }
    r = post(f"{BASE_URL}/api/agents/finance-roi/execute", json={"inputs": finance_inputs}, headers=headers)
    print(f"Statut HTTP reçu (doit être 403) : {r.status_code}")
    assert r.status_code == 403
    print("Détail du blocage sécurisé :", r.json()["detail"])

    # 8. Souscription à l'agent Premium
    print("\n8. Souscription à l'agent premium 'finance-roi'...")
    r = post(f"{BASE_URL}/api/subscriptions/subscribe", json={"agent_id": "finance-roi"}, headers=headers)
    assert r.status_code == 200, r.text
    sub_data = r.json()
    print(f"Abonnement créé avec succès (ID: {sub_data['id']}, Statut: {sub_data['status']})")

    # 9. Exécution après souscription
    print("\n9. Ré-essai de l'exécution de 'finance-roi' après abonnement...")
    r = post(f"{BASE_URL}/api/agents/finance-roi/execute", json={"inputs": finance_inputs}, headers=headers)
    assert r.status_code == 200, r.text
    roi_res = r.json()
    print("Calcul réussi !")
    print("Retour total :", roi_res["output"]["total_return"], "€")
    print("ROI (%) :", roi_res["output"]["roi_percentage"], "%")
    print("Résumé :", roi_res["output"]["summary"])

    # 10. Création d'un workflow multi-agents
    print("\n10. Création d'un workflow multi-agents (Marketing Slogan -> Traducteur Anglais)...")
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
                "text": "pitch",
                "target_language": "target_lang"
            }
        }
    ]
    r = post(
        f"{BASE_URL}/api/workflows", 
        json={
            "name": "Chaîne de Communication Marketing",
            "description": "Génère des slogans et traduit le pitch de vente final en anglais.",
            "definition": wf_definition
        }, 
        headers=headers
    )
    assert r.status_code == 201, r.text
    wf_data = r.json()
    wf_id = wf_data["id"]
    print(f"Workflow créé avec succès (ID: {wf_id}, Nom: {wf_data['name']})")

    # 11. Exécution du workflow
    print("\n11. Essai d'exécution du workflow sans abonnement à l'agent premium 'translator'...")
    wf_run_inputs = {
        "company_name": "CyberSec Systems",
        "product_desc": "des pare-feux pour les PME",
        "target_lang": "english"
    }
    r = post(f"{BASE_URL}/api/workflows/{wf_id}/run", json={"initial_inputs": wf_run_inputs}, headers=headers)
    print(f"Statut HTTP reçu (doit être 403) : {r.status_code}")
    assert r.status_code == 403

    # Souscription à 'translator'
    print("\nSouscription à 'translator'...")
    r = post(f"{BASE_URL}/api/subscriptions/subscribe", json={"agent_id": "translator"}, headers=headers)
    assert r.status_code == 200, r.text

    # Lancement réussi du workflow
    print("\nLancement du workflow avec tous les abonnements requis...")
    r = post(f"{BASE_URL}/api/workflows/{wf_id}/run", json={"initial_inputs": wf_run_inputs}, headers=headers)
    assert r.status_code == 200, r.text
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
        print("\n[ERREUR] Assert a échoué. Vérifiez la réponse de l'API :", e)
    except Exception as e:
        print("\n[ERREUR] Une exception s'est produite :", e)

