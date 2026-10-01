"""
ScopeAI — Main LangGraph Agent Graph

Graph flow:
  START
    → analyze_brief
    → extract_requirements
    → detect_missing_info
      ├─ [needs_clarification=True]  → generate_questions → INTERRUPT → receive_answers → (loop back)
      └─ [needs_clarification=False] → design_solution → analyze_risks → create_roadmap → assemble_scope
    → END
"""
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver
from langgraph.types import interrupt

from app.agents.state import ProjectState
from app.agents.nodes.analyze_brief import analyze_brief
from app.agents.nodes.extract_requirements import extract_requirements
from app.agents.nodes.detect_missing import detect_missing_info
from app.agents.nodes.generate_questions import generate_questions
from app.agents.nodes.receive_answers import receive_answers
from app.agents.nodes.design_solution import design_solution
from app.agents.nodes.analyze_risks import analyze_risks
from app.agents.nodes.create_roadmap import create_roadmap
from app.agents.nodes.assemble_scope import assemble_scope


# ─── Human-in-the-loop interrupt node ──────────────────────────────────────

async def human_interrupt(state: ProjectState) -> dict:
    """
    This node triggers LangGraph's interrupt mechanism.
    Execution pauses here; the graph resumes when /resume is called
    with clarification_answers injected into the state.
    """
    answers = interrupt({
        "type": "clarification_required",
        "questions": state.get("clarification_questions", []),
        "run_id": state["agent_run_id"],
    })
    # When resumed, `answers` contains the human's responses
    return {"clarification_answers": answers}


# ─── Conditional routing ────────────────────────────────────────────────────

def route_after_detection(state: ProjectState) -> str:
    """Route based on whether clarification is needed."""
    if state.get("needs_clarification", False):
        return "generate_questions"
    return "design_solution"


# ─── Build the graph ────────────────────────────────────────────────────────

def build_graph() -> StateGraph:
    builder = StateGraph(ProjectState)

    # Add all nodes
    builder.add_node("analyze_brief", analyze_brief)
    builder.add_node("extract_requirements", extract_requirements)
    builder.add_node("detect_missing_info", detect_missing_info)
    builder.add_node("generate_questions", generate_questions)
    builder.add_node("human_interrupt", human_interrupt)
    builder.add_node("receive_answers", receive_answers)
    builder.add_node("design_solution", design_solution)
    builder.add_node("analyze_risks", analyze_risks)
    builder.add_node("create_roadmap", create_roadmap)
    builder.add_node("assemble_scope", assemble_scope)

    # Linear edges
    builder.add_edge(START, "analyze_brief")
    builder.add_edge("analyze_brief", "extract_requirements")
    builder.add_edge("extract_requirements", "detect_missing_info")

    # Conditional branch after detection
    builder.add_conditional_edges(
        "detect_missing_info",
        route_after_detection,
        {
            "generate_questions": "generate_questions",
            "design_solution": "design_solution",
        },
    )

    # HITL flow
    builder.add_edge("generate_questions", "human_interrupt")
    builder.add_edge("human_interrupt", "receive_answers")
    builder.add_edge("receive_answers", "detect_missing_info")  # Loop back to re-evaluate

    # Post-clarification flow
    builder.add_edge("design_solution", "analyze_risks")
    builder.add_edge("analyze_risks", "create_roadmap")
    builder.add_edge("create_roadmap", "assemble_scope")
    builder.add_edge("assemble_scope", END)

    # Use in-memory checkpointer (swap for Postgres in production)
    checkpointer = MemorySaver()
    return builder.compile(checkpointer=checkpointer)


# Singleton graph instance
graph = build_graph()
