import { apiClient } from "./apiClient";

class FavoriteService {
  async addFavorite(wordId: string) {
    try {
      const numericWordId = parseInt(wordId, 10);
      if (isNaN(numericWordId)) {
        throw new Error(`Invalid wordId format: ${wordId}`);
      }
      console.log("[FavoriteService.addFavorite] Starting with:", {
        originalWordId: wordId,
        numericWordId,
      });

      // Get token to verify it exists
      const token = await apiClient.getToken();
      console.log(
        "[FavoriteService.addFavorite] Token exists:",
        !!token,
        token ? `${token.substring(0, 20)}...` : "NO TOKEN",
      );

      const response = await apiClient.post(`/favorite-words`, {
        wordId: numericWordId,
      });
      console.log("[FavoriteService.addFavorite] Success response:", response);
      return response;
    } catch (error: any) {
      console.error("[FavoriteService.addFavorite] Error:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        fullError: error,
      });
      throw error;
    }
  }

  async removeFavorite(wordId: string) {
    try {
      const numericWordId = parseInt(wordId, 10);
      if (isNaN(numericWordId)) {
        throw new Error(`Invalid wordId format: ${wordId}`);
      }
      console.log("[FavoriteService.removeFavorite] Starting with:", {
        originalWordId: wordId,
        numericWordId,
      });

      const response = await apiClient.delete(
        `/favorite-words/${numericWordId}`,
      );
      console.log(
        "[FavoriteService.removeFavorite] Success response:",
        response,
      );
      return response;
    } catch (error: any) {
      console.error("[FavoriteService.removeFavorite] Error:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      throw error;
    }
  }

  async getFavorites(userId: string) {
    try {
      console.log("[FavoriteService.getFavorites] Fetching for user:", userId);
      const response = await apiClient.get<any>(`/favorite-words/${userId}`);
      console.log("[FavoriteService.getFavorites] Success response:", response);
      return response;
    } catch (error: any) {
      console.error("[FavoriteService.getFavorites] Error:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      throw error;
    }
  }
}

export const favoriteService = new FavoriteService();
