import { apiClient } from "./apiClient";

export interface Story {
  id: string;
  title: string;
  description: string;
  promptUsed: string;
  image?: string; // Backend returns 'image' not 'imageUrl'
  passageVocabulary: Array<{
    word: string;
    meaning: string;
  }>;
  vocabulary: Array<{
    word: string;
    meaning: string;
  }>;
  levelId: number;
  isPublished: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  level?: {
    id: number;
    name: string;
  };
  creator?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface CreateStoryRequest {
  levelId: string;
  topic: string;
}

class StoryService {
  async getStories(levelId?: string, limit: number = 10, offset: number = 0) {
    if (levelId) {
      return apiClient.get<Story[]>(`/stories/level/${levelId}`);
    }
    return apiClient.get<Story[]>(`/stories/all`);
  }

  async getStory(id: string) {
    return apiClient.get<Story>(`/stories/${id}`);
  }

  async generateStory(data: CreateStoryRequest) {
    return apiClient.post<Story>("/stories/generate", data);
  }

  async regenerateStory(id: string) {
    return apiClient.post<Story>(`/stories/${id}/regenerate`, {});
  }

  async updateStory(id: string, data: Partial<Story>) {
    return apiClient.put<Story>(`/stories/${id}/update`, data);
  }

  async deleteStory(id: string) {
    return apiClient.delete<{ success: boolean }>(`/stories/${id}`);
  }

  async searchStories(query: string) {
    return apiClient.get<Story[]>(`/stories/search?q=${query}`);
  }
}

export const storyService = new StoryService();
