from importlib import import_module


def test_ai_analyze_endpoint_returns_structured_intelligence(
    client,
    monkeypatch,
):
    expected_result = {
        "summary": "The customer expressed interest in data migration services.",
        "customer_intent": "The customer is exploring data migration.",
        "requirements": ["Data migration"],
        "customer_interests": ["Indium services"],
        "action_items": ["Share service information"],
        "follow_up_recommendation": "Follow up to discuss the requirement.",
    }

    ai_router_module = import_module("app.routers.ai_router")

    monkeypatch.setattr(
        ai_router_module,
        "generate_call_intelligence",
        lambda notes: expected_result,
    )

    response = client.post(
        "/api/v1/ai/analyze",
        json={
            "notes": "requirement - data migration"
        },
    )

    assert response.status_code == 200
    assert response.json()["success"] is True
    assert response.json()["data"] == expected_result


def test_ai_analyze_endpoint_rejects_short_notes(client):
    response = client.post(
        "/api/v1/ai/analyze",
        json={"notes": "a"},
    )

    assert response.status_code == 422


def test_ai_analyze_endpoint_handles_agent_configuration_error(
    client,
    monkeypatch,
):
    ai_router_module = import_module("app.routers.ai_router")

    def raise_configuration_error(notes):
        raise ValueError("AI configuration is unavailable.")

    monkeypatch.setattr(
        ai_router_module,
        "generate_call_intelligence",
        raise_configuration_error,
    )

    response = client.post(
        "/api/v1/ai/analyze",
        json={"notes": "Customer requested a product demo."},
    )

    assert response.status_code == 503
    assert response.json()["detail"] == "AI configuration is unavailable."
