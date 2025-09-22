import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { AuthState, AuthPhase } from "./auth.types";
import { getUser, getToken } from "@/storage/auth";
import { AppDispatch } from "@/store";

const initialState: AuthState = {
  user: null,
  token: null,
  phase: "idle",
  error: null,
  lastEmailForOtp: null,
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
      state.phase = "authenticated";
      state.error = null;
    },
    clearSession(state) {
      state.user = null;
      state.token = null;
      state.phase = "idle";
      state.error = null;
      state.lastEmailForOtp = null;
    },
  },
});

export const { setPhase, setError, setLastEmail, setSession, clearSession } =
  slice.actions;

export const bootstrapSession = () => {
  return (async (dispatch: AppDispatch) => {
    const [u, t] = await Promise.all([getUser<any>(), getToken()]);
    if (u && t) {
      dispatch(setSession({ user: u, token: t }));
    }
  }) as any;
};

export const logout = () => clearSession();

export default slice.reducer;
