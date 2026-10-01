from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from enum import Enum


# ─── LLM Output Schemas (structured output) ────────────────────────────────

class BriefAnalysis(BaseModel):
    problem: str = Field(description="The core business problem being solved")
    users: List[str] = Field(description="Types of users involved")
    goals: List[str] = Field(description="Key goals or outcomes expected")
    domain: str = Field(description="Business domain (e.g. e-commerce, healthcare)")
    constraints: List[str] = Field(description="Known constraints or limitations")


class Requirement(BaseModel):
    title: str = Field(description="Short title of the requirement")
    description: str = Field(description="Detailed description")
    type: Literal["functional", "non_functional"]
    priority: Literal["high", "medium", "low"]


class RequirementsOutput(BaseModel):
    functional: List[Requirement]
    non_functional: List[Requirement]


class ClarificationQuestion(BaseModel):
    id: str = Field(description="Unique ID like 'q1', 'q2'")
    question: str = Field(description="The question to ask the user")
    field_type: Literal["text", "checkbox", "select"] = "text"
    options: Optional[List[str]] = Field(default=None, description="Options for checkbox/select")


class MissingInfoOutput(BaseModel):
    needs_clarification: bool
    missing_items: List[str]
    questions: List[ClarificationQuestion]


class Component(BaseModel):
    name: str
    type: str  # e.g. "frontend", "backend", "database", "external_api", "ai"
    description: str
    technology: str


class Integration(BaseModel):
    name: str
    purpose: str
    complexity: Literal["low", "medium", "high"]


class ArchitectureOutput(BaseModel):
    summary: str
    components: List[Component]
    integrations: List[Integration]
    data_flow: str = Field(description="Plain-text description of how data flows through the system")


class Risk(BaseModel):
    title: str
    description: str
    severity: Literal["high", "medium", "low"]
    mitigation: str


class RisksOutput(BaseModel):
    risks: List[Risk]


class Task(BaseModel):
    title: str
    priority: Literal["high", "medium", "low"]
    complexity: Literal["high", "medium", "low"]
    dependencies: List[str]
    estimated_days: int


class Milestone(BaseModel):
    phase: int
    title: str
    description: str
    tasks: List[Task]


class RoadmapOutput(BaseModel):
    milestones: List[Milestone]
    total_estimated_days: int


# ─── API Request/Response Schemas ───────────────────────────────────────────

class StartAgentRequest(BaseModel):
    project_id: str
    brief: str
    user_id: str


class ResumeAgentRequest(BaseModel):
    run_id: str
    project_id: str
    answers: dict  # { "q1": "answer1", "q2": "answer2" }


class AgentStatusResponse(BaseModel):
    run_id: str
    status: str  # "running" | "awaiting_input" | "completed" | "error"
    current_node: Optional[str] = None
    questions: Optional[List[ClarificationQuestion]] = None


class RequirementActionRequest(BaseModel):
    requirement_id: str
    action: Literal["approve", "reject"]
    edited_title: Optional[str] = None
    edited_description: Optional[str] = None
