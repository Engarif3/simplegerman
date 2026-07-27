import { aiApiClient } from "./aiApiClient";

export interface ConjugationRow {
  pronoun: string;
  conjugation: string;
}

export interface ConjugationData {
  präsens: ConjugationRow[];
  perfekt: {
    auxiliary?: string;
    participleForm?: string;
    conjugations: ConjugationRow[];
  };
  präteritum: ConjugationRow[];
}

class ConjugationService {
  // Cached server-side per verb (DB cache keyed by the lowercased verb), so
  // repeat taps for the same verb across users/words don't re-hit the LLM —
  // mirrors web's WordList.jsx handleConjugate + its session-level cache.
  async generate(word: string, wordId?: string): Promise<ConjugationData> {
    const response = await aiApiClient.post<{
      success: boolean;
      data: ConjugationData;
    }>("/api/conjugations/generate", { word, wordId });

    return response.data;
  }
}

export const conjugationService = new ConjugationService();
