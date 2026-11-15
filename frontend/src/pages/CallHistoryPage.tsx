import { useCallback, useEffect, useState } from "react";
import { AxiosError } from "axios";
import {
  History,
  Search,
  RefreshCw,
  Trash2,
  CalendarDays,
  Building2,
  PhoneCall,
  LoaderCircle,
  FileText,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  Filter,
  Sparkles,
} from "lucide-react";

import {
  getAllCalls,
  deleteCall,
} from "../services/callService";

import { getAllLeads } from "../services/leadService";

import type { CallInteraction } from "../types/call";
import type { Lead } from "../types/lead";

const PAGE_SIZE = 10;

function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const detail = error.response?.data?.detail;

    if (typeof detail === "string") return detail;

    if (error.message === "Network Error") {
      return "Cannot connect to the backend. Check that the FastAPI server is running.";
    }

    return error.message || "The request could not be completed.";
  }

  return error instanceof Error
    ? error.message
    : "An unexpected error occurred.";
}

function formatDate(value: string): string {
  const date = new Date(`${value}T00:00:00`);

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="history-detail-row">
      <span>{label}</span>
      <div>{children}</div>
    </div>
  );
}

export default function CallHistoryPage() {
  const [calls, setCalls] = useState<CallInteraction[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);

  const [search, setSearch] = useState("");
  const [selectedLead, setSelectedLead] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [selectedCall, setSelectedCall] =
    useState<CallInteraction | null>(null);

  const [leadLoadError, setLeadLoadError] = useState("");

  const loadHistory = useCallback(async () => {
    await Promise.resolve();
    setLoading(true);
    setError("");

    try {
      const response = await getAllCalls(
        (page - 1) * PAGE_SIZE,
        PAGE_SIZE,
        {
          search,
          lead_id: selectedLead ? Number(selectedLead) : undefined,
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,
        }
      );

      setCalls(response.data);
      setTotal(response.total);
    } catch (err) {
      setError(getErrorMessage(err));
      setCalls([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, search, selectedLead, dateFrom, dateTo]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadHistory();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadHistory]);

  useEffect(() => {
    let active = true;

    const loadLeads = async () => {
      try {
        const response = await getAllLeads("", 0, 100);

        if (active) {
          setLeads(response.data);
          setLeadLoadError("");
        }
      } catch (err) {
        if (active) {
          setLeadLoadError(getErrorMessage(err));
        }
      }
    };

    void loadLeads();

    return () => {
      active = false;
    };
  }, []);

  const leadById = new Map(
    leads.map((lead) => [lead.id, lead])
  );

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const clearFilters = () => {
    setSearch("");
    setSelectedLead("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
    setMessage("");
  };

  const handleDelete = async (callId: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this call interaction? This action cannot be undone."
    );

    if (!confirmed) return;

    setDeletingId(callId);
    setError("");
    setMessage("");

    try {
      await deleteCall(callId);

      if (selectedCall?.id === callId) {
        setSelectedCall(null);
      }

      setMessage("Call interaction deleted successfully.");

      const updatedTotal = Math.max(0, total - 1);
      const updatedTotalPages = Math.max(
        1,
        Math.ceil(updatedTotal / PAGE_SIZE)
      );

      if (page > updatedTotalPages) {
        setPage(updatedTotalPages);
      } else {
        await loadHistory();
      }

      setTotal(updatedTotal);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">ACTIVITY RECORDS</div>
          <h2>Call History</h2>
          <p>
            Search, filter and review saved customer interactions.
          </p>
        </div>
      </div>

      <div className="content-card page-card history-page-card">
        <div className="toolbar">
          <div>
            <h3>Interaction history</h3>
            <p>
              {total} saved interaction{total === 1 ? "" : "s"}
            </p>
          </div>

          <button
            className="icon-button"
            onClick={() => void loadHistory()}
            disabled={loading}
            aria-label="Refresh call history"
            title="Refresh"
          >
            <RefreshCw size={17} />
          </button>
        </div>

        <div className="history-filter-panel">
          <div className="history-filter-heading">
            <Filter size={16} />
            <strong>Filter interactions</strong>
          </div>

          <div className="history-filter-grid">
            <label className="field history-search-field">
              Search
              <div className="search-box history-full-search">
                <Search size={16} />
                <input
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Search lead, company, phone or notes..."
                />
              </div>
            </label>

            <label className="field">
              Lead
              <select
                value={selectedLead}
                onChange={(event) => {
                  setSelectedLead(event.target.value);
                  setPage(1);
                }}
              >
                <option value="">All leads</option>
                {leads.map((lead) => (
                  <option key={lead.id} value={lead.id}>
                    {lead.lead_name} — {lead.company}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              From date
              <input
                type="date"
                value={dateFrom}
                max={dateTo || undefined}
                onChange={(event) => {
                  setDateFrom(event.target.value);
                  setPage(1);
                }}
              />
            </label>

            <label className="field">
              To date
              <input
                type="date"
                value={dateTo}
                min={dateFrom || undefined}
                onChange={(event) => {
                  setDateTo(event.target.value);
                  setPage(1);
                }}
              />
            </label>

            <div className="history-clear-wrapper">
              <button
                type="button"
                className="secondary-button"
                onClick={clearFilters}
              >
                <X size={15} />
                Clear filters
              </button>
            </div>
          </div>

          {leadLoadError && (
            <p className="field-hint">{leadLoadError}</p>
          )}
        </div>

        {error && (
          <div className="form-alert error-alert">{error}</div>
        )}

        {message && (
          <div className="form-alert success-alert">{message}</div>
        )}

        {loading ? (
          <div className="history-loading">
            <LoaderCircle size={24} className="spin-icon" />
            <span>Loading call history...</span>
          </div>
        ) : calls.length === 0 ? (
          <div className="table-placeholder">
            <div className="empty-icon">
              <History size={27} />
            </div>
            <h3>
              {total === 0
                ? "No interactions found"
                : "No interactions on this page"}
            </h3>
            <p>
              {total === 0
                ? "Try changing your search or filters, or record a new call."
                : "Move to another page to see more interactions."}
            </p>
          </div>
        ) : (
          <div className="history-list">
            {calls.map((call) => {
              const lead = leadById.get(call.lead_id);

              return (
                <article className="history-card" key={call.id}>
                  <div className="history-card-top">
                    <div className="history-lead">
                      <div className="history-avatar">
                        {(lead?.lead_name || "L")
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div>
                        <h3>
                          {lead?.lead_name ?? `Lead #${call.lead_id}`}
                        </h3>
                        <p>
                          <Building2 size={13} />
                          {lead?.company ?? "Company unavailable"}
                        </p>
                      </div>
                    </div>

                    <div className="history-card-actions">
                      <span className="history-date">
                        <CalendarDays size={14} />
                        {formatDate(call.call_date)}
                      </span>

                      <button
                        className="icon-button"
                        onClick={() => setSelectedCall(call)}
                        aria-label={`View interaction ${call.id}`}
                        title="View details"
                      >
                        <Eye size={16} />
                      </button>

                      <button
                        className="icon-button delete-action"
                        onClick={() => void handleDelete(call.id)}
                        disabled={deletingId === call.id}
                        aria-label={`Delete call ${call.id}`}
                        title="Delete interaction"
                      >
                        {deletingId === call.id ? (
                          <LoaderCircle
                            size={16}
                            className="spin-icon"
                          />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="history-contact">
                    <PhoneCall size={14} />
                    {lead?.contact_number ?? "Contact unavailable"}
                    <span>Interaction #{call.id}</span>
                  </div>

                  <div className="history-notes-grid">
                    <div className="history-note-block">
                      <h4>
                        <FileText size={15} />
                        Original notes
                      </h4>
                      <p>{call.original_notes}</p>
                    </div>

                    <div className="history-note-block final-note-block">
                      <h4>
                        <FileText size={15} />
                        Final notes
                      </h4>
                      <p>{call.notes}</p>
                    </div>
                  </div>

                  {call.ai_summary && (
                    <div className="history-summary">
                      <h4>
                        <Sparkles size={14} />
                        AI-generated summary
                      </h4>
                      <p>{call.ai_summary}</p>
                    </div>
                  )}

                  <div className="history-card-footer">
                    <span>Interaction #{call.id}</span>
                    <button
                      type="button"
                      className="history-view-button"
                      onClick={() => setSelectedCall(call)}
                    >
                      View full details
                      <ChevronRight size={15} />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {!loading && total > 0 && (
          <div className="history-pagination">
            <span>
              Showing {((page - 1) * PAGE_SIZE) + 1}–
              {Math.min(page * PAGE_SIZE, total)} of {total} interactions
            </span>

            <div className="history-pagination-actions">
              <button
                type="button"
                className="secondary-button"
                disabled={page <= 1 || loading}
                onClick={() => setPage((current) => current - 1)}
              >
                <ChevronLeft size={16} />
                Previous
              </button>

              <span className="history-page-number">
                Page {page} of {totalPages}
              </span>

              <button
                type="button"
                className="secondary-button"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((current) => current + 1)}
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedCall && (
        <div
          className="history-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedCall(null);
            }
          }}
        >
          <section
            className="history-detail-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="history-detail-title"
          >
            <div className="history-modal-header">
              <div>
                <div className="eyebrow">INTERACTION DETAILS</div>
                <h2 id="history-detail-title">
                  Interaction #{selectedCall.id}
                </h2>
              </div>

              <button
                type="button"
                className="icon-button"
                onClick={() => setSelectedCall(null)}
                aria-label="Close details"
              >
                <X size={19} />
              </button>
            </div>

            <div className="history-detail-content">
              <div className="history-detail-identity">
                <div className="history-avatar">
                  {(leadById.get(selectedCall.lead_id)?.lead_name || "L")
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div>
                  <h3>
                    {leadById.get(selectedCall.lead_id)?.lead_name ??
                      `Lead #${selectedCall.lead_id}`}
                  </h3>
                  <p>
                    {leadById.get(selectedCall.lead_id)?.company ??
                      "Company unavailable"}
                  </p>
                </div>
              </div>

              <div className="history-detail-grid">
                <DetailRow label="Contact number">
                  {leadById.get(selectedCall.lead_id)?.contact_number ??
                    "Unavailable"}
                </DetailRow>

                <DetailRow label="Call date">
                  {formatDate(selectedCall.call_date)}
                </DetailRow>

                <DetailRow label="Lead ID">
                  {selectedCall.lead_id}
                </DetailRow>

                <DetailRow label="Interaction ID">
                  {selectedCall.id}
                </DetailRow>

                <DetailRow label="Created at">
                  {new Date(selectedCall.created_at).toLocaleString("en-IN")}
                </DetailRow>

                <DetailRow label="Last updated">
                  {new Date(selectedCall.updated_at).toLocaleString("en-IN")}
                </DetailRow>
              </div>

              <div className="history-detail-section">
                <h4>
                  <FileText size={16} />
                  Original shorthand notes
                </h4>
                <p>{selectedCall.original_notes}</p>
              </div>

              <div className="history-detail-section">
                <h4>
                  <FileText size={16} />
                  Final notes
                </h4>
                <p>{selectedCall.notes}</p>
              </div>

              <div className="history-detail-section history-detail-ai">
                <h4>
                  <Sparkles size={16} />
                  AI-generated summary
                </h4>
                <p>
                  {selectedCall.ai_summary ||
                    "No AI-generated summary was saved for this interaction."}
                </p>
              </div>
            </div>

            <div className="history-modal-footer">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setSelectedCall(null)}
              >
                Close
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

