import { apiClient } from "./apiClient";

export interface WordVocab {
  id: string;
  value: string; // Backend field name
  meaning: string | string[];
  example?: string;
  partOfSpeech?: string;
  difficulty?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  level?: {
    id: number;
    level?: string; // Backend returns 'level' field (e.g., "A1", "A2", "B1")
    name?: string; // Optional for compatibility
  };
  topic?: {
    id: number | string;
    name: string;
    levelId?: number; // For sorting topics by level
  };
  article?: string | { name?: string; value?: string };
  creator?: {
    id: string;
    name: string;
  };
  pluralForm?: string;
  sentences?: string[];
  synonyms?: Array<{
    value: string;
    article?: string | { name?: string; value?: string };
  }>;
  antonyms?: Array<{
    value: string;
    article?: string | { name?: string; value?: string };
  }>;
  similarWords?: Array<{
    value: string;
    article?: string | { name?: string; value?: string };
  }>;
}

class WordService {
  async getWords(limit: number = 50, page: number = 1) {
    try {
      console.log("[WordService] Fetching words, page:", page, "limit:", limit);
      const response = await apiClient.get<{
        words: WordVocab[];
        currentPage: number;
        totalPages: number;
        totalWords: number;
      }>(`/word/all?limit=${limit}&page=${page}`);
      console.log("[WordService] Success! Response received:", {
        wordCount: response?.words?.length || 0,
        totalWords: response?.totalWords,
        currentPage: response?.currentPage,
        totalPages: response?.totalPages,
        firstWord: response?.words?.[0],
      });
      return response;
    } catch (error: any) {
      console.error("[WordService.getWords] Error fetching words:", {
        message: error.message,
        status: error.response?.status,
        responseData: error.response?.data,
      });
      throw error;
    }
  }

  // Fetch all words without pagination (for topic/level extraction)
  async getAllWords() {
    try {
      console.log("[WordService] Fetching ALL words without pagination");
      const response = await apiClient.get<{
        words: WordVocab[];
        currentPage: number;
        totalPages: number;
        totalWords: number;
      }>(`/word/all?limit=10000&page=1`);
      console.log("[WordService.getAllWords] Success! Response received:", {
        wordCount: Array.isArray(response)
          ? response.length
          : response?.words?.length || 0,
      });
      // Handle both array and object response formats
      return Array.isArray(response) ? response : response?.words || [];
    } catch (error: any) {
      console.error("[WordService.getAllWords] Error fetching all words:", {
        message: error.message,
        status: error.response?.status,
        responseData: error.response?.data,
      });
      throw error;
    }
  }

  async getWord(id: string) {
    return apiClient.get<WordVocab>(`/word/${id}`);
  }

  async searchWords(query: string) {
    return apiClient.get<WordVocab[]>(`/word/search?q=${query}`);
  }
}

export const wordService = new WordService();
