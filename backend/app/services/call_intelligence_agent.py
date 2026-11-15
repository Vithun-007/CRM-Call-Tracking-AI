from typing import TypedDict

from pydantic import BaseModel, Field
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_groq import ChatGroq
from langgraph.graph import END, START, StateGraph

from app.core.config import (
    GROQ_API_KEY,
    GROQ_MODEL,
    validate_ai_configuration,
)


class CallAnalysis(BaseModel):
    customer_intent: str = Field(
        description=(
            "The main purpose or intent expressed by the customer. "
            "Do not infer intent beyond what the notes support."
        )
    )
    requirements: list[str] = Field(
        description=(
            "Specific customer requirements explicitly mentioned "
            "in the call notes."
        )
    )
    customer_interests: list[str] = Field(
        description=(
            "Products, services, or topics the customer expressed "
            "interest in."
        )
    )
    action_items: list[str] = Field(
        description=(
            "Only concrete actions explicitly agreed, assigned, or "
            "committed to by a participant in the conversation. "
            "Do not include customer requests, questions, interests, "
            "or actions merely recommended by the AI. Return an empty "
            "list when no explicit commitment is present."
        )
    )
    follow_up_recommendation: str = Field(
        description=(
            "A suggested next step based on the notes. This may include "
            "responding to customer requests or arranging a discussion, "
            "but it must be clearly presented as a recommendation, "
            "not as an agreed or completed action. If no useful next "
            "step is apparent, state that clearly."
        )
    )


class CallIntelligenceState(TypedDict, total=False):
    notes: str
    analysis: CallAnalysis
    summary: str
    validation_error: str
    attempts: int


ANALYSIS_PROMPT = """
You are the analysis component of a CRM Call Intelligence Agent.

Analyze the original call notes and extract structured information.

STRICT EXTRACTION RULES:

1. Use only information explicitly supported by the original notes.
   Never invent customer details, requirements, interests, or commitments.

2. CUSTOMER INTENT:
   Identify the main purpose or objective expressed by the customer.
   Do not turn a question or request into a confirmed purchase decision.

3. REQUIREMENTS:
   Extract specific needs, constraints, or requested information
   explicitly mentioned by the customer.
   Do not add assumptions about scope, budget, deadlines, or technology.

4. CUSTOMER INTERESTS:
   Identify products, services, capabilities, or topics the customer
   expressed interest in. Interest does not mean purchase intent.

5. ACTION ITEMS — APPLY THIS STRICT TEST:
   Include an action item ONLY when the notes explicitly establish
   that a participant agreed to, accepted, was assigned, or committed
   to carrying out a concrete action.

   Examples:
   - "Our team will send the proposal tomorrow."
     -> Include sending the proposal tomorrow.
   - "I will arrange a technical meeting."
     -> Include arranging the technical meeting.
   - "Agreed to share the pricing document."
     -> Include sharing the pricing document.

   Do NOT classify these as confirmed action items:
   - "Customer wants a technical discussion."
   - "Customer asked about pricing."
   - "Customer is interested in a demo."
   - "Need to discuss migration options."
   - "Could arrange a follow-up meeting."

   These statements express requests, interests, questions, or possible
   next steps. They do not prove that anyone committed to performing
   an action.

   If the notes do not explicitly establish an agreed or assigned
   action, return an empty action_items list.

6. FOLLOW-UP RECOMMENDATION:
   Suggest a practical next step when appropriate, based on the notes.
   You may recommend responding to a customer request or arranging
   a discussion, but clearly label it as a recommendation.
   Never move a recommendation into action_items unless the original
   notes explicitly establish a commitment.

7. Handle ambiguity conservatively. When in doubt, do not claim
   that an action was agreed. Put a useful possible next step in
   follow_up_recommendation instead.

8. Do not treat an inferred recommendation as a completed action,
   confirmed commitment, or scheduled activity.

Return structured information only.
"""


SUMMARY_PROMPT = """
You are the professional summarization component of a CRM
Call Intelligence Agent.

Convert the original shorthand call notes into a concise,
professional business summary.

Preserve the important facts, customer requirements, interests,
and explicitly agreed follow-up actions.

IMPORTANT:
- Preserve the difference between a customer request and an agreed action.
- Do not say that a meeting was scheduled unless the notes confirm it.
- Do not say that information was sent unless the notes confirm it.
- Do not turn suggested next steps into confirmed commitments.
- Do not invent names, dates, commitments, requirements, products,
  prices, or other information.

Return only the professional summary without headings.

Original call notes:
{notes}

Structured call analysis:
{analysis}
"""


def get_model() -> ChatGroq:
    validate_ai_configuration()

    return ChatGroq(
        model=GROQ_MODEL,
        groq_api_key=GROQ_API_KEY,
        temperature=0.2,
        max_tokens=1024,
    )


def analyze_call(state: CallIntelligenceState) -> dict:
    model = get_model()

    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", ANALYSIS_PROMPT),
            ("human", "Analyze these CRM call notes:\n\n{notes}"),
        ]
    )

    analysis_model = model.with_structured_output(CallAnalysis)

    chain = prompt | analysis_model

    analysis = chain.invoke({"notes": state["notes"]})

    return {"analysis": analysis}


def generate_summary(state: CallIntelligenceState) -> dict:
    model = get_model()

    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", SUMMARY_PROMPT),
        ]
    )

    chain = prompt | model | StrOutputParser()

    analysis = state["analysis"].model_dump()

    summary = chain.invoke(
        {
            "notes": state["notes"],
            "analysis": analysis,
        }
    ).strip()

    return {
        "summary": summary,
        "attempts": state.get("attempts", 0) + 1,
    }


def validate_result(state: CallIntelligenceState) -> dict:
    summary = state.get("summary", "").strip()

    if len(summary) < 3:
        return {
            "validation_error": "The generated summary is empty or too short."
        }

    return {
        "summary": summary,
        "validation_error": "",
    }


def route_after_validation(state: CallIntelligenceState) -> str:
    if (
        state.get("validation_error")
        and state.get("attempts", 0) < 2
    ):
        return "generate_summary"

    if state.get("validation_error"):
        raise ValueError(
            "The AI agent could not generate a valid summary after retrying."
        )

    return END


def build_call_intelligence_graph():
    graph = StateGraph(CallIntelligenceState)

    graph.add_node("analyze_call", analyze_call)
    graph.add_node("generate_summary", generate_summary)
    graph.add_node("validate_result", validate_result)

    graph.add_edge(START, "analyze_call")
    graph.add_edge("analyze_call", "generate_summary")
    graph.add_edge("generate_summary", "validate_result")

    graph.add_conditional_edges(
        "validate_result",
        route_after_validation,
        {
            "generate_summary": "generate_summary",
            END: END,
        },
    )

    return graph.compile()


call_intelligence_graph = build_call_intelligence_graph()


def run_call_intelligence_agent(notes: str) -> dict:
    result = call_intelligence_graph.invoke(
        {
            "notes": notes,
            "attempts": 0,
        }
    )

    analysis = result["analysis"]

    return {
        "summary": result["summary"],
        "customer_intent": analysis.customer_intent,
        "requirements": analysis.requirements,
        "customer_interests": analysis.customer_interests,
        "action_items": analysis.action_items,
        "follow_up_recommendation": analysis.follow_up_recommendation,
    }
