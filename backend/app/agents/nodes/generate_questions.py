from app.agents.state import ProjectState
from app.agents.tools.db_tools import save_clarification_questions, log_agent_event


async def generate_questions(state: ProjectState) -> dict:
    """
    Node 4: Persist clarification questions to DB, then trigger
    LangGraph interrupt to pause for human input.
    """
    questions = state.get("clarification_questions", [])

    # Persist questions to Supabase so frontend can display them
    await save_clarification_questions(
        project_id=state["project_id"],
        run_id=state["agent_run_id"],
        questions=questions,
    )

    await log_agent_event(
        run_id=state["agent_run_id"],
        event_type="awaiting_human_input",
        message=f"Agent paused — waiting for answers to {len(questions)} questions",
    )

    return {}
