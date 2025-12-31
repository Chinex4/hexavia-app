import type { User } from "@/api/types";

export type AuthPhase =
  | "idle"
  | "loading"
  | "awaiting_otp"
  | "onboarding"
  | "authenticated"
  | "password_reset_pending";

export type AuthState = {
  user: User | null;
  token: string | null;
  phase: AuthPhase;
  error: string | null;
  lastEmailForOtp: string | null;
  hydrated: boolean;
  pushToken: string | null;
};
