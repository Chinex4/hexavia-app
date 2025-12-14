import { api } from "@/api/axios";
import type { ApiEnvelope, User } from "@/api/types";
import { showError, showPromise, showSuccess } from "@/components/ui/toast";
import { getToken, saveToken, saveUser } from "@/storage/auth";
import { RootState } from "@/store";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { setUser } from "../user/user.slice";
import { setLastEmail, setPhase, setSession } from "./auth.slice";
import { getExpoPushToken } from "@/utils/pushToken";
import { setPushToken } from "./auth.slice";

type RegisterArgs = {
  fullname: string;
  email: string;
  username: string;
  phoneNumber?: string;
};

export const register = createAsyncThunk<
  void,
  RegisterArgs,
  { state: RootState; rejectValue: string }
>("auth/register", async (body, { dispatch, rejectWithValue, getState }) => {
  try {
    // 1) Try to get token from state
    let expoPushToken = getState().auth.pushToken;

    // 2) Fallback: try to fetch a fresh token if none
    if (!expoPushToken) {
      try {
        const tok = await getExpoPushToken();
        if (tok) {
          expoPushToken = tok;
          dispatch(setPushToken(tok));
        }
      } catch (e) {
        // Don’t block signup because of push token
        expoPushToken = null;
      }
    }

    const payload: any = {
      username: body.username,
      email: body.email.trim().toLowerCase(),
      fullname: body.fullname,
      expoPushToken: expoPushToken ?? 'hexavia-default-token',
    };

    // IMPORTANT: only add the field if we actually have a token
    // if (expoPushToken) {
    //   // Match your backend field name here
    //   payload.expoPushToken = expoPushToken;
    //   // or payload.expo_push_token = expoPushToken;
    // }

    const res = await showPromise(
      api.post<ApiEnvelope>("/auth/register", payload),
      "Creating account…",
      "OTP sent to your email"
    );

    dispatch(setLastEmail(body.email));
    dispatch(setPhase("awaiting_otp"));
  } catch (err: any) {
    const msg =
      err?.response?.data?.errors?.[0]?.msg ||
      err?.response?.data?.message ||
      (err?.response?.status === 400
        ? "Email or Username already exists."
        : err?.message || "Something went wrong.");
    showError(msg);
    return rejectWithValue(msg);
  }
});

type LoginResult = { user: any; token: string | null };
type LoginArgs = { email: string; password: string };

export const login = createAsyncThunk<
  LoginResult,
  LoginArgs,
  { state: RootState; rejectValue: string }
>("auth/login", async (body, { dispatch, rejectWithValue, getState }) => {
  try {
    let expoPushToken = getState().auth.pushToken;

    if (!expoPushToken) {
      try {
        const tok = await getExpoPushToken();
        if (tok) {
          expoPushToken = tok;
          dispatch(setPushToken(tok));
        }
      } catch (e) {
        expoPushToken = null;
      }
    }

    const payload: any = {
      email: body.email.trim().toLowerCase(),
      password: body.password,
    };

    if (expoPushToken) {
      // Again, match your backend naming
      payload.expoPushToken = expoPushToken;
    }

    const res = await showPromise(
      api.post<ApiEnvelope>("/auth/login", payload),
      "Logging in…",
      "Welcome back!"
    );

    const user = (res.data as any).user;
    const token = (res.data as any).token ?? null;

    dispatch(setLastEmail(body.email));
    dispatch(setPhase("authenticated"));
    dispatch(setUser(user));
    if (token) await saveToken(token);
    if (user) await saveUser(user);
    dispatch(setSession({ user, token }));

    return { user, token };
  } catch (err: any) {
    const msg =
      err?.response?.data?.errors?.[0]?.msg ||
      err?.response?.data?.message ||
      (err?.response?.status === 400
        ? "Invalid Credentialss."
        : err?.message || "Something went wrong.");
    showError(msg);
    return rejectWithValue(msg);
  }
});

export const verifyEmail = createAsyncThunk(
  "auth/verifyEmail",
  async (
    body: { email: string; otp: string },
    { dispatch, rejectWithValue }
  ) => {
    try {
      const res = await showPromise(
        api.post<ApiEnvelope<{ user: User }>>("/auth/verify-email", body),
        "Verifying…",
        "Email verified"
      );

      // Backend sometimes nests token/user under `data`
      const token =
        (res.data as any)?.token ??
        (res.data as any)?.accessToken ??
        (res.data as any)?.data?.token ??
        (res.data as any)?.data?.accessToken ??
        null;
      const user =
        (res.data as any)?.user ??
        (res.data as any)?.data?.user ??
        null;

      if (token) await saveToken(token);
      if (user) await saveUser(user);

      dispatch(setSession({ user, token: token ?? null }));
      dispatch(setPhase("onboarding"));
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        (err?.response?.status === 400
          ? "Invalid or expired OTP"
          : "Verification failed");

      showError(msg);
      return rejectWithValue(msg);
    }
  }
);

export const resendRegisterOtp = createAsyncThunk(
  "auth/resendRegisterOtp",
  async (email: string) => {
    await showPromise(
      api.post<ApiEnvelope>("/auth/resend-otp", { email }),
      "Sending OTP…",
      "OTP resent"
    );
  }
);

export const joinChannel = createAsyncThunk(
  "auth/joinChannel",
  async (
    body: { channelCode: string; password: string; phoneNumber?: string },
    { dispatch, rejectWithValue }
  ) => {
    try {
      const res = await showPromise(
        api.post<ApiEnvelope<{ channelId: string; channelName: string }>>(
          "/users/registration/join-channel",
          {
            channelCode: body.channelCode.trim(),
            password: body.password,
            phoneNumber: body.phoneNumber,
          }
        ),
        "Finalizing account…",
        "Channel joined and password set"
      );
      dispatch(setPhase("authenticated"));

      return res.data;
    } catch (err: any) {
      const msg =
        err?.response?.message ||
        err?.response?.data?.message ||
        (err?.response?.status === 400
          ? "Invalid Project Code"
          : "Could not join channel");

      showError(msg);
      return rejectWithValue(msg);
    }
  }
);

export const forgotPassword = createAsyncThunk(
  "auth/forgotPassword",
  async (body: { email: string }, { dispatch, rejectWithValue }) => {
    try {
      const res = await showPromise(
        api.post<ApiEnvelope<{ user: User }>>("/auth/forgot-password", body),
        "Verifying…",
        "OTP sent to your email. Purpose is to reset password."
      );

      // Keep the real email around so subsequent OTP + reset steps
      // can use the unmasked value instead of the masked display string.
      dispatch(setLastEmail(body.email));
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.errors?.[0]?.msg ||
        (err?.response?.status === 404
          ? "Email does not exist"
          : "Verification failed");

      showError(msg);
      return rejectWithValue(msg);
    }
  }
);

export const resetPassword = createAsyncThunk(
  "auth/resetPassword",
  async (
    body: { email: string; newPassword: string; otp: string },
    { dispatch, rejectWithValue }
  ) => {
    try {
      const res = await showPromise(
        api.post<ApiEnvelope<{ user: User }>>("/auth/reset-password", body),
        "Verifying…",
        "Password Successfully Update, Proceed to login."
      );
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.errors?.[0]?.msg ||
        (err?.response?.status === 400 || 404
          ? "Invalid or expired OTP"
          : "Verification failed");

      showError(msg);
      return rejectWithValue(msg);
    }
  }
);
