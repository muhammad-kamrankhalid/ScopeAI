"""
Agent API routes:
  POST /api/agent/start   — Start a new agent run
  GET  /api/agent/status  — Check run status (polling)
  POST /api/agent/resume  — Submit clarification answers
  GET  /api/agent/stream  — SSE stream of agent events
"""
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from app.models.schemas import StartAgentRequest, ResumeAgentRequest
from app.agents.graph import graph
from app.services.supabase_client import get_supabase
from app.agents.tools.db_tools import update_agent_run
import uuid
import json
import asyncio
from datetime import datetime, timezone

router = APIRouter(prefix="/api/agent", tags=["agent"])


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


@router.post("/start")
async def start_agent(req: StartAgentRequest):
    """
    Start a new LangGraph agent run for a project.
    Returns the run_id immediately; frontend polls /status.
    """
    run_id = str(uuid.uuid4())
    supabase = get_supabase()

    # Create agent_run record
    supabase.table("agent_runs").insert({
        "id": run_id,
        "project_id": req.project_id,
        "status": "running",
        "started_at": _now(),
    }).execute()

    # Initial state
    initial_state = {
        "project_id": req.project_id,
        "user_id": req.user_id,
        "agent_run_id": run_id,
        "brief": req.brief,
        "analysis": {},
        "requirements": [],
        "missing_information": [],
        "clarification_questions": [],
        "clarification_answers": {},
        "architecture": {},
        "risks": [],
        "milestones": [],
        "final_scope": {},
        "needs_clarification": False,
        "clarification_round": 0,
        "error": None,
    }

    # Run graph asynchronously (non-blocking)
    config = {"configurable": {"thread_id": run_id}}
    asyncio.create_task(_run_graph(initial_state, config, run_id))

    return {"run_id": run_id, "status": "running"}


async def _run_graph(initial_state: dict, config: dict, run_id: str):
    """Background task that runs the graph until completion or interrupt."""
    try:
        async for event in graph.astream(initial_state, config=config):
            pass  # Events are logged to DB inside each node
    except Exception as e:
        await update_agent_run(run_id=run_id, status="error")
        supabase = get_supabase()
        supabase.table("agent_events").insert({
            "id": str(uuid.uuid4()),
            "run_id": run_id,
            "event_type": "error",
            "message": str(e),
            "metadata": {},
            "created_at": _now(),
        }).execute()


@router.get("/status/{run_id}")
async def get_status(run_id: str):
    """
    Poll the status of an agent run.
    Returns status + clarification questions if awaiting input.
    """
    supabase = get_supabase()

    # Get run record
    run = supabase.table("agent_runs").select("*").eq("id", run_id).single().execute()
    if not run.data:
        raise HTTPException(status_code=404, detail="Run not found")

    run_data = run.data

    # Check current graph state for interrupt
    config = {"configurable": {"thread_id": run_id}}
    state = graph.get_state(config)

    questions = None
    status = run_data.get("status", "running")

    # Detect HITL interrupt
    if state and state.next and "human_interrupt" in state.next:
        status = "awaiting_input"
        questions_result = supabase.table("clarification_questions") \
            .select("*").eq("run_id", run_id).order("created_at").execute()
        questions = questions_result.data or []

    return {
        "run_id": run_id,
        "status": status,
        "current_node": list(state.next)[0] if state and state.next else None,
        "questions": questions,
    }


@router.post("/resume")
async def resume_agent(req: ResumeAgentRequest):
    """
    Resume a paused agent run with human clarification answers.
    Injects answers into the graph state and continues execution.
    """
    config = {"configurable": {"thread_id": req.run_id}}

    # Resume the graph with answers
    asyncio.create_task(_resume_graph(req.answers, config, req.run_id))

    return {"run_id": req.run_id, "status": "resumed"}


async def _resume_graph(answers: dict, config: dict, run_id: str):
    """Background task that resumes the graph after HITL interrupt."""
    try:
        async for event in graph.astream(
            {"clarification_answers": answers},
            config=config,
        ):
            pass
    except Exception as e:
        await update_agent_run(run_id=run_id, status="error")


@router.get("/stream/{run_id}")
async def stream_events(run_id: str):
    """
    SSE endpoint — streams agent_events for real-time activity feed.
    Frontend subscribes to this for the live timeline.
    """
    supabase = get_supabase()

    async def event_generator():
        last_id = None
        while True:
            query = supabase.table("agent_events").select("*").eq("run_id", run_id).order("created_at")
            if last_id:
                query = query.gt("id", last_id)
            result = query.execute()

            for event in (result.data or []):
                last_id = event["id"]
                yield f"data: {json.dumps(event)}\n\n"

            # Check if run is complete
            run = supabase.table("agent_runs").select("status").eq("id", run_id).single().execute()
            if run.data and run.data.get("status") in ("completed", "error"):
                yield f"data: {json.dumps({'event_type': 'stream_end', 'run_id': run_id})}\n\n"
                break

            await asyncio.sleep(1.5)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
