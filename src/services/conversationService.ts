import { apiClient } from "./apiClient";

export interface ConversationTurn {
  speaker: string;
  message: string;
}

export interface Conversation {
  id: number;
  topic: string;
  text: ConversationTurn[];
  levelId: number;
  createdBy: string;
  // Prisma relation key really is "levels" (see schema.prisma), with the
  // CEFR code in .level (e.g. "A1") — not .name.
  levels?: { id: number; level: string };
}

class ConversationService {
  async getConversations(): Promise<Conversation[]> {
    return apiClient.get<Conversation[]>("/conversation/all");
  }

  async getConversation(id: number | string): Promise<Conversation> {
    return apiClient.get<Conversation>(`/conversation/${id}`);
  }
}

export const conversationService = new ConversationService();
