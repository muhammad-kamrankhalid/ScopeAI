from app.agents.state import ProjectState
from app.services.llm import get_llm
from app.agents.tools.db_tools import log_agent_event
from typing import TypedDict
from langchain_core.prompts import ChatPromptTemplate

class BriefAnalysis(TypedDict):
    project_type: str
    target_audience: str
    core_problem: str
    tone: str

async def analyze_brief(state: ProjectState) -> dict:
    llm = get_llm("openai/gpt-oss-120b").with_structured_output(BriefAnalysis)
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are an expert product manager analyzing a client brief."),
        ("human", "{brief}")
    ])
    chain = prompt | llm
    analysis = await chain.ainvoke({"brief": state["brief"]})
    await log_agent_event(state["agent_run_id"], "analyze_brief", "Analyzed client brief.")
    return {"analysis": analysis}
