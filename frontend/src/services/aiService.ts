import api from "./api";
import type {
  AISummaryRequest,
  AISummaryResponse,
  AICallIntelligenceResponse,
} from "../types/ai";

export const generateAISummary = async (
  notes: string
): Promise<string> => {
  const response = await api.post<AISummaryResponse>(
    "/ai/summarize",
    { notes } satisfies AISummaryRequest
  );

  return response.data.data.summary;
};

export const analyzeCallIntelligence = async (
  notes: string
): Promise<AICallIntelligenceResponse["data"]> => {
  const response = await api.post<AICallIntelligenceResponse>(
    "/ai/analyze",
    { notes } satisfies AISummaryRequest
  );

  return response.data.data;
};
