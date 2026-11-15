export interface CallInteraction {
  id: number;
  lead_id: number;
  call_date: string;
  original_notes: string;
  notes: string;
  ai_summary: string | null;
  created_at: string;
  updated_at: string;
}

export interface CallInteractionCreate {
  call_date: string;
  original_notes: string;
  notes: string;
  ai_summary: string | null;
}

export interface CallInteractionUpdate {
  call_date: string;
  notes: string;
  ai_summary: string | null;
}

export interface CallListResponse {
  success: boolean;
  message: string;
  data: CallInteraction[];
  total: number;
}

export interface CallResponse {
  success?: boolean;
  message?: string;
  data?: CallInteraction;
}
