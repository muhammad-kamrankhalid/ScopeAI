from app.agents.state import ProjectState
from app.services.llm import get_llm
from app.agents.tools.db_tools import save_architecture, log_agent_event
from pydantic import BaseModel
from langchain_core.prompts import ChatPromptTemplate

class ArchitectureOutput(BaseModel):
    frontend: str
    backend: str
    database: str
    infrastructure: str

async def design_solution(state: ProjectState) -> dict:
    llm = get_llm("openai/gpt-oss-120b").with_structured_output(ArchitectureOutput)
    prompt = ChatPromptTemplate.from_messages([
        ("system", "Design a tech stack solution based on the requirements."),
        ("human", "Reqs: {reqs}")
    ])
    chain = prompt | llm
    res = await chain.ainvoke({"reqs": state["requirements"]})
    arch = res.model_dump()
    await save_architecture(state["project_id"], arch)
    await log_agent_event(state["agent_run_id"], "design_solution", "Designed architecture.")
    return {"architecture": arch}
