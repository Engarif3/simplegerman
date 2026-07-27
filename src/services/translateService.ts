import { apiClient } from "./apiClient";

export interface TranslateResult {
  translated: string;
}

class TranslateService {
  async translate(
    text: string,
    source: string = "de",
    target: string = "en",
  ): Promise<TranslateResult> {
    return apiClient.post<TranslateResult>("/translate", {
      text,
      source,
      target,
    });
  }
}

export const translateService = new TranslateService();
