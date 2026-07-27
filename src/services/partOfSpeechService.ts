import { apiClient } from "./apiClient";

export interface PartOfSpeech {
  id: number;
  name: string;
}

class PartOfSpeechService {
  async getAll(): Promise<PartOfSpeech[]> {
    const result = await apiClient.getRaw<PartOfSpeech[]>("/part-of-speech");
    return Array.isArray(result) ? result : [];
  }
}

export const partOfSpeechService = new PartOfSpeechService();
