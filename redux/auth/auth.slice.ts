import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { AuthState, AuthPhase } from "./auth.types";
import { getUser, getToken } from "@/storage/auth";
import { AppDispatch, RootState } from "@/store";
import { fetchProfile } from "../user/user.thunks";

const initialState: AuthState = {
  user: null,
  token: null,
  phase: "loading",
  error: null,
  lastEmailForOtp: null,
  hydrated: false
};

const slice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setPhase(state, action: PayloadAction<AuthPhase>) {
      state.phase = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
    setLastEmail(state, action: PayloadAction<string | null>) {
      state.lastEmailForOtp = action.payload;
    },
    setSession(
      state,
      action: PayloadAction<{ user: any; token: string | null }>
    ) {
      state.user = action.payload.user;
      state.token = action.payload.token ?? state.token;
      state.phase = action.payload.user || action.payload.token ? "authenticated" : "idle";
      state.error = null;
    },
    clearSession(state) {
      state.user = null;
      state.token = null;
      state.phase = "idle";
      state.error = null;
      state.lastEmailForOtp = null;
    },
    setHydrated(state, action: PayloadAction<boolean>) {
      state.hydrated = action.payload;
      // if we had nothing, phase should be idle (unauth)
      if (!state.user && !state.token && state.phase === "loading") {
        state.phase = "idle";
      }
    },
  },
});

export const { setPhase, setError, setLastEmail, setSession, clearSession, setHydrated } =
  slice.actions;

export const bootstrapSession = () => {
  return (async (dispatch: AppDispatch) => {
    try {
      const [u, t] = await Promise.all([getUser<any>(), getToken()]);
      dispatch(setSession({ user: u ?? null, token: t ?? null }));
    } finally {
      dispatch(setHydrated(true));
    }
  }) as any;
};

export const ensureProfile = () => {
  return (async (dispatch: AppDispatch, getState: () => RootState) => {
    const { auth } = getState();
    if (auth.token && !auth.user) {
      dispatch(setPhase("loading"));
      try {
        const user = await dispatch(fetchProfile()).unwrap();
        dispatch(setSession({ user, token: auth.token }));
      } catch (e) {
        // token might be bad; fall back to unauth
        dispatch(clearSession());
      }
    }
  }) as any;
};

export const logout = () => clearSession();

export default slice.reducer;
