import axios, { AxiosError } from "axios";
import { ENV } from "@/config/env";
import { getToken, clearToken, clearUser } from "@/storage/auth";
import type { RootStore } from "@/store";
import { logout } from "@/redux/auth/auth.slice";
import { showError } from "@/components/ui/toast";

export const api = axios.create({
  baseURL: ENV.API_BASE_URL,
  timeout: ENV.REQUEST_TIMEOUT_MS,
  headers: { "Content-Type": "application/json", Accept: "application/json" },
});

let _store: RootStore | null = null;
export const attachStore = (store: RootStore) => {
  _store = store;
};

api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  // console.log("[request]", {
  //   method: config.method,
  //   url: config.url,
  //   params: config.params,
  //   headers: { Authorization: config.headers?.Authorization },
  // });
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err: AxiosError<any>) => {
    const status = err.response?.status;

    const serverMessage =
      (err.response?.data as any)?.message ||
      (err.response?.data as any)?.error ||
      err.message;

    // if (status === 401) {
    if (status === 407) {
      await clearToken();
      await clearUser();
      _store?.dispatch(logout());
      showError("Session expired. Please log in again.");
    } else {
      if (serverMessage) showError(serverMessage);
    }
    return Promise.reject(err);
  }
);
