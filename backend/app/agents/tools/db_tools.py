"""
Database tools called by agent nodes.
The LLM reasons; these tools validate and persist.
"""
from app.services.supabase_client import get_supabase
from datetime import datetime, timezone
from typing import Any
import uuid


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


async def log_agent_event(run_id: str, event_type: str, message: str, metadata: dict = None) -> None:
    """Log an agent activity event to agent_events table."""
    try:
        supabase = get_supabase()
        supabase.table("agent_events").insert({
            "id": str(uuid.uuid4()),
            "run_id": run_id,
            "event_type": event_type,
            "message": message,
            "metadata": metadata or {},
            "created_at": _now(),
        }).execute()
    except Exception as e:
        print(f"[log_agent_event] Warning: {e}")


async def save_requirement(
    project_id: str,
    title: str,
    description: str,
    req_type: str,
    priority: str,
) -> dict:
    """Save a requirement to the requirements table. Returns saved row."""
    supabase = get_supabase()
    row = {
        "id": str(uuid.uuid4()),
        "project_id": project_id,
        "title": title,
        "description": description,
        "type": req_type,
        "priority": priority,
        "status": "pending",   # pending | approved | rejected
        "source": "ai",
        "created_at": _now(),
    }
    result = supabase.table("requirements").insert(row).execute()
    return result.data[0] if result.data else row


async def save_clarification_questions(run_id: str, project_id: str, questions: list[dict]) -> None:
    """Save clarification questions so the frontend can display them."""
    supabase = get_supabase()
    rows = [
        {
            "id": str(uuid.uuid4()),
            "project_id": project_id,
            "run_id": run_id,
            "question_key": q.get("question_key"),
            "question": q.get("question"),
            "field_type": q.get("field_type", "text"),
            "options": q.get("options"),
            "created_at": _now(),
        }
        for q in questions
    ]
    if rows:
        supabase.table("clarification_questions").insert(rows).execute()


async def save_architecture(project_id: str, architecture: dict) -> dict:
    """Save the solution architecture."""
    supabase = get_supabase()
    row = {
        "id": str(uuid.uuid4()),
        "project_id": project_id,
        "diagram_json": architecture,
        "description": architecture.get("summary", ""),
        "status": "pending",
        "created_at": _now(),
    }
    result = supabase.table("architectures").insert(row).execute()
    return result.data[0] if result.data else row


async def save_risk(
    project_id: str,
    title: str,
    description: str,
    severity: str,
    mitigation: str,
) -> dict:
    """Save a risk to the risks table."""
    supabase = get_supabase()
    row = {
        "id": str(uuid.uuid4()),
        "project_id": project_id,
        "title": title,
        "description": description,
        "severity": severity,
        "mitigation": mitigation,
        "status": "pending",
        "created_at": _now(),
    }
    result = supabase.table("risks").insert(row).execute()
    return result.data[0] if result.data else row


async def create_milestone(
    project_id: str,
    phase: int,
    title: str,
    description: str,
    tasks: list[dict],
) -> dict:
    """Create a roadmap milestone."""
    supabase = get_supabase()
    row = {
        "id": str(uuid.uuid4()),
        "project_id": project_id,
        "phase": phase,
        "title": title,
        "description": description,
        "tasks_json": tasks,
        "status": "todo",
        "created_at": _now(),
    }
    result = supabase.table("milestones").insert(row).execute()
    return result.data[0] if result.data else row


async def update_agent_run(run_id: str, status: str, final_scope: dict = None) -> None:
    """Update the agent run status and final scope."""
    supabase = get_supabase()
    update_data: dict[str, Any] = {
        "status": status,
        "completed_at": _now(),
    }
    if final_scope:
        update_data["graph_state_json"] = final_scope
    supabase.table("agent_runs").update(update_data).eq("id", run_id).execute()


async def get_project_context(project_id: str) -> dict:
    """Retrieve all saved artifacts for a project (for agent context retrieval)."""
    supabase = get_supabase()
    requirements = supabase.table("requirements").select("*").eq("project_id", project_id).execute()
    risks = supabase.table("risks").select("*").eq("project_id", project_id).execute()
    milestones = supabase.table("milestones").select("*").eq("project_id", project_id).execute()
    return {
        "requirements": requirements.data or [],
        "risks": risks.data or [],
        "milestones": milestones.data or [],
    }
