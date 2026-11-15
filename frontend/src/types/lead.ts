export type LeadStatus =
  | "New"
  | "Contacted"
  | "Interested"
  | "Converted"
  | "Lost";

export type LeadPriority = "Low" | "Medium" | "High";

export interface Lead {
  id: number;
  lead_name: string;
  company: string;
  contact_number: string;
  status: LeadStatus;
  priority: LeadPriority;
  follow_up_date: string | null;
  lead_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeadCreate {
  lead_name: string;
  company: string;
  contact_number: string;
  status: LeadStatus;
  priority: LeadPriority;
  follow_up_date: string | null;
  lead_notes: string | null;
}

export type LeadUpdate = LeadCreate;

export type FollowUpFilter = "overdue" | "today" | "upcoming" | "none";

export interface LeadFilters {
  status?: LeadStatus | "";
  priority?: LeadPriority | "";
  follow_up_status?: FollowUpFilter | "";
}

export interface LeadListResponse {
  success: boolean;
  message: string;
  data: Lead[];
  total: number;
}

export interface LeadDeleteResponse {
  success: boolean;
  message: string;
}
