from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import agent
from app.config import get_settings

settings = get_settings()

app = FastAPI(
    title="ScopeAI Backend",
    description="LangGraph-powered project discovery agent",
    version="1.0.0",
)

# CORS — allow Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(agent.router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "scopeai-backend"}
