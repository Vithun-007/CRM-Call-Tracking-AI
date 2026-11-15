import { useEffect, useState, type FormEvent } from "react";
import { AxiosError } from "axios";
import {
  Users,
  PhoneCall,
  CalendarDays,
  Sparkles,
  LoaderCircle,
  Save,
  RefreshCw,
  CheckCircle2,
  Target,
  ListChecks,
  Lightbulb,
  ClipboardList,
  Heart,
} from "lucide-react";
import { getAllLeads } from "../services/leadService";
import { createCall } from "../services/callService";
import { analyzeCallIntelligence } from "../services/aiService";
import type { Lead } from "../types/lead";
import type { AICallIntelligenceData } from "../types/ai";

function getToday(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const detail = error.response?.data?.detail;

    if (typeof detail === "string") return detail;

    if (Array.isArray(detail)) {
      return detail
        .map((item: { msg?: string }) => item.msg)
        .filter(Boolean)
        .join(" ");
    }

    if (error.message === "Network Error") {
      return "Cannot connect to the backend. Check that the FastAPI server is running.";
    }

    return error.message || "The request could not be completed.";
  }

  return error instanceof Error
    ? error.message
    : "An unexpected error occurred.";
}

function InsightList({
  items,
  emptyMessage,
}: {
  items: string[];
  emptyMessage: string;
}) {
  if (items.length === 0) {
    return <p className="agent-insight-empty">{emptyMessage}</p>;
  }

  return (
    <ul className="agent-insight-list">
      {items.map((item, index) => (
        <li key={`${index}-${item}`}>{item}</li>
      ))}
    </ul>
  );
}

export default function CallTrackingPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [callDate, setCallDate] = useState(getToday());
  const [originalNotes, setOriginalNotes] = useState("");
  const [notes, setNotes] = useState("");
  const [summary, setSummary] = useState("");
  const [agentInsights, setAgentInsights] =
    useState<AICallIntelligenceData | null>(null);
  const [summaryApplied, setSummaryApplied] = useState(false);

  const [loadingLeads, setLoadingLeads] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const selectedLead = leads.find(
    (lead) => String(lead.id) === selectedLeadId
  );

  const loadLeads = async () => {
    await Promise.resolve();
    setLoadingLeads(true);
    setError("");

    try {
      const response = await getAllLeads("", 0, 100);
      setLeads(response.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoadingLeads(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadLeads();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const handleLeadChange = (value: string) => {
    setSelectedLeadId(value);
    setSuccess("");
  };

  const handleNotesChange = (value: string) => {
    setNotes(value);

    if (!summaryApplied) {
      setOriginalNotes(value);
    }

    setSuccess("");
  };

  const handleGenerateSummary = async () => {
    const sourceNotes = originalNotes.trim();

    if (sourceNotes.length < 3) {
      setError("Enter meaningful call notes before requesting AI analysis.");
      return;
    }

    setGenerating(true);
    setError("");
    setSuccess("");
    setSummary("");
    setAgentInsights(null);

    try {
      const result = await analyzeCallIntelligence(sourceNotes);

      setSummary(result.summary);
      setAgentInsights(result);
      setSummaryApplied(false);
      setSuccess("AI call analysis completed successfully.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setGenerating(false);
    }
  };

  const handleUseSummary = () => {
    if (!summary) return;

    setNotes(summary);
    setSummaryApplied(true);
    setError("");
    setSuccess("AI summary has been applied to the Notes field.");
  };

  const resetForm = () => {
    setSelectedLeadId("");
    setCallDate(getToday());
    setOriginalNotes("");
    setNotes("");
    setSummary("");
    setAgentInsights(null);
    setSummaryApplied(false);
    setError("");
    setSuccess("");
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!selectedLeadId) {
      setError("Please select a lead.");
      return;
    }

    if (!callDate) {
      setError("Please select the call date.");
      return;
    }

    if (notes.trim().length < 1) {
      setError("Please enter call notes before saving.");
      return;
    }

    if (originalNotes.trim().length < 1) {
      setError("Original call notes are required.");
      return;
    }

    setSaving(true);

    try {
      await createCall(Number(selectedLeadId), {
        call_date: callDate,
        original_notes: originalNotes.trim(),
        notes: notes.trim(),
        ai_summary: summary.trim() || null,
      });

      setSuccess("Call interaction saved successfully.");
      setSelectedLeadId("");
      setCallDate(getToday());
      setOriginalNotes("");
      setNotes("");
      setSummary("");
      setAgentInsights(null);
      setSummaryApplied(false);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">INTERACTION MANAGEMENT</div>
          <h2>Call Tracking</h2>
          <p>
            Record customer conversations and generate professional summaries.
          </p>
        </div>
      </div>

      <form
        className="content-card page-card call-tracking-card"
        onSubmit={handleSave}
      >
        <div className="card-heading">
          <div>
            <h3>New call interaction</h3>
            <p>Enter the lead details and document your conversation.</p>
          </div>
          <span className="draft-label">NEW INTERACTION</span>
        </div>

        {error && <div className="form-alert error-alert">{error}</div>}
        {success && <div className="form-alert success-alert">{success}</div>}

        <div className="form-section">
          <div className="form-section-title">
            <Users size={18} />
            <h4>Lead information</h4>
          </div>

          <div className="form-grid">
            <label className="field">
              Lead name *
              <select
                value={selectedLeadId}
                onChange={(event) => handleLeadChange(event.target.value)}
                required
                disabled={loadingLeads}
              >
                <option value="">
                  {loadingLeads ? "Loading leads..." : "Select a lead"}
                </option>
                {leads.map((lead) => (
                  <option key={lead.id} value={lead.id}>
                    {lead.lead_name}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              Company
              <input
                value={selectedLead?.company ?? ""}
                placeholder="Automatically populated"
                readOnly
              />
            </label>

            <label className="field">
              Contact number
              <input
                value={selectedLead?.contact_number ?? ""}
                placeholder="Automatically populated"
                readOnly
              />
            </label>

            <label className="field">
              Call date *
              <div className="input-icon">
                <CalendarDays size={17} />
                <input
                  type="date"
                  value={callDate}
                  onChange={(event) => setCallDate(event.target.value)}
                  required
                />
              </div>
            </label>
          </div>

          {!loadingLeads && leads.length === 0 && (
            <p className="field-hint">
              No leads are available. Create a lead in Lead Management first.
            </p>
          )}
        </div>

        <div className="form-section">
          <div className="form-section-title">
            <PhoneCall size={18} />
            <h4>Call notes</h4>
          </div>

          <label className="field">
            Notes *
            <textarea
              rows={5}
              value={notes}
              onChange={(event) => handleNotesChange(event.target.value)}
              placeholder="Enter shorthand notes from your conversation..."
              maxLength={5000}
              required
            />
          </label>

          <p className="field-hint">
            {summaryApplied
              ? "The AI summary has been applied. Your original shorthand notes are preserved separately."
              : "Capture the customer's requirements, interests and follow-up actions."}
            {" "}
            {notes.length}/5000 characters
          </p>

          <div className="ai-summary-panel">
            <div className="ai-summary-heading">
              <div className="ai-summary-icon">
                <Sparkles size={19} />
              </div>
              <div>
                <h4>AI-generated summary</h4>
                <p>
                  Generate a professional summary and structured insights from
                  your original notes.
                </p>
              </div>
              <span className="ai-powered-label">AI AGENT</span>
            </div>

            <div
              className={`summary-placeholder ${
                summary ? "summary-result" : ""
              }`}
            >
              {generating
                ? "The AI agent is analyzing the conversation and preparing your summary..."
                : summary ||
                  "Your generated summary will appear here after you enter call notes and request AI analysis."}
            </div>

            <div className="summary-actions">
              <button
                type="button"
                className="primary-button"
                onClick={handleGenerateSummary}
                disabled={generating || originalNotes.trim().length < 3}
              >
                {generating ? (
                  <>
                    <LoaderCircle size={16} className="spin-icon" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    Analyze with AI Agent
                  </>
                )}
              </button>

              <button
                type="button"
                className="secondary-button"
                onClick={handleUseSummary}
                disabled={!summary || summaryApplied || generating}
              >
                <CheckCircle2 size={15} />
                Use Summary
              </button>
            </div>
          </div>

          {agentInsights && (
            <div className="agent-insights-panel">
              <div className="agent-insights-heading">
                <div className="agent-insights-title">
                  <Sparkles size={18} />
                  <div>
                    <h4>Call Intelligence</h4>
                    <p>
                      Structured insights extracted from the conversation.
                    </p>
                  </div>
                </div>
                <span className="ai-powered-label">AGENT ANALYSIS</span>
              </div>

              <div className="agent-insights-grid">
                <section className="agent-insight-item">
                  <div className="agent-insight-label">
                    <Target size={16} />
                    <h5>Customer intent</h5>
                  </div>
                  <p>
                    {agentInsights.customer_intent ||
                      "No specific customer intent identified."}
                  </p>
                </section>

                <section className="agent-insight-item">
                  <div className="agent-insight-label">
                    <ListChecks size={16} />
                    <h5>Requirements</h5>
                  </div>
                  <InsightList
                    items={agentInsights.requirements}
                    emptyMessage="No specific requirements identified."
                  />
                </section>

                <section className="agent-insight-item">
                  <div className="agent-insight-label">
                    <Heart size={16} />
                    <h5>Customer interests</h5>
                  </div>
                  <InsightList
                    items={agentInsights.customer_interests}
                    emptyMessage="No specific interests identified."
                  />
                </section>

                <section className="agent-insight-item">
                  <div className="agent-insight-label">
                    <ClipboardList size={16} />
                    <h5>Action items</h5>
                  </div>
                  <InsightList
                    items={agentInsights.action_items}
                    emptyMessage="No action items identified in the notes."
                  />
                </section>

                <section className="agent-insight-item agent-follow-up">
                  <div className="agent-insight-label">
                    <Lightbulb size={16} />
                    <h5>Suggested follow-up</h5>
                  </div>
                  <p>
                    {agentInsights.follow_up_recommendation ||
                      "No follow-up recommendation available."}
                  </p>
                </section>
              </div>
            </div>
          )}
        </div>

        <div className="form-footer">
          <span>
            {selectedLead
              ? `Recording interaction for ${selectedLead.lead_name}`
              : "Select a lead to begin."}
          </span>

          <div className="form-footer-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={resetForm}
              disabled={saving || generating}
            >
              <RefreshCw size={15} />
              Reset
            </button>

            <button
              type="submit"
              className="primary-button"
              disabled={saving || loadingLeads || leads.length === 0}
            >
              {saving ? (
                <>
                  <LoaderCircle size={16} className="spin-icon" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save Interaction
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </>
  );
}
