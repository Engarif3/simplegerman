import { apiClient } from "./apiClient";

export interface QuizWord {
  id: number;
  value: string;
  meaning: string[];
  article: { id: number; name: string } | null;
  level: { id: number; level: string } | null;
}

export interface QuizWordsResponse {
  words: QuizWord[];
  availableCount: number;
  difficulty: number;
}

class QuizService {
  // Difficulty: 1 = Easy (A1/A2), 2 = Difficult (B1/B2), 3 = Mixed (all
  // levels). No topic filter exists on this endpoint (unlike /word/all).
  async getQuizWords(difficulty: number, limit = 30): Promise<QuizWordsResponse> {
    const params = new URLSearchParams({
      difficulty: String(difficulty),
      limit: String(limit),
    });
    return apiClient.get<QuizWordsResponse>(`/word/quiz?${params.toString()}`);
  }
}

export const quizService = new QuizService();
