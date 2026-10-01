from app.agents.state import ProjectState
from app.services.llm import get_llm
from app.agents.tools.db_tools import save_risk, log_agent_event
from pydantic import BaseModel
from typing import List
from langchain_core.prompts import ChatPromptTemplate

class Risk(BaseModel):
    title: str
    description: str
    severity: str
    mitigation: str

class RisksList(BaseModel):
    risks: List[Risk]

async def analyze_risks(state: ProjectState) -> dict:
    llm = get_llm("openai/gpt-oss-120b").with_structured_output(RisksList)
    prompt = ChatPromptTemplate.from_messages([
        ("system", "Identify project risks based on requirements and architecture."),
        ("human", "Reqs: {reqs}\nArch: {arch}")
    ])
    chain = prompt | llm
    res = await chain.ainvoke({"reqs": state["requirements"], "arch": state["architecture"]})
    risks = [r.model_dump() for r in res.risks]
    for risk in risks:
        await save_risk(state["project_id"], risk["title"], risk["description"], risk["severity"], risk["mitigation"])
    await log_agent_event(state["agent_run_id"], "analyze_risks", f"Identified {len(risks)} risks.")
    return {"risks": risks}
