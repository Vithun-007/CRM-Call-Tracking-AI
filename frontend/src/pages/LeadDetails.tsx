import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Clock3,
  Flag,
  LoaderCircle,
  Pencil,
  Phone,
  PhoneCall,
  RefreshCw,
  Sparkles,
  UserRound,
  FileText,
} from "lucide-react";

import { leadService } from "../services/leadService";
import { getCallsForLead } from "../services/callService";
import type { Lead } from "../types/lead";
import type { CallInteraction } from "../types/call";

interface LeadDetailsProps {
  leadId: number;
  onBack: () => void;
  onEdit: (lead: Lead) => void;
}

function formatDate(value: string | null): string {
  if (!value) return "Not scheduled";

  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
}

export default function LeadDetails({
  leadId,
  onBack,
  onEdit,
}: LeadDetailsProps) {
  const [lead, setLead] = useState<Lead | null>(null);
  const [calls, setCalls] = useState<CallInteraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDetails = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [leadData, callResponse] = await Promise.all([
        leadService.getLeadById(leadId),
        getCallsForLead(leadId, 0, 100),
      ]);

      setLead(leadData);
      setCalls(callResponse.data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to load customer details.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadDetails();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadDetails]);

  if (loading) {
    return (
      <div className="lead-details-loading">
        <LoaderCircle size={26} className="spin" />
        <span>Loading customer profile...</span>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="lead-details-page">
        <button type="button" className="lead-details-back" onClick={onBack}>
          <ArrowLeft size={16} /> Back to leads
        </button>
        <div className="feedback error-feedback">
          {error || "This lead could not be found."}
        </div>
        <button
          type="button"
          className="primary-button"
          onClick={() => void loadDetails()}
        >
          <RefreshCw size={15} /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="lead-details-page">
      <button type="button" className="lead-details-back" onClick={onBack}>
        <ArrowLeft size={16} /> Back to leads
      </button>

      <div className="lead-details-heading">
        <div>
          <div className="eyebrow">CUSTOMER 360?</div>
          <h2>{lead.lead_name}</h2>
          <p>Customer profile and interaction history</p>
        </div>
        <button
          type="button"
          className="primary-button"
          onClick={() => onEdit(lead)}
        >
          <Pencil size={15} /> Edit lead
        </button>
      </div>

      <section className="content-card customer-profile-card">
        <div className="customer-profile-identity">
          <div className="customer-profile-avatar">
            {lead.lead_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3>{lead.lead_name}</h3>
            <span>Lead #{lead.id}</span>
          </div>
        </div>

        <div className="customer-profile-badges">
          <span className={`lead-status-badge status-${lead.status.toLowerCase()}`}>
            {lead.status}
          </span>
          <span className={`lead-priority-badge priority-${lead.priority.toLowerCase()}`}>
            <Flag size={12} /> {lead.priority} priority
          </span>
        </div>

        <div className="customer-profile-grid">
          <div className="customer-profile-field">
            <Building2 size={17} />
            <div>
              <span>Company</span>
              <strong>{lead.company}</strong>
            </div>
          </div>
          <div className="customer-profile-field">
            <Phone size={17} />
            <div>
              <span>Contact number</span>
              <strong>{lead.contact_number}</strong>
            </div>
          </div>
          <div className="customer-profile-field">
            <CalendarDays size={17} />
            <div>
              <span>Follow-up date</span>
              <strong>{formatDate(lead.follow_up_date)}</strong>
            </div>
          </div>
          <div className="customer-profile-field">
            <Clock3 size={17} />
            <div>
              <span>Lead created</span>
              <strong>{formatDate(lead.created_at)}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="content-card customer-notes-card">
        <div className="card-heading">
          <div>
            <h3>Customer notes</h3>
            <p>Requirements and other information saved for this lead</p>
          </div>
          <FileText size={19} />
        </div>
        {lead.lead_notes?.trim() ? (
          <p className="customer-notes-content">{lead.lead_notes}</p>
        ) : (
          <div className="customer-notes-empty">
            No customer notes have been added yet.
          </div>
        )}
      </section>

      <section className="content-card customer-timeline-card">
        <div className="card-heading">
          <div>
            <h3>Call interaction timeline</h3>
            <p>
              {calls.length} recorded interaction{calls.length !== 1 ? "s" : ""}
              {" ? "}Most recent first
            </p>
          </div>
          <button
            type="button"
            className="lead-details-refresh"
            onClick={() => void loadDetails()}
            title="Refresh customer history"
            aria-label="Refresh customer history"
          >
            <RefreshCw size={16} />
          </button>
        </div>

        {calls.length === 0 ? (
          <div className="customer-timeline-empty">
            <div className="customer-timeline-empty-icon">
              <PhoneCall size={24} />
            </div>
            <strong>No calls recorded yet</strong>
            <span>
              Customer interactions recorded through Call Tracking will
              appear here.
            </span>
          </div>
        ) : (
          <div className="customer-timeline">
            {calls.map((call) => (
              <article className="customer-timeline-item" key={call.id}>
                <div className="customer-timeline-marker">
                  <PhoneCall size={15} />
                </div>
                <div className="customer-call-card">
                  <div className="customer-call-heading">
                    <div>
                      <strong>Call interaction #{call.id}</strong>
                      <span>
                        <CalendarDays size={13} />
                        {formatDate(call.call_date)}
                      </span>
                    </div>
                    <small>{formatDateTime(call.created_at)}</small>
                  </div>

                  <div className="customer-call-section">
                    <h4>Original call notes</h4>
                    <p>{call.original_notes}</p>
                  </div>

                  <div className="customer-call-section">
                    <h4>Approved notes</h4>
                    <p>{call.notes}</p>
                  </div>

                  {call.ai_summary && (
                    <div className="customer-ai-summary">
                      <h4><Sparkles size={14} /> AI summary</h4>
                      <p>{call.ai_summary}</p>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <div className="customer-profile-footer">
        <UserRound size={15} />
        Customer record updated {formatDateTime(lead.updated_at)}
      </div>
    </div>
  );
}
