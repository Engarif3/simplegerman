import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import {
  authService,
  User,
  LoginCredentials,
  SignUpData,
  AuthResponse,
  SignUpResponse,
} from "../services/authService";

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  registrationMessage: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  registrationMessage: null,
};

export const login = createAsyncThunk<
  AuthResponse,
  LoginCredentials,
  { rejectValue: string }
>("auth/login", async (credentials, { rejectWithValue }) => {
  try {
    return await authService.login(credentials);
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || error.message || "Login failed",
    );
  }
});

// Registration never authenticates the caller — the new account is PENDING
// until the user verifies their email — so this only surfaces a message,
// it does not populate `user`/`token`/`isAuthenticated`.
export const signUp = createAsyncThunk<
  SignUpResponse,
  SignUpData,
  { rejectValue: string }
>("auth/signUp", async (data, { rejectWithValue }) => {
  try {
    return await authService.signUp(data);
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || error.message || "Sign up failed",
    );
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

export const restoreSession = createAsyncThunk<User | null, void>(
  "auth/restoreSession",
  async () => {
    const hasToken = await authService.isAuthenticated();
    if (!hasToken) return null;

    try {
      const user = await authService.getCurrentUser();
      console.log("[restoreSession] GET /auth/me returned:", user);
      return user;
    } catch (error: any) {
      console.log("[restoreSession] GET /auth/me failed:", {
        status: error?.response?.status,
        data: error?.response?.data,
        message: error?.message,
      });
      return null;
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
    clearRegistrationMessage: (state) => {
      state.registrationMessage = null;
    },
    // Applies a profile-update response directly instead of a second
    // round-trip through restoreSession()/GET /auth/me — one less place
    // for the freshly-saved fields to go missing or race.
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
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
      state.error = action.payload || "Login failed";
      state.isAuthenticated = false;
    });

    builder.addCase(signUp.pending, (state) => {
      state.isLoading = true;
      state.error = null;
      state.registrationMessage = null;
    });
    builder.addCase(
      signUp.fulfilled,
      (state, action: PayloadAction<SignUpResponse>) => {
        state.isLoading = false;
        state.registrationMessage = action.payload.message;
      },
    );
    builder.addCase(signUp.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload || "Sign up failed";
    });

    builder.addCase(logout.fulfilled, (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      state.isLoading = false;
    });

    builder.addCase(restoreSession.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(
      restoreSession.fulfilled,
      (state, action: PayloadAction<User | null>) => {
        state.isLoading = false;
        if (action.payload) {
          state.user = action.payload;
          state.isAuthenticated = true;
        } else {
          state.user = null;
          state.isAuthenticated = false;
        }
      },
    );
    builder.addCase(restoreSession.rejected, (state) => {
      state.isLoading = false;
      state.isAuthenticated = false;
    });
  },
});

export const { clearError, clearRegistrationMessage, setUser } = authSlice.actions;
export default authSlice.reducer;
