from app.agents.state import ProjectState
from app.agents.tools.db_tools import log_agent_event


async def receive_answers(state: ProjectState) -> dict:
    """
    Node 5: Human has submitted clarification answers.
    Merge them into state and increment the clarification round counter.
    The answers are already in state["clarification_answers"] 
    because they were injected when the graph was resumed.
    """
    answers = state.get("clarification_answers", {})
    current_round = state.get("clarification_round", 0)

    await log_agent_event(
        run_id=state["agent_run_id"],
        event_type="answers_received",
        message=f"User supplied {len(answers)} clarification answers (round {current_round + 1})",
    )

    return {
        "clarification_round": current_round + 1,
        "needs_clarification": False,  # Reset — detect_missing will re-evaluate
    }
