export interface AISummaryRequest {
  notes: string;
}

export interface AISummaryResponse {
  success: boolean;
  message: string;
  data: {
    summary: string;
  };
}

export interface AICallIntelligenceData {
  summary: string;
  customer_intent: string;
  requirements: string[];
  customer_interests: string[];
  action_items: string[];
  follow_up_recommendation: string;
}

export interface AICallIntelligenceResponse {
  success: boolean;
  message: string;
  data: AICallIntelligenceData;
}
