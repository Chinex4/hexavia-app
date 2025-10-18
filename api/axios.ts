import axios, { AxiosError, AxiosRequestConfig } from "axios";
import type { Store } from "@reduxjs/toolkit";
import { ENV } from "@/config/env";
import { getToken, clearToken, clearUser } from "@/storage/auth";
import type { RootState } from "@/store";
import { logout } from "@/redux/auth/auth.slice";
import { showError } from "@/components/ui/toast";

declare module "axios" {
  interface AxiosRequestConfig {
    __retryCount?: number;
  }
}

export const api = axios.create({
  baseURL: ENV.API_BASE_URL,
  timeout: ENV.REQUEST_TIMEOUT_MS,
  headers: { "Content-Type": "application/json", Accept: "application/json" },
});

let _store: Store<RootState> | null = null;
export const attachStore = (store: Store<RootState>) => {
  _store = store;
};

api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

api.interceptors.response.use(
  (res) => res,
  async (err: AxiosError<any>) => {
    const { response, config } = err || {};
    const status = response?.status;

    if (status === 407) {
      await clearToken();
      await clearUser();
      _store?.dispatch(logout());
      showError("Session expired. Please log in again.");
      return Promise.reject(err);
    }

    // Show server error message if present
    const serverMessage =
      (response?.data as any)?.message ||
      (response?.data as any)?.error ||
      err.message;
    if (serverMessage && status && status !== 429 && status !== 503) {
      showError(serverMessage);
    }

    if (config) {
      const method = (config.method || "get").toLowerCase();
      const isIdempotent = ["get", "head", "options"].includes(method);
      const retriable =
        isIdempotent && response && [429, 503].includes(status!);

      if (retriable) {
        config.__retryCount = (config.__retryCount || 0) + 1;
        const maxRetries = 3;
        if (config.__retryCount <= maxRetries) {
          const retryAfterHdr = response?.headers?.["retry-after"];
          const retryAfterMs = retryAfterHdr
            ? parseFloat(String(retryAfterHdr)) * 1000
            : 0;
          const base = 500 * Math.pow(2, config.__retryCount - 1); // 500, 1000, 2000
          const jitter = Math.floor(Math.random() * 250);
          const delay = Math.max(retryAfterMs, base + jitter);
          await sleep(delay);
          return api(config);
        }
      }
    }

    return Promise.reject(err);
  }
);
