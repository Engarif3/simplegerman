import { apiClient } from "./apiClient";

export interface User {
  id: string;
  email: string;
  name: string;
  profileImage?: string;
  role: "USER" | "PREMIUM" | "SUPER_ADMIN";
  createdAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignUpData extends LoginCredentials {
  name: string;
}

export interface AuthResponse {
  token: string;
  refreshToken?: string;
  needPasswordChange?: boolean;
  user: User;
}

class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    console.log(
      "[authService.login] Starting login with email:",
      credentials.email,
    );
    const response = await apiClient.post<AuthResponse>(
      "/auth/login",
      credentials,
    );

    console.log("[authService.login] Login response:", response);
    console.log("[authService.login] Response.token exists:", !!response.token);
    console.log(
      "[authService.login] Full response structure:",
      JSON.stringify(response, null, 2),
    );

    if (response.token) {
      console.log(
        "[authService.login] Saving token:",
        response.token.substring(0, 20) + "...",
      );
      await apiClient.setToken(response.token);
      console.log("[authService.login] ✅ Token saved successfully");
    } else {
      console.warn("[authService.login] ❌ No token in response!");
    }

    return response;
  }

  async signUp(data: SignUpData): Promise<AuthResponse> {
    console.log("[authService.signUp] Starting signup with email:", data.email);
    const response = await apiClient.post<AuthResponse>("/auth/signup", data);

    console.log("[authService.signUp] SignUp response:", response);
    console.log(
      "[authService.signUp] Response.token exists:",
      !!response.token,
    );

    if (response.token) {
      console.log(
        "[authService.signUp] Saving token:",
        response.token.substring(0, 20) + "...",
      );
      await apiClient.setToken(response.token);
      console.log("[authService.signUp] ✅ Token saved successfully");
    } else {
      console.warn("[authService.signUp] ❌ No token in response!");
    }

    return response;
  }

  async logout(): Promise<void> {
    try {
      await apiClient.post("/auth/logout", {});
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      await apiClient.clearToken();
    }
  }

  async getCurrentUser(): Promise<User> {
    return apiClient.get<User>("/auth/me");
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await apiClient.getToken();
    console.log("[authService.isAuthenticated] Token check:", {
      hasToken: !!token,
      tokenPreview: token ? `${token.substring(0, 20)}...` : "NO TOKEN",
    });
    return !!token;
  }
}

export const authService = new AuthService();
