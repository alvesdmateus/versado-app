import { apiClient } from "./api-client";

export interface ExamCard {
  id: string;
  front: string;
  back: string;
}

export interface ExamSessionResponse {
  id: string;
  cards: ExamCard[];
  timeLimitSeconds: number;
  questionCount: number;
  passingScore: number;
}

export interface ExamResult {
  id: string;
  passed: boolean;
  correctCount: number;
  questionCount: number;
  passingScore: number;
  timeSpentSeconds: number;
  score: number;
}

export interface ExamHistoryItem {
  id: string;
  trackId: string;
  questionCount: number;
  correctCount: number;
  passingScore: number;
  passed: boolean;
  timeSpentSeconds: number;
  completedAt: string;
}

export const examApi = {
  startExam(trackId: string) {
    return apiClient<ExamSessionResponse>("/api/exam/start", {
      method: "POST",
      body: JSON.stringify({ trackId }),
    });
  },

  submitAnswer(examSessionId: string, cardId: string, knew: boolean) {
    return apiClient<{ answersSubmitted: number }>("/api/exam/answer", {
      method: "POST",
      body: JSON.stringify({ examSessionId, cardId, knew }),
    });
  },

  completeExam(examSessionId: string, timeSpentSeconds: number) {
    return apiClient<ExamResult>(`/api/exam/${examSessionId}/complete`, {
      method: "PATCH",
      body: JSON.stringify({ examSessionId, timeSpentSeconds }),
    });
  },

  getHistory(trackId: string) {
    return apiClient<{ sessions: ExamHistoryItem[] }>(
      `/api/exam/history?trackId=${trackId}`
    );
  },
};
