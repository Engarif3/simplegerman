import { aiApiClient } from "./aiApiClient";
import { apiClient } from "./apiClient";

export interface ReportReason {
  id: number;
  label: string;
  requiresSentence?: boolean;
}

export interface ReportOptions {
  reasons: ReportReason[];
  freeTextEnabled: boolean;
  maxCharacters: number;
}

interface RawReportSettings {
  freeTextEnabled?: boolean;
  maxCharacters?: number;
}

// Each report surface (paragraph/conjugation/word) caches its own
// reasons+settings for the app session — they rarely change, and the AI
// microservice in particular is far less trafficked, so repeat cold-start
// latency on every report-panel open is worth avoiding. Mirrors web's
// module-level caches in AIModal.jsx / ConjugationModal.jsx / WordReportSection.jsx.
const optionsCache = new Map<string, ReportOptions>();

async function loadOptions(
  cacheKey: string,
  fetchReasons: () => Promise<ReportReason[]>,
  fetchSettings: () => Promise<RawReportSettings>,
): Promise<ReportOptions> {
  const cached = optionsCache.get(cacheKey);
  if (cached) return cached;

  const [reasons, settings] = await Promise.all([fetchReasons(), fetchSettings()]);
  const options: ReportOptions = {
    reasons,
    freeTextEnabled: settings.freeTextEnabled ?? true,
    maxCharacters: settings.maxCharacters ?? 50,
  };
  optionsCache.set(cacheKey, options);
  return options;
}

class ReportService {
  // --- AI paragraph report (AI microservice) ---
  getParagraphReportOptions(): Promise<ReportOptions> {
    return loadOptions(
      "paragraph",
      async () =>
        (await aiApiClient.get<{ data: ReportReason[] }>("/api/paragraphs/report-reasons")).data,
      async () =>
        (await aiApiClient.get<{ data: RawReportSettings }>("/api/paragraphs/report-settings")).data,
    );
  }

  async submitParagraphReport(params: {
    wordId: string | number;
    userId?: string;
    reasonIds: number[];
    message: string | null;
  }): Promise<void> {
    await aiApiClient.post("/api/paragraphs/report", params);
  }

  // --- AI conjugation report (AI microservice) ---
  getConjugationReportOptions(): Promise<ReportOptions> {
    return loadOptions(
      "conjugation",
      async () =>
        (await aiApiClient.get<{ data: ReportReason[] }>("/api/conjugations/report-reasons")).data,
      async () =>
        (await aiApiClient.get<{ data: RawReportSettings }>("/api/conjugations/report-settings")).data,
    );
  }

  async submitConjugationReport(params: {
    verb: string;
    userId?: string;
    reasonIds: number[];
    message: string | null;
  }): Promise<void> {
    await aiApiClient.post("/api/conjugations/report", params);
  }

  // --- Word report (main backend) ---
  getWordReportOptions(): Promise<ReportOptions> {
    return loadOptions(
      "word",
      async () =>
        (await apiClient.get<ReportReason[]>("/word-reports/reasons")),
      async () => (await apiClient.get<RawReportSettings>("/word-reports/settings")),
    );
  }

  async checkWordAlreadyReported(wordId: string): Promise<boolean> {
    const result = await apiClient.get<{ alreadyReported: boolean }>(
      `/word-reports/check/${wordId}`,
    );
    return Boolean(result?.alreadyReported);
  }

  async submitWordReport(params: {
    wordId: string;
    reasonIds: number[];
    sentenceIndex?: number;
    message?: string;
  }): Promise<void> {
    await apiClient.post("/word-reports", params);
  }
}

export const reportService = new ReportService();
