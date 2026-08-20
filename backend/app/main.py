from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base, SessionLocal
from .seed import seed_agents
from .routers import auth, agents, subscriptions, workflows

# Create Database tables
Base.metadata.create_all(bind=engine)

# Seed database with default agents on startup
db = SessionLocal()
try:
    seed_agents(db)
finally:
    db.close()

app = FastAPI(
    title="AgentHub AI - Marketplace SaaS d'agents IA",
    description="API Backend pour la plateforme SaaS AgentHub AI",
    version="1.0.0"
)

# Enable CORS for frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to the frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router)
app.include_router(agents.router)
app.include_router(subscriptions.router)
app.include_router(workflows.router)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "message": "Bienvenue sur l'API d'AgentHub AI",
        "docs_url": "/docs"
    }
