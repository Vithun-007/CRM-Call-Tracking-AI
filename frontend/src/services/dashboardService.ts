import api from "./api";

export interface LatestActivity {
  call_id: number;
  lead_id: number;
  lead_name: string;
  company: string;
  call_date: string;
}

export interface FollowUpCounts {
  overdue: number;
  due_today: number;
  upcoming: number;
  no_follow_up: number;
}

export interface RecentLead {
  id: number;
  lead_name: string;
  company: string;
  status: string;
  priority: string;
  follow_up_date: string | null;
  created_at: string;
}

export interface DashboardSummary {
  total_leads: number;
  calls_recorded: number;
  interactions: number;
  latest_activity: LatestActivity | null;
  lead_status_counts: Record<string, number>;
  priority_counts: Record<string, number>;
  conversion_rate: number;
  follow_up_counts: FollowUpCounts;
  recent_leads: RecentLead[];
}

export const getDashboardSummary = async (): Promise<DashboardSummary> => {
  const response = await api.get<DashboardSummary>("/dashboard/summary");
  return response.data;
};
