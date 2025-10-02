import { createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "@/api/axios";
import { saveToken, saveUser, clearToken, clearUser } from "@/storage/auth";
import { setPhase, setLastEmail, setSession } from "./auth.slice";
import { showError, showPromise, showSuccess } from "@/components/ui/toast";
import type { ApiEnvelope, User } from "@/api/types";
import { setUser } from "../user/user.slice";

/** --------- Registration (Step 1) --------- */
export const register = createAsyncThunk(
  "auth/register",
  async (
    body: {
      fullname: string;
      email: string;
      username: string;
      role?: "client" | "staff";
      phoneNumber?: string;
    },
    { dispatch, rejectWithValue }
  ) => {
    try {
      const payload = {
        username: body.username,
        email: body.email.trim().toLowerCase(),
        fullname: body.fullname,
        role: body.role ?? "client",
        // ...(body.phoneNumber ? { phoneNumber: body.phoneNumber } : {}),
      };

      const res = await showPromise(
        api.post<ApiEnvelope>("/auth/register", payload),
        "Creating account…",
        "OTP sent to your email"
      );

      dispatch(setLastEmail(body.email));
      dispatch(setPhase("awaiting_otp"));
      showSuccess(`OTP code is ${res.data.otp}`);
      console.log(res.data);
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
  }
);

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

      const token = (res.data.token ?? null) as string | null;
      const user =
        (res.data.user as any) || ((res.data.data as any)?.user ?? null);

      if (token) await saveToken(token);
      if (user) await saveUser(user);

      dispatch(setSession({ user, token: token ?? null }));
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
    { rejectWithValue }
  ) => {
    try {
      const res = await showPromise(
        api.post<ApiEnvelope<{ channelId: string; channelName: string }>>(
          "/users/registration/join-channel",
          { channelCode: body.channelCode.trim(), password: body.password }
        ),
        "Finalizing account…",
        "Channel joined and password set"
      );
      return res.data;
    } catch (err: any) {
      const msg =
        err?.response?.message ||
        err?.response?.data?.message ||
        (err?.response?.status === 400
          ? "Invalid channel code"
          : "Could not join channel");

      showError(msg);
      return rejectWithValue(msg);
    }
  }
);

export const login = createAsyncThunk(
  "auth/login",
  async (
    body: {
      email: string;
      password: string;
    },
    { dispatch, rejectWithValue }
  ) => {
    try {
      const payload = {
        email: body.email.trim().toLowerCase(),
        password: body.password,
      };

      const res = await showPromise(
        api.post<ApiEnvelope>("/auth/login", payload),
        "Logging in…",
        "Welcome back!"
      );

      dispatch(setLastEmail(body.email));
      dispatch(setPhase("authenticated"));
      dispatch(setUser(res.data.user as any));
      await saveToken(res.data.token as any);
      await saveUser(res.data.user as any);
      dispatch(
        setSession({ user: res.data.user as any, token: res.data.token as any })
      );
      return { user: res.data.user, token: res.data.token };
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
