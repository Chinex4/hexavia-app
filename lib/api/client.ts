import axios from "axios";

export const api = axios.create({
  baseURL: "https://example.com/api", // TODO: replace later
  timeout: 15000,
});

// Optional: attach auth token when you add real backend
api.interceptors.request.use(async (config) => {
  // const token = await AsyncStorage.getItem("access_token");
  // if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
