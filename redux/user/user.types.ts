import type { User } from "@/api/types";

export type UserPhase = "idle" | "loading" | "authenticated";

export type UserState = {
  user: User | null;
  token: string | null;
  phase: UserPhase;
  error: string | null;
  lastEmailForOtp: string | null;
};
