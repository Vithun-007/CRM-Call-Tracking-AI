import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Users,
  PhoneCall,
  History,
  Bell,
  Plus,
  ArrowUpRight,
  Sparkles,
  ChevronDown,
  Menu,
  X,
  BriefcaseBusiness,
  Clock3,
  Activity,
  LoaderCircle,
  RefreshCw,
  CalendarDays,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";

import LeadsPage from "./pages/LeadsPage";
import CallTrackingPage from "./pages/CallTrackingPage";
import CallHistoryPage from "./pages/CallHistoryPage";
import type { FollowUpFilter } from "./types/lead";

import {
  getDashboardSummary,
  type DashboardSummary,
} from "./services/dashboardService";

type Page = "Dashboard" | "Leads" | "Call Tracking" | "Call History";

const navigation = [
  { name: "Dashboard" as Page, icon: LayoutDashboard },
  { name: "Leads" as Page, icon: Users },
  { name: "Call Tracking" as Page, icon: PhoneCall },
  { name: "Call History" as Page, icon: History },
];

function Sidebar({
  activePage,
  setActivePage,
  mobileOpen,
  setMobileOpen,
}: {
  activePage: Page;
  setActivePage: (page: Page) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}) {
  return (
    <>
      {mobileOpen && (
        <div
          className="mobile-overlay"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-icon">
            <BriefcaseBusiness size={21} />
          </div>
          <div>
            <h1>CRM</h1>
            <span>Lead Management</span>
          </div>
          <button
            className="mobile-close"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        </div>

        <div className="nav-label">WORKSPACE</div>

        <nav className="navigation">
          {navigation.map(({ name, icon: Icon }) => (
            <button
              key={name}
              className={`nav-item ${
                activePage === name ? "nav-active" : ""
              }`}
              onClick={() => {
                setActivePage(name);
                setMobileOpen(false);
              }}
            >
              <Icon size={19} strokeWidth={1.8} />
              <span>{name}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
<div className="profile">
            <div className="avatar">U</div>
            <div className="profile-info">
              <strong>CRM User</strong>
              <span>Workspace member</span>
            </div>
            <ChevronDown size={16} />
          </div>
        </div>
      </aside>
    </>
  );
}

function PageHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    </div>
  );
}

function formatActivityDate(value: string | null): string {
  if (!value) return "No activity yet";

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function Dashboard({
  onNavigate,
  onNavigateToFollowUp,
}: {
  onNavigate: (page: Page) => void;
  onNavigateToFollowUp: (filter: FollowUpFilter | "") => void;
}) {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getDashboardSummary();
      setSummary(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to load dashboard data.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadDashboard();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const statusOrder = ["New", "Contacted", "Interested", "Converted", "Lost"];
  const priorityOrder = ["High", "Medium", "Low"];

  const statusColors: Record<string, string> = {
    New: "#6488bb",
    Contacted: "#8b78bd",
    Interested: "#d39a43",
    Converted: "#299a70",
    Lost: "#c66b72",
  };

  const priorityColors: Record<string, string> = {
    High: "#c66b72",
    Medium: "#d39a43",
    Low: "#299a70",
  };

  const totalLeads = summary?.total_leads ?? 0;

  const stats = [
    {
      label: "Total Leads",
      value: summary?.total_leads,
      icon: Users,
      color: "blue",
      note: "All registered customer leads",
    },
    {
      label: "Calls Recorded",
      value: summary?.calls_recorded,
      icon: PhoneCall,
      color: "purple",
      note: "Saved call interactions",
    },
    {
      label: "Leads Contacted",
      value: summary?.interactions,
      icon: Activity,
      color: "green",
      note: "Unique leads with recorded calls",
    },
    {
      label: "Not Yet Contacted",
      value: summary
        ? Math.max(totalLeads - summary.interactions, 0)
        : undefined,
      icon: Users,
      color: "blue",
      note: "Leads without recorded calls",
    },
    {
      label: "Conversion Rate",
      value: summary ? `${summary.conversion_rate.toFixed(1)}%` : undefined,
      icon: TrendingUp,
      color: "orange",
      note: "Converted leads / total leads",
    },
  ];

  const followUps = [
    {
      label: "Overdue",
      value: summary?.follow_up_counts.overdue,
      note: "Past scheduled date",
      icon: AlertTriangle,
      color: "overdue",
    },
    {
      label: "Due today",
      value: summary?.follow_up_counts.due_today,
      note: "Needs attention today",
      icon: CalendarDays,
      color: "today",
    },
    {
      label: "Upcoming",
      value: summary?.follow_up_counts.upcoming,
      note: "Next 7 days",
      icon: CheckCircle2,
      color: "upcoming",
    },
    {
      label: "No follow-up",
      value: summary?.follow_up_counts.no_follow_up,
      note: "Needs scheduling",
      icon: CalendarDays,
      color: "none",
    },
  ];

  return (
    <>
      <PageHeading
        eyebrow="BUSINESS OVERVIEW"
        title="Dashboard"
        description="Monitor your sales pipeline, customer interactions and follow-up priorities."
      />

      <div className="welcome-panel">
        <div>
          <h3>Build better customer relationships.</h3>
          <button
            type="button"
            className="dashboard-primary-action"
            onClick={() => onNavigate("Leads")}
          >
            Manage your leads <ArrowUpRight size={16} />
          </button>
        </div>
        <div className="welcome-art">
          <div className="art-circle">
            <PhoneCall size={39} />
          </div>
          <Sparkles className="art-sparkle" size={24} />
        </div>
      </div>

      <div className="section-heading dashboard-section-heading">
        <div>
          <h3>Performance overview</h3>
          <p>Live metrics from your CRM database</p>
        </div>

        <div className="dashboard-status-area">
          <span className="data-status">
            <span className={`status-dot ${error ? "status-error" : ""}`} />
            {error ? "Connection issue" : "Live database data"}
          </span>
          <button
            type="button"
            className="dashboard-refresh"
            onClick={() => void loadDashboard()}
            disabled={loading}
            title="Refresh dashboard"
            aria-label="Refresh dashboard"
          >
            {loading ? (
              <LoaderCircle size={16} className="spin-icon" />
            ) : (
              <RefreshCw size={16} />
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="form-alert error-alert">
          Unable to retrieve dashboard statistics: {error}
          <button type="button" onClick={() => void loadDashboard()}>
            Retry
          </button>
        </div>
      )}

      <div className="stats-grid dashboard-kpi-grid">
        {stats.map(({ label, value, icon: Icon, color, note }) => (
          <div className="stat-card" key={label}>
            <div className="stat-top">
              <span>{label}</span>
              <div className={`stat-icon ${color}`}>
                <Icon size={19} />
              </div>
            </div>
            <div className="stat-value dashboard-stat-value">
              {loading ? (
                <LoaderCircle size={21} className="spin-icon" />
              ) : (
                value ?? "?"
              )}
            </div>
            <div className="stat-note">{note}</div>
          </div>
        ))}
      </div>

      <div className="dashboard-analytics-grid">
        <section className="content-card dashboard-analytics-card">
          <div className="card-heading">
            <div>
              <h3>Lead pipeline</h3>
              <p>How your leads are progressing</p>
            </div>
            <span className="dashboard-total-pill">
              {loading ? "?" : `${totalLeads} total`}
            </span>
          </div>

          {loading ? (
            <div className="dashboard-loading">
              <LoaderCircle size={20} className="spin-icon" />
              Loading pipeline?
            </div>
          ) : (
            <div className="pipeline-list">
              {statusOrder.map((status) => {
                const count = summary?.lead_status_counts[status] ?? 0;
                const percentage = totalLeads
                  ? (count / totalLeads) * 100
                  : 0;

                return (
                  <div className="pipeline-row" key={status}>
                    <div className="pipeline-label">
                      <span className="pipeline-name">
                        <span
                          className="pipeline-dot"
                          style={{ backgroundColor: statusColors[status] }}
                        />
                        {status}
                      </span>
                      <strong>{count}</strong>
                    </div>
                    <div className="pipeline-track">
                      <div
                        className="pipeline-fill"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: statusColors[status],
                        }}
                      />
                    </div>
                    <span className="pipeline-percentage">
                      {percentage.toFixed(1)}%
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="content-card dashboard-analytics-card">
          <div className="card-heading">
            <div>
              <h3>Lead priority</h3>
              <p>Distribution by business priority</p>
            </div>
          </div>

          {loading ? (
            <div className="dashboard-loading">
              <LoaderCircle size={20} className="spin-icon" />
              Loading priorities?
            </div>
          ) : (
            <>
              <div className="priority-total">
                <strong>{totalLeads}</strong>
                <span>Leads in workspace</span>
              </div>
              <div className="priority-stack">
                {priorityOrder.map((priority) => {
                  const count = summary?.priority_counts[priority] ?? 0;
                  const percentage = totalLeads
                    ? (count / totalLeads) * 100
                    : 0;

                  return (
                    <div
                      key={priority}
                      className="priority-stack-segment"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: priorityColors[priority],
                      }}
                      title={`${priority}: ${count}`}
                    />
                  );
                })}
              </div>
              <div className="priority-legend">
                {priorityOrder.map((priority) => (
                  <div className="priority-legend-item" key={priority}>
                    <span>
                      <i style={{ backgroundColor: priorityColors[priority] }} />
                      {priority}
                    </span>
                    <strong>{summary?.priority_counts[priority] ?? 0}</strong>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </div>

      <section className="content-card dashboard-followup-card">
        <div className="card-heading">
          <div>
            <h3>Follow-up tracker</h3>
            <p>Stay ahead of your customer commitments</p>
          </div>
          <button
            type="button"
            className="dashboard-text-action"
            onClick={() => onNavigateToFollowUp("")}
          >
            View leads <ArrowUpRight size={15} />
          </button>
        </div>

        <div className="followup-grid">
          {followUps.map(({ label, value, note, icon: Icon, color }) => {
            const filter: FollowUpFilter =
              color === "overdue"
                ? "overdue"
                : color === "today"
                  ? "today"
                  : color === "none"
                    ? "none"
                    : "upcoming";

            return (
              <button
                type="button"
                className={`followup-item followup-clickable ${color}`}
                key={label}
                onClick={() => onNavigateToFollowUp(filter)}
                aria-label={`View ${label.toLowerCase()} follow-ups`}
              >
                <div className="followup-icon">
                  <Icon size={19} />
                </div>
                <div className="followup-value">
                  {loading ? "?" : value ?? 0}
                </div>
                <strong>{label}</strong>
                <span>{note}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="content-card dashboard-recent-leads-card">
        <div className="card-heading">
          <div>
            <h3>Recently added leads</h3>
            <p>Your five latest customer records</p>
          </div>
          <button
            type="button"
            className="dashboard-text-action"
            onClick={() => onNavigate("Leads")}
          >
            All leads <ArrowUpRight size={15} />
          </button>
        </div>

        {loading ? (
          <div className="dashboard-loading">
            <LoaderCircle size={20} className="spin-icon" />
            Loading recent leads?
          </div>
        ) : summary?.recent_leads.length ? (
          <div className="dashboard-table-wrap">
            <table className="dashboard-recent-table">
              <thead>
                <tr>
                  <th>Lead</th>
                  <th>Company</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Follow-up</th>
                </tr>
              </thead>
              <tbody>
                {summary.recent_leads.map((lead) => (
                  <tr key={lead.id}>
                    <td>
                      <strong>{lead.lead_name}</strong>
                    </td>
                    <td>{lead.company}</td>
                    <td>
                      <span className={`dashboard-status-tag status-${lead.status.toLowerCase()}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td>
                      <span className={`dashboard-priority-tag priority-${lead.priority.toLowerCase()}`}>
                        {lead.priority}
                      </span>
                    </td>
                    <td>
                      {lead.follow_up_date
                        ? formatActivityDate(lead.follow_up_date)
                        : "Not scheduled"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="dashboard-empty">
            <Users size={24} />
            <strong>No leads yet</strong>
            <span>Create your first lead to see it here.</span>
            <button
              type="button"
              className="dashboard-text-action"
              onClick={() => onNavigate("Leads")}
            >
              Create a lead <ArrowUpRight size={15} />
            </button>
          </div>
        )}
      </section>

      <div className="dashboard-bottom-grid">
        <section className="content-card dashboard-latest-call">
          <div className="card-heading">
            <div>
              <h3>Latest call activity</h3>
              <p>Most recently recorded customer interaction</p>
            </div>
            <div className="dashboard-call-icon">
              <PhoneCall size={18} />
            </div>
          </div>

          {summary?.latest_activity ? (
            <div className="latest-call-content">
              <strong>{summary.latest_activity.lead_name}</strong>
              <span>{summary.latest_activity.company}</span>
              <small>
                <Clock3 size={14} />
                {formatActivityDate(summary.latest_activity.call_date)}
              </small>
            </div>
          ) : (
            <div className="dashboard-empty compact">
              <span>No calls recorded yet.</span>
            </div>
          )}

          <button
            type="button"
            className="dashboard-text-action"
            onClick={() => onNavigate("Call History")}
          >
            View call history <ArrowUpRight size={15} />
          </button>
        </section>

        <section className="content-card dashboard-quick-card">
          <div className="card-heading">
            <div>
              <h3>Quick actions</h3>
              <p>Move directly to your daily tasks</p>
            </div>
          </div>

          <div className="quick-actions">
            <button
              type="button"
              className="quick-action quick-action-button"
              onClick={() => onNavigate("Leads")}
            >
              <div className="quick-icon blue">
                <Plus size={20} />
              </div>
              <div>
                <strong>Manage leads</strong>
                <span>Create and organize customer leads</span>
              </div>
              <ArrowUpRight size={18} />
            </button>

            <button
              type="button"
              className="quick-action quick-action-button"
              onClick={() => onNavigate("Call Tracking")}
            >
              <div className="quick-icon purple">
                <PhoneCall size={20} />
              </div>
              <div>
                <strong>Record a call</strong>
                <span>Document a customer interaction</span>
              </div>
              <ArrowUpRight size={18} />
            </button>
          </div>
        </section>
      </div>
    </>
  );
}

function App() {
  const [activePage, setActivePage] = useState<Page>("Dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [leadFollowUpFilter, setLeadFollowUpFilter] =
    useState<FollowUpFilter | "">("");

  const navigateToPage = (page: Page) => {
    if (page === "Leads") {
      setLeadFollowUpFilter("");
    }
    setActivePage(page);
  };

  const navigateToFollowUp = (filter: FollowUpFilter | "") => {
    setLeadFollowUpFilter(filter);
    setActivePage("Leads");
  };

  const renderPage = () => {
    switch (activePage) {
      case "Leads":
        return <LeadsPage initialFollowUpFilter={leadFollowUpFilter} />;
      case "Call Tracking":
        return <CallTrackingPage />;
      case "Call History":
        return <CallHistoryPage />;
      default:
        return (
          <Dashboard
            onNavigate={navigateToPage}
            onNavigateToFollowUp={navigateToFollowUp}
          />
        );
    }
  };

  return (
    <div className="app-layout">
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      <main className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="menu-toggle"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
            >
              <Menu size={21} />
            </button>
            <div className="breadcrumb">
              Workspace <span>/</span> <strong>{activePage}</strong>
            </div>
          </div>

          <div className="topbar-right">
            <div className="topbar-status">
              <span className="status-dot" />
              CRM Workspace
            </div>
            <button className="icon-button" aria-label="Notifications">
              <Bell size={19} />
            </button>
            <div className="top-avatar">U</div>
          </div>
        </header>

        <div className="page-container">
          {renderPage()}
        </div>
      </main>
    </div>
  );
}

export default App;


