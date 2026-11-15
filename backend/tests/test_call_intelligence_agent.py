import pytest

from app.services import call_intelligence_agent as agent


def make_analysis():
    return agent.CallAnalysis(
        customer_intent="The customer is interested in data migration.",
        requirements=["Data migration"],
        customer_interests=["Indium services"],
        action_items=[],
        follow_up_recommendation="Follow up to discuss the migration requirement.",
    )


def test_agent_graph_completes_successfully(monkeypatch):
    monkeypatch.setattr(
        agent,
        "analyze_call",
        lambda state: {"analysis": make_analysis()},
    )

    monkeypatch.setattr(
        agent,
        "generate_summary",
        lambda state: {
            "summary": "The customer expressed interest in data migration services.",
            "attempts": state.get("attempts", 0) + 1,
        },
    )

    graph = agent.build_call_intelligence_graph()

    result = graph.invoke(
        {
            "notes": "requirement - data migration",
            "attempts": 0,
        }
    )

    assert result["summary"] == (
        "The customer expressed interest in data migration services."
    )
    assert result["validation_error"] == ""
    assert result["attempts"] == 1


def test_agent_retries_when_summary_validation_fails(monkeypatch):
    attempts = {"count": 0}

    monkeypatch.setattr(
        agent,
        "analyze_call",
        lambda state: {"analysis": make_analysis()},
    )

    def fake_generate_summary(state):
        attempts["count"] += 1

        summary = (
            "x"
            if attempts["count"] == 1
            else "The customer requested information about data migration."
        )

        return {
            "summary": summary,
            "attempts": state.get("attempts", 0) + 1,
        }

    monkeypatch.setattr(
        agent,
        "generate_summary",
        fake_generate_summary,
    )

    graph = agent.build_call_intelligence_graph()

    result = graph.invoke(
        {
            "notes": "requirement - data migration",
            "attempts": 0,
        }
    )

    assert attempts["count"] == 2
    assert result["attempts"] == 2
    assert result["validation_error"] == ""
    assert len(result["summary"]) >= 3


def test_agent_stops_after_two_invalid_summaries(monkeypatch):
    attempts = {"count": 0}

    monkeypatch.setattr(
        agent,
        "analyze_call",
        lambda state: {"analysis": make_analysis()},
    )

    def fake_generate_summary(state):
        attempts["count"] += 1

        return {
            "summary": "x",
            "attempts": state.get("attempts", 0) + 1,
        }

    monkeypatch.setattr(
        agent,
        "generate_summary",
        fake_generate_summary,
    )

    graph = agent.build_call_intelligence_graph()

    with pytest.raises(ValueError, match="could not generate a valid summary"):
        graph.invoke(
            {
                "notes": "requirement - data migration",
                "attempts": 0,
            }
        )

    assert attempts["count"] == 2
