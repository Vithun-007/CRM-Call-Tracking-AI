from app.services.call_intelligence_agent import (
    run_call_intelligence_agent,
)


def generate_call_intelligence(notes: str) -> dict:
    """
    Run the LangGraph-orchestrated Call Intelligence Agent.

    Returns the professional summary and structured call intelligence.
    """
    return run_call_intelligence_agent(notes)


def generate_call_summary(notes: str) -> str:
    """
    Backward-compatible summarization function.

    Existing API consumers continue receiving a plain summary string.
    """
    result = generate_call_intelligence(notes)
    summary = result["summary"].strip()

    if not summary:
        raise ValueError("The AI agent returned an empty summary.")

    return summary
