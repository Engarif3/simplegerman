import { apiClient } from "./apiClient";

export type ChallengeLevel = "easy" | "intermediate" | "difficult";

export interface ChallengeQuestion {
  id: number;
  value: string;
  article: { id: number; name: string } | null;
  options: string[];
}

export interface LevelStatus {
  level: ChallengeLevel;
  locked: boolean;
  questionsAnswered: number;
  correctAnswers: number;
  totalWords: number;
}

export interface LevelStatusMap {
  easy: LevelStatus;
  intermediate: LevelStatus;
  difficult: LevelStatus;
}

export interface ChallengeWordsResult {
  level: ChallengeLevel;
  locked: boolean;
  questionsAnswered: number;
  correctAnswers: number;
  questions: ChallengeQuestion[];
  currentQuestionStartedAt: string | null;
}

export interface ChallengeAnswerResult {
  wordId: number;
  correct: boolean;
  correctAnswer: string;
  xpDelta: number;
  timedOut: boolean;
  questionsAnswered: number;
  correctAnswers: number;
  completed: boolean;
  nextQuestionStartedAt: string | null;
}

export interface StreakResult {
  currentStreak: number;
  longestStreak: number;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  weeklyXp: number;
  totalXp: number;
}

export interface LeaderboardResult {
  level: ChallengeLevel;
  entries: LeaderboardEntry[];
  me: { rank: number | null; weeklyXp: number; totalXp: number };
  daysUntilReset: number;
}

// Guest/practice mode — not tied to any user, nothing is persisted, so
// there's no locked/questionsAnswered/streak state to report. Matches web's
// ChallengeSession.jsx guest path exactly.
export interface PracticeWordsResult {
  level: ChallengeLevel;
  questions: ChallengeQuestion[];
}

export interface PracticeAnswerResult {
  correct: boolean;
  correctAnswer: string;
}

// Server rejects a localDate that drifts too far from its own UTC clock, but
// expects the device's LOCAL calendar day (not UTC) — matches web's
// ChallengeSession.jsx exactly, since "today" for daily-challenge purposes
// means the user's own timezone, not the server's.
export const getLocalDateKey = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

class ChallengeService {
  async getLevelStatus(): Promise<LevelStatusMap> {
    return apiClient.get<LevelStatusMap>(
      `/challenge/levels?localDate=${getLocalDateKey()}`,
    );
  }

  async getChallengeWords(level: ChallengeLevel): Promise<ChallengeWordsResult> {
    return apiClient.get<ChallengeWordsResult>(
      `/challenge/levels/${level}/words?localDate=${getLocalDateKey()}`,
    );
  }

  async submitAnswer(
    level: ChallengeLevel,
    wordId: number,
    selectedAnswer: string,
  ): Promise<ChallengeAnswerResult> {
    return apiClient.post<ChallengeAnswerResult>(`/challenge/levels/${level}/answer`, {
      wordId,
      selectedAnswer,
      localDate: getLocalDateKey(),
    });
  }

  async completeSession(): Promise<StreakResult> {
    return apiClient.post<StreakResult>("/challenge/complete-session", {
      localDate: getLocalDateKey(),
    });
  }

  async getStreak(): Promise<StreakResult> {
    return apiClient.get<StreakResult>("/challenge/streak");
  }

  async getLeaderboard(level: ChallengeLevel, limit = 20): Promise<LeaderboardResult> {
    return apiClient.get<LeaderboardResult>(
      `/challenge/levels/${level}/leaderboard?limit=${limit}`,
    );
  }

  // Guest/practice mode — no auth required. Lets an anonymous visitor play
  // for real; nothing here is persisted server-side.
  async getPracticeWords(level: ChallengeLevel): Promise<PracticeWordsResult> {
    return apiClient.get<PracticeWordsResult>(`/challenge/practice/${level}/words`);
  }

  async checkPracticeAnswer(
    level: ChallengeLevel,
    wordId: number,
    selectedAnswer: string,
  ): Promise<PracticeAnswerResult> {
    return apiClient.post<PracticeAnswerResult>(
      `/challenge/practice/${level}/check-answer`,
      { wordId, selectedAnswer },
    );
  }
}

export const challengeService = new ChallengeService();
