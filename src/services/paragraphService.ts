import { aiApiClient } from "./aiApiClient";
import type { WordVocab } from "./wordService";

export interface GeneratedParagraph {
  wordId: string;
  word: string;
  meanings: string[];
  paragraph: string;
  sentences: string[];
}

const getWordLevel = (word: Pick<WordVocab, "level">) =>
  word.level?.level || word.level?.name || "A1";

class ParagraphService {
  // Cached server-side (per wordId) after the first generation, so repeat
  // taps are effectively free — mirrors web's WordList.jsx generateParagraph.
  async generate(
    word: Pick<WordVocab, "id" | "value" | "meaning" | "level">,
    userId?: string,
  ): Promise<GeneratedParagraph> {
    const response = await aiApiClient.post<{
      wordId: string | number;
      word: string;
      meanings?: string[];
      paragraph?: string;
      sentences?: string[];
      otherSentences?: string[];
    }>("/api/paragraphs/generate", {
      userId,
      // WordVocab.id is a string everywhere else in this app (routing,
      // favorites, …), but the AI service's Prisma schema requires a real
      // Int for its generatedParagraph cache lookup — sending the string
      // as-is 500s with "Expected Int, provided String".
      wordId: Number(word.id),
      word: word.value,
      meaning: word.meaning,
      level: getWordLevel(word),
      language: "de",
    });

    return {
      wordId: String(response.wordId),
      word: response.word,
      meanings: response.meanings || [],
      paragraph: response.paragraph || "",
      sentences: response.sentences || response.otherSentences || [],
    };
  }
}

export const paragraphService = new ParagraphService();
