from app.agents.state import ProjectState
from app.services.llm import get_llm
from app.agents.tools.db_tools import log_agent_event
from pydantic import BaseModel
from typing import List
from langchain_core.prompts import ChatPromptTemplate

class ClarificationQuestion(BaseModel):
    question_key: str
    question: str
    field_type: str = "text"
    options: List[str] = []

class MissingInfo(BaseModel):
    missing_information: List[str]
    questions: List[ClarificationQuestion]

async def detect_missing_info(state: ProjectState) -> dict:
    llm = get_llm("openai/gpt-oss-120b").with_structured_output(MissingInfo)
    prompt = ChatPromptTemplate.from_messages([
        ("system", "Analyze the brief and requirements. What is missing? Generate clarification questions if necessary."),
        ("human", "Brief: {brief}\nReqs: {reqs}\nPrevious Answers: {answers}")
    ])
    chain = prompt | llm
    res = await chain.ainvoke({
        "brief": state["brief"], 
        "reqs": state["requirements"],
        "answers": state.get("clarification_answers", {})
    })
    
    questions = [q.model_dump() for q in res.questions]
    needs_clarification = len(questions) > 0 and state.get("clarification_round", 0) < 2
    
    await log_agent_event(state["agent_run_id"], "detect_missing", f"Detected {len(questions)} missing items.")
    return {
        "missing_information": res.missing_information,
        "clarification_questions": questions,
        "needs_clarification": needs_clarification,
        "clarification_round": state.get("clarification_round", 0) + 1
    }
