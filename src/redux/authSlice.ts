import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import {
  authService,
  User,
  LoginCredentials,
  SignUpData,
} from "../services/authService";

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
  needPasswordChange?: boolean;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

export const login = createAsyncThunk<
  AuthResponse,
  LoginCredentials,
  { rejectValue: string }
>("auth/login", async (credentials: LoginCredentials, { rejectWithValue }) => {
  try {
    const response = await authService.login(credentials);
    return response;
  } catch (error: any) {
    return rejectWithValue(error.message || "Login failed");
  }
});

export const signUp = createAsyncThunk<
  AuthResponse,
  SignUpData,
  { rejectValue: string }
>("auth/signUp", async (data: SignUpData, { rejectWithValue }) => {
  try {
    const response = await authService.signUp(data);
    return response;
  } catch (error: any) {
    return rejectWithValue(error.message || "Sign up failed");
  }
});

export const logout = createAsyncThunk<null, void, { rejectValue: string }>(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      await authService.logout();
      return null;
    } catch (error: any) {
      return rejectWithValue(error.message || "Logout failed");
    }
  },
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(login.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(
      login.fulfilled,
      (state, action: PayloadAction<AuthResponse>) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      },
    );
    builder.addCase(login.rejected, (state, action) => {
      state.isLoading = false;
      state.error = (action.payload as string) || "Login failed";
      state.isAuthenticated = false;
    });

    builder.addCase(signUp.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(
      signUp.fulfilled,
      (state, action: PayloadAction<AuthResponse>) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      },
    );
    builder.addCase(signUp.rejected, (state, action) => {
      state.isLoading = false;
      state.error = (action.payload as string) || "Sign up failed";
      state.isAuthenticated = false;
    });

    builder.addCase(logout.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(logout.fulfilled, (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      state.isLoading = false;
    });
    builder.addCase(logout.rejected, (state, action) => {
      state.isLoading = false;
      state.error = (action.payload as string) || "Logout failed";
    });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
