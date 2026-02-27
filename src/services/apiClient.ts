import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosError,
  AxiosResponse,
} from "axios";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://localhost:5001/api/v1";

// Helper to safely check localStorage availability
const getLocalStorage = () => {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("__test__", "1");
      localStorage.removeItem("__test__");
      return localStorage;
    }
  } catch (e) {
    console.warn("[ApiClient] localStorage not available:", e);
  }
  return null;
};

const hasLocalStorage = getLocalStorage() !== null;

class ApiClient {
  private client: AxiosInstance;
  private tokenKey = "auth_token";
  private memoryToken: string | null = null;

  constructor() {
    console.log("[ApiClient] Initializing with API_BASE_URL:", API_BASE_URL);
    console.log("[ApiClient] hasLocalStorage:", hasLocalStorage);
    console.log("[ApiClient] Platform:", Platform.OS);

    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 15000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      async (config) => {
        try {
          const token = await this.getToken();
          console.log("[ApiClient.request] getToken() returned:", token ? `token exists (${token.length} chars)` : "null");

          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            console.log(
              "[ApiClient.request] ✅ Authorization header set for:",
              config.url,
            );
            console.log(
              "[ApiClient.request] Full token:",
              token,
            );
          } else {
            console.warn(
              "[ApiClient.request] ❌ NO TOKEN - Request sent without Authorization for:",
              config.url,
            );
          }
        } catch (error) {
          console.error(
            "[ApiClient.request] Error retrieving token in request interceptor:",
            error,
          );
        }
        return config;
      },
      (error) => Promise.reject(error),
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        console.error(
          "[ApiClient] Response error:",
          error.message,
          error.response?.status,
        );
        if (error.response?.status === 401) {
          // Clear token on 401
          this.memoryToken = null;
          console.log("[ApiClient] Received 401, clearing token");

          if (hasLocalStorage) {
            try {
              localStorage.removeItem(this.tokenKey);
              console.log("[ApiClient] ✅ Cleared from localStorage on 401");
            } catch (e) {
              console.warn("[ApiClient] localStorage clear failed on 401:", e);
            }
          }

          if (Platform.OS !== "web") {
            try {
              if (SecureStore.deleteItemAsync) {
                await SecureStore.deleteItemAsync(this.tokenKey);
                console.log("[ApiClient] ✅ Cleared from SecureStore on 401");
              }
            } catch (e) {
              console.warn("[ApiClient] SecureStore clear failed on 401:", e);
            }
          }
        }
        return Promise.reject(error);
      },
    );
  }

  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<{ data: T }>(url, config);
    return response.data.data;
  }

  async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response = await this.client.post<{ data: T }>(url, data, config);
    return response.data.data;
  }

  async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response = await this.client.put<{ data: T }>(url, data, config);
    return response.data.data;
  }

  async patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response = await this.client.patch<{ data: T }>(url, data, config);
    return response.data.data;
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<{ data: T }>(url, config);
    return response.data.data;
  }

  async setToken(token: string): Promise<void> {
    try {
      console.log(
        "[ApiClient.setToken] Saving token:",
        token.substring(0, 20) + "...",
      );

      this.memoryToken = token;
      console.log("[ApiClient.setToken] Token saved to memory");

      if (hasLocalStorage) {
        try {
          localStorage.setItem(this.tokenKey, token);
          console.log("[ApiClient.setToken] ✅ Token saved to localStorage");
        } catch (e) {
          console.warn("[ApiClient.setToken] localStorage save failed:", e);
        }
      } else {
        console.log(
          "[ApiClient.setToken] localStorage not available, relying on memory",
        );
      }

      if (Platform.OS !== "web") {
        try {
          await SecureStore.setItemAsync(this.tokenKey, token);
          console.log("[ApiClient.setToken] ✅ Token saved to SecureStore");
        } catch (e) {
          console.warn("[ApiClient.setToken] SecureStore save failed:", e);
        }
      }
    } catch (error) {
      console.error("[ApiClient.setToken] Error storing token:", error);
    }
  }
  async getToken(): Promise<string | null> {
    try {
      if (this.memoryToken) {
        console.log(
          "[ApiClient.getToken] Using memory token:",
          this.memoryToken.substring(0, 20) + "...",
        );
        return this.memoryToken;
      }

      if (hasLocalStorage) {
        // Try localStorage first
        try {
          const token = localStorage.getItem(this.tokenKey);
          if (token) {
            this.memoryToken = token;
            console.log(
              "[ApiClient.getToken] ✅ Loaded from localStorage:",
              token.substring(0, 20) + "...",
            );
            return token;
          } else {
            console.warn("[ApiClient.getToken] No token in localStorage");
          }
        } catch (e) {
          console.warn("[ApiClient.getToken] localStorage read failed:", e);
        }
      }

      // On native, try SecureStore
      if (Platform.OS !== "web") {
        try {
          const token = await SecureStore.getItemAsync(this.tokenKey);
          if (token) {
            this.memoryToken = token;
            console.log(
              "[ApiClient.getToken] ✅ Loaded from SecureStore:",
              token.substring(0, 20) + "...",
            );
            return token;
          } else {
            console.warn("[ApiClient.getToken] No token in SecureStore");
          }
        } catch (e) {
          console.warn("[ApiClient.getToken] SecureStore read failed:", e);
        }
      }

      console.warn(
        "[ApiClient.getToken] No token found in any storage, returning memory token:",
        this.memoryToken ? "exists" : "null",
      );
      return this.memoryToken;
    } catch (error) {
      console.error("[ApiClient.getToken] Unexpected error:", error);
      return null;
    }
  }

  async clearToken(): Promise<void> {
    this.memoryToken = null;
    console.log("[ApiClient.clearToken] Clearing token from all storage");

    if (hasLocalStorage) {
      try {
        localStorage.removeItem(this.tokenKey);
        console.log("[ApiClient.clearToken] ✅ Removed from localStorage");
      } catch (e) {
        console.warn("[ApiClient.clearToken] localStorage remove failed:", e);
      }
    }

    if (Platform.OS !== "web") {
      try {
        if (SecureStore.deleteItemAsync) {
          await SecureStore.deleteItemAsync(this.tokenKey);
          console.log("[ApiClient.clearToken] ✅ Removed from SecureStore");
        }
      } catch (e) {
        console.warn("[ApiClient.clearToken] SecureStore remove failed:", e);
      }
    }
  }
}

export const apiClient = new ApiClient();
