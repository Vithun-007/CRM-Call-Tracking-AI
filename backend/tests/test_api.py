from datetime import date

from importlib import import_module


def create_test_lead(client):
    response = client.post(
        "/api/v1/leads",
        json={
            "lead_name": "Test Customer",
            "company": "Test Technologies",
            "contact_number": "+919876543210",
        },
    )

    assert response.status_code == 201
    return response.json()


def create_test_call(client, lead_id):
    response = client.post(
        f"/api/v1/leads/{lead_id}/calls",
        json={
            "call_date": "2026-11-14",
            "original_notes": (
                "Customer interested in CRM. "
                "Requested a product demonstration."
            ),
            "notes": (
                "The customer expressed interest in the CRM solution "
                "and requested a product demonstration."
            ),
            "ai_summary": (
                "The customer is interested in the CRM solution "
                "and requested a product demonstration."
            ),
        },
    )

    assert response.status_code == 201
    return response.json()


def test_root_endpoint(client):
    response = client.get("/")

    assert response.status_code == 200
    assert response.json()["success"] is True


def test_health_endpoint(client):
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
    assert response.json()["database"] == "SQLite"


def test_lead_crud(client):
    lead = create_test_lead(client)
    lead_id = lead["id"]

    assert lead["lead_name"] == "Test Customer"

    list_response = client.get("/api/v1/leads")
    assert list_response.status_code == 200
    assert list_response.json()["total"] == 1

    search_response = client.get(
        "/api/v1/leads",
        params={"search": "Test Customer"},
    )
    assert search_response.status_code == 200
    assert search_response.json()["total"] == 1

    get_response = client.get(f"/api/v1/leads/{lead_id}")
    assert get_response.status_code == 200
    assert get_response.json()["id"] == lead_id

    update_response = client.put(
        f"/api/v1/leads/{lead_id}",
        json={
            "lead_name": "Updated Customer",
            "company": "Updated Technologies",
            "contact_number": "+919876543211",
        },
    )

    assert update_response.status_code == 200
    assert update_response.json()["lead_name"] == "Updated Customer"

    delete_response = client.delete(f"/api/v1/leads/{lead_id}")
    assert delete_response.status_code == 200

    missing_response = client.get(f"/api/v1/leads/{lead_id}")
    assert missing_response.status_code == 404


def test_invalid_lead_creation(client):
    response = client.post(
        "/api/v1/leads",
        json={
            "lead_name": "A",
            "company": "Test Technologies",
            "contact_number": "+919876543210",
        },
    )

    assert response.status_code == 422


def test_call_creation_and_retrieval(client):
    lead = create_test_lead(client)
    call = create_test_call(client, lead["id"])

    assert call["lead_id"] == lead["id"]
    assert call["call_date"] == "2026-11-14"
    assert "Original" not in call["notes"]

    call_id = call["id"]

    get_response = client.get(f"/api/v1/calls/{call_id}")
    assert get_response.status_code == 200
    assert get_response.json()["id"] == call_id

    list_response = client.get("/api/v1/calls")
    assert list_response.status_code == 200
    assert list_response.json()["total"] == 1

    lead_calls_response = client.get(
        f"/api/v1/leads/{lead['id']}/calls"
    )
    assert lead_calls_response.status_code == 200
    assert lead_calls_response.json()["total"] == 1


def test_call_search_and_date_filters(client):
    lead = create_test_lead(client)
    create_test_call(client, lead["id"])

    search_response = client.get(
        "/api/v1/calls",
        params={"search": "Test Customer"},
    )

    assert search_response.status_code == 200
    assert search_response.json()["total"] == 1

    date_response = client.get(
        "/api/v1/calls",
        params={
            "date_from": "2026-11-01",
            "date_to": "2026-11-30",
        },
    )

    assert date_response.status_code == 200
    assert date_response.json()["total"] == 1

    invalid_range_response = client.get(
        "/api/v1/calls",
        params={
            "date_from": "2026-11-30",
            "date_to": "2026-11-01",
        },
    )

    assert invalid_range_response.status_code == 422


def test_call_for_missing_lead(client):
    response = client.post(
        "/api/v1/leads/99999/calls",
        json={
            "call_date": "2026-11-14",
            "original_notes": "Customer requested a callback.",
            "notes": "Customer requested a callback.",
            "ai_summary": None,
        },
    )

    assert response.status_code == 404


def test_ai_summarization_endpoint(client, monkeypatch):
    expected_summary = (
        "The customer requested a product demonstration next week."
    )

    ai_router_module = import_module("app.routers.ai_router")

    monkeypatch.setattr(
        ai_router_module,
        "generate_call_summary",
        lambda notes: expected_summary,
    )

    response = client.post(
        "/api/v1/ai/summarize",
        json={
            "notes": "Customer wants product demo next week."
        },
    )

    assert response.status_code == 200
    assert response.json()["success"] is True
    assert response.json()["data"]["summary"] == expected_summary


def test_ai_summarization_rejects_short_notes(client):
    response = client.post(
        "/api/v1/ai/summarize",
        json={"notes": "a"},
    )

    assert response.status_code == 422


def test_missing_call_returns_404(client):
    response = client.get("/api/v1/calls/99999")

    assert response.status_code == 404


def test_call_update_preserves_original_notes(client):
    lead = create_test_lead(client)
    call = create_test_call(client, lead["id"])

    response = client.put(
        f"/api/v1/calls/{call['id']}",
        json={
            "call_date": "2026-11-15",
            "notes": "The customer confirmed the demonstration.",
            "ai_summary": "The demonstration was confirmed.",
        },
    )

    assert response.status_code == 200

    updated = response.json()
    assert updated["call_date"] == "2026-11-15"
    assert updated["notes"] == "The customer confirmed the demonstration."
    assert updated["original_notes"] == call["original_notes"]


def test_call_deletion(client):
    lead = create_test_lead(client)
    call = create_test_call(client, lead["id"])

    response = client.delete(f"/api/v1/calls/{call['id']}")

    assert response.status_code == 200
    assert response.json()["success"] is True

    missing_response = client.get(f"/api/v1/calls/{call['id']}")
    assert missing_response.status_code == 404


def test_deleting_lead_cascades_to_calls(client):
    lead = create_test_lead(client)
    call = create_test_call(client, lead["id"])

    delete_response = client.delete(
        f"/api/v1/leads/{lead['id']}"
    )

    assert delete_response.status_code == 200

    call_response = client.get(f"/api/v1/calls/{call['id']}")
    assert call_response.status_code == 404

    list_response = client.get("/api/v1/calls")
    assert list_response.status_code == 200
    assert list_response.json()["total"] == 0

# ============================================================
# LEAD MANAGEMENT FEATURE TESTS
# ============================================================

def test_lead_creation_with_management_fields(client):
    response = client.post(
        "/api/v1/leads",
        json={
            "lead_name": "Arun Kumar",
            "company": "Enterprise Solutions",
            "contact_number": "+919876543212",
            "status": "Interested",
            "priority": "High",
            "follow_up_date": "2026-11-20",
            "lead_notes": "Interested in an enterprise CRM demonstration.",
        },
    )

    assert response.status_code == 201

    lead = response.json()
    assert lead["status"] == "Interested"
    assert lead["priority"] == "High"
    assert lead["follow_up_date"] == "2026-11-20"
    assert lead["lead_notes"] == "Interested in an enterprise CRM demonstration."


def test_lead_creation_uses_default_management_values(client):
    response = client.post(
        "/api/v1/leads",
        json={
            "lead_name": "Default Customer",
            "company": "Default Technologies",
            "contact_number": "+919876543213",
        },
    )

    assert response.status_code == 201

    lead = response.json()
    assert lead["status"] == "New"
    assert lead["priority"] == "Medium"
    assert lead["follow_up_date"] is None
    assert lead["lead_notes"] is None


def test_lead_management_fields_can_be_updated(client):
    lead = create_test_lead(client)

    response = client.put(
        f"/api/v1/leads/{lead['id']}",
        json={
            "lead_name": "Test Customer",
            "company": "Test Technologies",
            "contact_number": "+919876543210",
            "status": "Contacted",
            "priority": "High",
            "follow_up_date": "2026-11-25",
            "lead_notes": "Follow-up discussion scheduled.",
        },
    )

    assert response.status_code == 200

    updated = response.json()
    assert updated["status"] == "Contacted"
    assert updated["priority"] == "High"
    assert updated["follow_up_date"] == "2026-11-25"
    assert updated["lead_notes"] == "Follow-up discussion scheduled."


def test_lead_status_and_priority_filters(client):
    leads = [
        {
            "lead_name": "New Lead",
            "company": "Alpha Technologies",
            "contact_number": "+919876543214",
            "status": "New",
            "priority": "Low",
        },
        {
            "lead_name": "Interested Lead",
            "company": "Beta Technologies",
            "contact_number": "+919876543215",
            "status": "Interested",
            "priority": "High",
        },
        {
            "lead_name": "Contacted Lead",
            "company": "Gamma Technologies",
            "contact_number": "+919876543216",
            "status": "Contacted",
            "priority": "High",
        },
    ]

    for lead_data in leads:
        response = client.post("/api/v1/leads", json=lead_data)
        assert response.status_code == 201

    status_response = client.get(
        "/api/v1/leads",
        params={"status": "Interested"},
    )

    assert status_response.status_code == 200
    assert status_response.json()["total"] == 1
    assert status_response.json()["data"][0]["lead_name"] == "Interested Lead"

    priority_response = client.get(
        "/api/v1/leads",
        params={"priority": "High"},
    )

    assert priority_response.status_code == 200
    assert priority_response.json()["total"] == 2

    combined_response = client.get(
        "/api/v1/leads",
        params={
            "status": "Contacted",
            "priority": "High",
        },
    )

    assert combined_response.status_code == 200
    assert combined_response.json()["total"] == 1
    assert combined_response.json()["data"][0]["lead_name"] == "Contacted Lead"


def test_lead_follow_up_date_filters(client):
    lead_data = [
        {
            "lead_name": "Earlier Follow Up",
            "company": "Alpha Technologies",
            "contact_number": "+919876543217",
            "follow_up_date": "2026-11-15",
        },
        {
            "lead_name": "Middle Follow Up",
            "company": "Beta Technologies",
            "contact_number": "+919876543218",
            "follow_up_date": "2026-11-20",
        },
        {
            "lead_name": "Later Follow Up",
            "company": "Gamma Technologies",
            "contact_number": "+919876543219",
            "follow_up_date": "2026-11-30",
        },
    ]

    for data in lead_data:
        response = client.post("/api/v1/leads", json=data)
        assert response.status_code == 201

    response = client.get(
        "/api/v1/leads",
        params={
            "follow_up_from": "2026-11-18",
            "follow_up_to": "2026-11-25",
        },
    )

    assert response.status_code == 200
    assert response.json()["total"] == 1
    assert response.json()["data"][0]["lead_name"] == "Middle Follow Up"


def test_invalid_lead_status_and_priority_are_rejected(client):
    invalid_status = client.post(
        "/api/v1/leads",
        json={
            "lead_name": "Invalid Status Customer",
            "company": "Test Technologies",
            "contact_number": "+919876543220",
            "status": "Pending",
        },
    )

    assert invalid_status.status_code == 422

    invalid_priority = client.post(
        "/api/v1/leads",
        json={
            "lead_name": "Invalid Priority Customer",
            "company": "Test Technologies",
            "contact_number": "+919876543221",
            "priority": "Urgent",
        },
    )

    assert invalid_priority.status_code == 422


def test_invalid_follow_up_date_range_is_rejected(client):
    response = client.get(
        "/api/v1/leads",
        params={
            "follow_up_from": "2026-11-25",
            "follow_up_to": "2026-11-15",
        },
    )

    assert response.status_code == 422

def test_dashboard_analytics_summary(client):
    from datetime import date, timedelta

    today = date.today()

    new_lead = client.post(
        "/api/v1/leads",
        json={
            "lead_name": "Dashboard New Lead",
            "company": "Analytics Company",
            "contact_number": "9876543210",
            "status": "New",
            "priority": "High",
            "follow_up_date": today.isoformat(),
            "lead_notes": "Dashboard test",
        },
    )
    assert new_lead.status_code == 201

    converted_lead = client.post(
        "/api/v1/leads",
        json={
            "lead_name": "Dashboard Converted Lead",
            "company": "Conversion Company",
            "contact_number": "9876543211",
            "status": "Converted",
            "priority": "Medium",
            "follow_up_date": (today + timedelta(days=3)).isoformat(),
            "lead_notes": "Converted dashboard test",
        },
    )
    assert converted_lead.status_code == 201

    response = client.get("/api/v1/dashboard/summary")

    assert response.status_code == 200
    data = response.json()

    assert data["total_leads"] == 2
    assert data["lead_status_counts"]["New"] == 1
    assert data["lead_status_counts"]["Converted"] == 1
    assert data["lead_status_counts"]["Contacted"] == 0
    assert data["priority_counts"]["High"] == 1
    assert data["priority_counts"]["Medium"] == 1
    assert data["priority_counts"]["Low"] == 0
    assert data["conversion_rate"] == 50.0
    assert data["follow_up_counts"]["due_today"] == 1
    assert data["follow_up_counts"]["upcoming"] == 1
    assert data["follow_up_counts"]["overdue"] == 0
    assert data["follow_up_counts"]["no_follow_up"] == 0
    assert len(data["recent_leads"]) == 2


def test_dashboard_analytics_empty_database(client):
    response = client.get("/api/v1/dashboard/summary")

    assert response.status_code == 200
    data = response.json()

    assert data["total_leads"] == 0
    assert data["calls_recorded"] == 0
    assert data["conversion_rate"] == 0
    assert data["lead_status_counts"]["New"] == 0
    assert data["priority_counts"]["High"] == 0
    assert data["follow_up_counts"]["overdue"] == 0
    assert data["follow_up_counts"]["no_follow_up"] == 0
    assert data["recent_leads"] == []
    assert data["latest_activity"] is None

