from langchain_groq import ChatGroq
from app.config import get_settings

def get_llm(model: str = "openai/gpt-oss-120b") -> ChatGroq:
    settings = get_settings()
    return ChatGroq(
        model=model,
        temperature=0.0,
        api_key=settings.groq_api_key
    )
