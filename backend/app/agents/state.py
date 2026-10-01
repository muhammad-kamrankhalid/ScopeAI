from typing import TypedDict, List, Dict, Any, Optional


class ProjectState(TypedDict):
    # Core identifiers
    project_id: str
    user_id: str
    agent_run_id: str

    # Input
    brief: str

    # Node outputs
    analysis: Dict[str, Any]                  # BriefAnalysis
    requirements: List[Dict[str, Any]]        # List of Requirement dicts
    missing_information: List[str]            # Gaps detected
    clarification_questions: List[Dict]       # Questions to ask human
    clarification_answers: Dict[str, str]     # Human responses keyed by question id
    architecture: Dict[str, Any]              # ArchitectureOutput
    risks: List[Dict[str, Any]]              # List of Risk dicts
    milestones: List[Dict[str, Any]]         # List of Milestone dicts
    final_scope: Dict[str, Any]              # Assembled final document

    # Control flow
    needs_clarification: bool
    clarification_round: int                  # Max 2 rounds to prevent loops
    error: Optional[str]                     # Any error message
