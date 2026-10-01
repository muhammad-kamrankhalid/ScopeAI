from app.agents.state import ProjectState
from app.services.llm import get_llm
from app.agents.tools.db_tools import save_requirement, log_agent_event
from pydantic import BaseModel, Field
from typing import List
from langchain_core.prompts import ChatPromptTemplate

class Requirement(BaseModel):
    title: str
    description: str
    type: str = Field(description="'functional' or 'non_functional'")
    priority: str = Field(description="'high', 'medium', or 'low'")

class RequirementsList(BaseModel):
    requirements: List[Requirement]

async def extract_requirements(state: ProjectState) -> dict:
    llm = get_llm("openai/gpt-oss-120b").with_structured_output(RequirementsList)
    prompt = ChatPromptTemplate.from_messages([
        ("system", "Extract detailed requirements from the brief. Return functional and non_functional."),
        ("human", "Brief: {brief}\nAnalysis: {analysis}")
    ])
    chain = prompt | llm
    res = await chain.ainvoke({"brief": state["brief"], "analysis": state["analysis"]})
    reqs = [r.model_dump() for r in res.requirements]
    for req in reqs:
        await save_requirement(state["project_id"], req["title"], req["description"], req["type"], req["priority"])
    await log_agent_event(state["agent_run_id"], "extract_requirements", f"Extracted {len(reqs)} requirements.")
    return {"requirements": reqs}
