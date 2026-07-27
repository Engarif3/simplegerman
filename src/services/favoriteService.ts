import { apiClient } from "./apiClient";
import { normalizeWordId, WordVocab } from "./wordService";

class FavoriteService {
  // Idempotent: if the word is already favorited server-side (e.g. the
  // local favorites list was stale), treat that as success instead of
  // surfacing an error — the end state the user wants (favorited) is
  // already true.
  async addFavorite(wordId: string) {
    const numericWordId = parseInt(wordId, 10);
    if (isNaN(numericWordId)) {
      throw new Error(`Invalid wordId format: ${wordId}`);
    }

    try {
      return await apiClient.post(`/favorite-words`, {
        wordId: numericWordId,
      });
    } catch (error: any) {
      if (
        error.response?.status === 400 &&
        error.response?.data?.error === "Word is already in favorites"
      ) {
        return null;
      }

      console.error("[FavoriteService.addFavorite] Error:", {
        status: error.response?.status,
        data: error.response?.data,
      });
      throw error;
    }
  }

  // Idempotent counterpart to addFavorite: a 404 means the word was
  // already not favorited, which is the state the caller wants anyway.
  async removeFavorite(wordId: string) {
    const numericWordId = parseInt(wordId, 10);
    if (isNaN(numericWordId)) {
      throw new Error(`Invalid wordId format: ${wordId}`);
    }

    try {
      return await apiClient.delete(`/favorite-words/${numericWordId}`);
    } catch (error: any) {
      if (
        error.response?.status === 404 &&
        error.response?.data?.error === "Favorite word not found"
      ) {
        return null;
      }

      console.error("[FavoriteService.removeFavorite] Error:", {
        status: error.response?.status,
        data: error.response?.data,
      });
      throw error;
    }
  }

  async getFavorites(userId: string): Promise<WordVocab[]> {
    try {
      const result = await apiClient.get<WordVocab[]>(
        `/favorite-words/${userId}`,
      );
      return (Array.isArray(result) ? result : []).map(normalizeWordId);
    } catch (error: any) {
      console.error("[FavoriteService.getFavorites] Error:", {
        status: error.response?.status,
        data: error.response?.data,
      });
      throw error;
    }
  }
}

export const favoriteService = new FavoriteService();
