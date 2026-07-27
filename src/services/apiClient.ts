import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from "axios";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { router } from "expo-router";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://localhost:5001/api/v1";

const getLocalStorage = () => {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("__test__", "1");
      localStorage.removeItem("__test__");
      return localStorage;
    }
  } catch {
    // localStorage unavailable (native runtime) — SecureStore is used instead.
  }
  return null;
};

const hasLocalStorage = getLocalStorage() !== null;

class ApiClient {
  private client: AxiosInstance;
  private tokenKey = "auth_token";
  private refreshTokenKey = "auth_refresh_token";
  private memoryToken: string | null = null;
  private memoryRefreshToken: string | null = null;
  private refreshInFlight: Promise<string | null> | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 15000,
      headers: { "Content-Type": "application/json" },
    });

    this.client.interceptors.request.use(async (config) => {
      const token = await this.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // The instance-level default Content-Type (application/json, set
      // above) otherwise survives even when a caller passes a FormData
      // body with `headers: { "Content-Type": undefined }` — axios/browser
      // fetch only auto-generates the correct multipart boundary if the
      // header is genuinely absent, not merely set to undefined in some
      // axios versions. Deleting it here, centrally, is the reliable fix
      // for every multipart call (profile photo/avatar updates, etc.)
      // instead of depending on each call site getting a fragile override
      // right.
      if (typeof FormData !== "undefined" && config.data instanceof FormData) {
        delete config.headers["Content-Type"];
      }

      return config;
    });

    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as
          | (AxiosRequestConfig & { _retry?: boolean })
          | undefined;

        if (
          error.response?.status === 401 &&
          originalRequest &&
          !originalRequest._retry &&
          !originalRequest.url?.includes("/auth/refresh-token") &&
          !originalRequest.url?.includes("/auth/login")
        ) {
          // A 401 with no token to begin with just means "not logged in" —
          // many public screens (vocabulary, home, radio) make optional,
          // best-effort authenticated calls (e.g. "load my favorites if
          // I'm signed in") that are expected to 401 for guests. Only a
          // 401 on a request that WAS carrying a token means the session
          // actually expired and warrants clearing it + forcing a login.
          const hadToken = await this.getToken();
          if (!hadToken) {
            return Promise.reject(error);
          }

          originalRequest._retry = true;
          const newToken = await this.refreshAccessToken();

          if (newToken) {
            originalRequest.headers = {
              ...originalRequest.headers,
              Authorization: `Bearer ${newToken}`,
            };
            return this.client.request(originalRequest);
          }

          await this.clearToken();
          router.replace("/(auth)/login");
        }

        return Promise.reject(error);
      },
    );
  }

  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<{ data: T }>(url, config);
    return response.data.data;
  }

  // A handful of legacy endpoints (e.g. /part-of-speech) respond with the
  // raw payload instead of the standard { success, message, data } envelope
  // every other route uses — this skips the .data unwrap for those.
  async getRaw<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
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

  private async refreshAccessToken(): Promise<string | null> {
    if (this.refreshInFlight) {
      return this.refreshInFlight;
    }

    this.refreshInFlight = (async () => {
      try {
        const refreshToken = await this.getRefreshToken();
        if (!refreshToken) return null;

        const response = await axios.post<{
          data: { accessToken?: string; token?: string };
        }>(`${API_BASE_URL}/auth/refresh-token`, { refreshToken });

        const newToken =
          response.data?.data?.accessToken || response.data?.data?.token || null;

        if (newToken) {
          await this.setToken(newToken);
        }

        return newToken;
      } catch {
        return null;
      } finally {
        this.refreshInFlight = null;
      }
    })();

    return this.refreshInFlight;
  }

  async setToken(token: string, refreshToken?: string): Promise<void> {
    this.memoryToken = token;

    if (hasLocalStorage) {
      try {
        localStorage.setItem(this.tokenKey, token);
      } catch {
        // ignore — memory token still set
      }
    }

    if (Platform.OS !== "web") {
      try {
        await SecureStore.setItemAsync(this.tokenKey, token);
      } catch {
        // ignore — memory token still set
      }
    }

    if (refreshToken) {
      await this.setRefreshToken(refreshToken);
    }
  }

  private async setRefreshToken(refreshToken: string): Promise<void> {
    this.memoryRefreshToken = refreshToken;

    if (hasLocalStorage) {
      try {
        localStorage.setItem(this.refreshTokenKey, refreshToken);
      } catch {
        // ignore
      }
    }

    if (Platform.OS !== "web") {
      try {
        await SecureStore.setItemAsync(this.refreshTokenKey, refreshToken);
      } catch {
        // ignore
      }
    }
  }

  async getToken(): Promise<string | null> {
    if (this.memoryToken) return this.memoryToken;

    if (hasLocalStorage) {
      try {
        const token = localStorage.getItem(this.tokenKey);
        if (token) {
          this.memoryToken = token;
          return token;
        }
      } catch {
        // fall through to SecureStore
      }
    }

    if (Platform.OS !== "web") {
      try {
        const token = await SecureStore.getItemAsync(this.tokenKey);
        if (token) {
          this.memoryToken = token;
          return token;
        }
      } catch {
        // no token available
      }
    }

    return this.memoryToken;
  }

  private async getRefreshToken(): Promise<string | null> {
    if (this.memoryRefreshToken) return this.memoryRefreshToken;

    if (hasLocalStorage) {
      try {
        const token = localStorage.getItem(this.refreshTokenKey);
        if (token) {
          this.memoryRefreshToken = token;
          return token;
        }
      } catch {
        // fall through to SecureStore
      }
    }

    if (Platform.OS !== "web") {
      try {
        const token = await SecureStore.getItemAsync(this.refreshTokenKey);
        if (token) {
          this.memoryRefreshToken = token;
          return token;
        }
      } catch {
        // no refresh token available
      }
    }

    return this.memoryRefreshToken;
  }

  async clearToken(): Promise<void> {
    this.memoryToken = null;
    this.memoryRefreshToken = null;

    if (hasLocalStorage) {
      try {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.refreshTokenKey);
      } catch {
        // ignore
      }
    }

    if (Platform.OS !== "web") {
      try {
        await SecureStore.deleteItemAsync(this.tokenKey);
        await SecureStore.deleteItemAsync(this.refreshTokenKey);
      } catch {
        // ignore
      }
    }
  }
}

export const apiClient = new ApiClient();
