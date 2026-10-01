from app.agents.state import ProjectState
from app.services.llm import get_llm
from app.agents.tools.db_tools import create_milestone, log_agent_event
from pydantic import BaseModel
from typing import List
from langchain_core.prompts import ChatPromptTemplate

class Task(BaseModel):
    title: str
    description: str

class Milestone(BaseModel):
    phase: int
    title: str
    description: str
    tasks: List[Task]

class Roadmap(BaseModel):
    milestones: List[Milestone]

async def create_roadmap(state: ProjectState) -> dict:
    llm = get_llm("openai/gpt-oss-120b").with_structured_output(Roadmap)
    prompt = ChatPromptTemplate.from_messages([
        ("system", "Create a project roadmap with milestones based on requirements."),
        ("human", "Reqs: {reqs}")
    ])
    chain = prompt | llm
    res = await chain.ainvoke({"reqs": state["requirements"]})
    milestones = []
    for m in res.milestones:
        m_dict = m.model_dump()
        m_dict["tasks_json"] = m_dict.pop("tasks")
        milestones.append(m_dict)
        await create_milestone(state["project_id"], m_dict["phase"], m_dict["title"], m_dict["description"], m_dict["tasks_json"])
        
    await log_agent_event(state["agent_run_id"], "create_roadmap", f"Created {len(milestones)} milestones.")
    return {"milestones": milestones}
