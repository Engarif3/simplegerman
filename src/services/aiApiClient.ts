import axios, { AxiosInstance } from "axios";
import { apiClient } from "./apiClient";

const AI_API_BASE_URL =
  process.env.EXPO_PUBLIC_AI_API_URL || "http://localhost:5000";

// The AI paragraph/conjugation microservice is a separate deployment from
// the main backend (mirrors web's AI_axios.js), so it needs its own axios
// instance and base URL — but reuses the same stored Bearer token via
// apiClient.getToken() rather than keeping a second copy of it.
class AiApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: AI_API_BASE_URL,
      timeout: 30000,
      headers: { "Content-Type": "application/json" },
    });

    this.client.interceptors.request.use(async (config) => {
      const token = await apiClient.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  async post<T = any>(url: string, data?: any): Promise<T> {
    const response = await this.client.post<T>(url, data);
    return response.data;
  }

  async get<T = any>(url: string): Promise<T> {
    const response = await this.client.get<T>(url);
    return response.data;
  }
}

export const aiApiClient = new AiApiClient();
