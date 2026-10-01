from app.agents.state import ProjectState
from app.agents.tools.db_tools import update_agent_run, log_agent_event


async def assemble_scope(state: ProjectState) -> dict:
    """
    Node 9 (Final): Assemble the final scope document from all outputs
    and mark the agent run as complete.
    """
    final_scope = {
        "project_id": state["project_id"],
        "analysis": state.get("analysis", {}),
        "requirements_count": len(state.get("requirements", [])),
        "architecture": state.get("architecture", {}),
        "risks_count": len(state.get("risks", [])),
        "milestones_count": len(state.get("milestones", [])),
        "clarification_rounds": state.get("clarification_round", 0),
        "status": "completed",
    }

    # Mark agent run as complete in DB
    await update_agent_run(
        run_id=state["agent_run_id"],
        status="completed",
        final_scope=final_scope,
    )

    await log_agent_event(
        run_id=state["agent_run_id"],
        event_type="scope_complete",
        message="Project scope generation complete ✓",
    )

    return {"final_scope": final_scope}
