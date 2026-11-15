import api from "./api";

import type {
  CallInteraction,
  CallInteractionCreate,
  CallInteractionUpdate,
  CallListResponse,
} from "../types/call";

export interface CallHistoryFilters {
  skip?: number;
  limit?: number;
  search?: string;
  lead_id?: number;
  date_from?: string;
  date_to?: string;
}

export const createCall = async (
  leadId: number,
  payload: CallInteractionCreate
): Promise<CallInteraction> => {
  const response = await api.post<CallInteraction>(
    `/leads/${leadId}/calls`,
    payload
  );
  return response.data;
};

export const getAllCalls = async (
  skip = 0,
  limit = 10,
  filters: Omit<CallHistoryFilters, "skip" | "limit"> = {}
): Promise<CallListResponse> => {
  const response = await api.get<CallListResponse>("/calls", {
    params: {
      skip,
      limit,
      search: filters.search?.trim() || undefined,
      lead_id: filters.lead_id || undefined,
      date_from: filters.date_from || undefined,
      date_to: filters.date_to || undefined,
    },
  });

  return response.data;
};

export const getCallsForLead = async (
  leadId: number,
  skip = 0,
  limit = 100
): Promise<CallListResponse> => {
  const response = await api.get<CallListResponse>(
    `/leads/${leadId}/calls`,
    { params: { skip, limit } }
  );
  return response.data;
};

export const getCallById = async (
  callId: number
): Promise<CallInteraction> => {
  const response = await api.get<CallInteraction>(`/calls/${callId}`);
  return response.data;
};

export const updateCall = async (
  callId: number,
  payload: CallInteractionUpdate
): Promise<CallInteraction> => {
  const response = await api.put<CallInteraction>(
    `/calls/${callId}`,
    payload
  );
  return response.data;
};

export const deleteCall = async (callId: number): Promise<void> => {
  await api.delete(`/calls/${callId}`);
};
