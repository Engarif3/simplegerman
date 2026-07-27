import { apiClient } from "./apiClient";

export interface WordVocab {
  id: string;
  value: string; // Backend field name
  meaning: string | string[];
  example?: string;
  // The list endpoint (/word/all) only returns the raw FK; the single-word
  // endpoint (/word/:id) resolves it to the full { id, name } relation.
  partOfSpeechId?: number | null;
  partOfSpeech?: { id: number; name: string } | null;
  createdAt?: string;
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
  // Verb-specific grammar fields (present on the list & single-word payloads)
  prefix?: string | null;
  prefixType?: "SEPARABLE" | "INSEPARABLE" | null;
  isModal?: boolean;
  isReflexive?: boolean;
  conjugation?: "REGULAR" | "IRREGULAR" | null;
  caseRequirement?: "ACCUSATIVE" | "DATIVE" | "GENITIVE" | "PREPOSITIONAL" | null;
  // Preposition-specific
  prepositionCase?: "ACCUSATIVE" | "DATIVE" | "GENITIVE" | "WECHSEL" | null;
  // Adjective-specific
  isPrepositional?: boolean;
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

export interface WordListLevel {
  id: number;
  level: string;
}

export interface WordListTopic {
  id: number;
  name: string;
  levelId?: number;
}

export interface WordListFilters {
  limit?: number;
  page?: number;
  level?: string;
  topic?: string;
  search?: string;
  searchType?: "word" | "meaning";
  // Lowercase part-of-speech name (e.g. "verb", "noun") — the backend
  // resolves this against the parts_of_speech table itself.
  partOfSpeech?: string;
  verbFilter?: string;
  prepositionFilter?: string;
  adjectiveFilter?: string;
  recentOnly?: boolean;
}

export interface WordListResponse {
  words: WordVocab[];
  currentPage: number | null;
  totalPages: number | null;
  totalWords: number;
  levels: WordListLevel[];
  topics: WordListTopic[];
}

export interface WordSuggestion {
  id: string;
  value: string;
  meaning: string[];
  // Only true for results found via the backend's fuzzy typo-correction
  // pass, not its normal substring search — see suggestWords() below.
  isFuzzy?: boolean;
}

// The backend's Word.id is a numeric auto-increment column, so it comes
// back over the wire as a JSON number (e.g. 435) — but WordVocab.id is
// typed string, and code throughout the app (favorites Set membership,
// route params, etc.) relies on that being true. Without this, a raw
// numeric id compared against a stringified one (e.g. via Set.has) never
// matches, which silently broke favorite-status checks everywhere.
export const normalizeWordId = <T extends { id: unknown }>(word: T): T => ({
  ...word,
  id: String(word.id),
});

class WordService {
  // Every filter (level/topic/type/search/recent) is applied server-side in
  // a single request — the backend already returns the full levels/topics
  // lookup lists alongside the page of words, so there is no need to ever
  // fetch the entire word table client-side just to populate dropdowns.
  async getWords(filters: WordListFilters = {}): Promise<WordListResponse> {
    const {
      limit = 40,
      page = 1,
      level,
      topic,
      search,
      searchType,
      partOfSpeech,
      verbFilter,
      prepositionFilter,
      adjectiveFilter,
      recentOnly,
    } = filters;

    const params = new URLSearchParams({
      limit: String(limit),
      page: String(page),
    });

    if (level) params.set("level", level);
    if (topic) params.set("topic", topic);
    if (partOfSpeech) params.set("partOfSpeech", partOfSpeech);
    if (verbFilter) params.set("verbFilter", verbFilter);
    if (prepositionFilter) params.set("prepositionFilter", prepositionFilter);
    if (adjectiveFilter) params.set("adjectiveFilter", adjectiveFilter);
    if (recentOnly) params.set("recentOnly", "true");
    if (search) {
      params.set("search", search);
      params.set("searchType", searchType || "word");
    }

    const response = await apiClient.get<WordListResponse>(
      `/word/all?${params.toString()}`,
    );
    return { ...response, words: response.words.map(normalizeWordId) };
  }

  async getWord(id: string) {
    const word = await apiClient.get<WordVocab>(`/word/${id}`);
    return normalizeWordId(word);
  }

  // "Did you mean" typo suggestions (mirrors web's WordList.jsx suggestion
  // dropdown). The backend only runs its fuzzy/trigram+Levenshtein pass
  // when a plain substring search on /word/all comes back sparse (<=2
  // hits), and marks those results isFuzzy: true — everything else is a
  // regular substring match, which callers should filter out to match
  // web's "only show typo corrections, not a redundant autocomplete list"
  // behavior.
  async suggestWords(
    search: string,
    searchType: "word" | "meaning" = "word",
    limit = 8,
  ): Promise<WordSuggestion[]> {
    const params = new URLSearchParams({
      search,
      searchType,
      limit: String(limit),
    });
    const results = await apiClient.get<
      Array<{ id: number | string; value: string; meaning: string[]; isFuzzy?: boolean }>
    >(`/word/suggest?${params.toString()}`);
    return results.map((item) => ({ ...item, id: String(item.id) }));
  }
}

export const wordService = new WordService();
