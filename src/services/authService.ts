import { apiClient } from "./apiClient";

export interface User {
  id: string;
  email: string;
  name: string;
  profilePhoto?: string | null;
  avatarId?: string | null;
  // /auth/me returns this lowercased (e.g. "basic_user"), not the raw enum.
  role: "basic_user" | "admin" | "super_admin" | string;
  status?: string;
  contactNumber?: string | null;
  // Only ever populated for BASIC_USER — admins have no address column.
  address?: string | null;
  createdAt?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignUpData {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  refreshToken?: string;
  needPasswordChange?: boolean;
  user: User;
}

export interface SignUpResponse {
  message: string;
  pending?: boolean;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  id: string;
  token: string;
  password: string;
}

class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(
      "/auth/login",
      credentials,
    );

    if (response.token) {
      await apiClient.setToken(response.token, response.refreshToken);
    }

    return response;
  }

  // Registration never returns a session token — the account is created as
  // PENDING and must be email-verified before it can log in, so this must
  // not call apiClient.setToken().
  async signUp(data: SignUpData): Promise<SignUpResponse> {
    const formData = new FormData();
    formData.append(
      "data",
      JSON.stringify({
        password: data.password,
        basicUser: { email: data.email, name: data.name },
      }),
    );

    // apiClient's request interceptor detects this FormData body and strips
    // the default JSON Content-Type so the correct multipart boundary gets
    // set automatically (by the browser on web, by RN's networking layer
    // natively) — a manually-set header here can't provide that boundary.
    return apiClient.post<SignUpResponse>("/user/register-basicUser", formData);
  }

  async logout(): Promise<void> {
    try {
      await apiClient.post("/auth/logout", {});
    } finally {
      await apiClient.clearToken();
    }
  }

  async getCurrentUser(): Promise<User> {
    return apiClient.get<User>("/auth/me");
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await apiClient.getToken();
    return !!token;
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    return apiClient.get<{ message: string }>("/auth/verify-email", {
      params: { token },
    });
  }

  async resendVerification(email: string): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>("/auth/resend-verification", {
      email,
    });
  }

  async forgotPassword(data: ForgotPasswordData): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>("/auth/forgot-password", data);
  }

  async resetPassword(data: ResetPasswordData): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>("/auth/reset-password", data);
  }
}

export const authService = new AuthService();
