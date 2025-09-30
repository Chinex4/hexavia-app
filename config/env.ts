export const ENV = {
  API_BASE_URL:
    process.env.EXPO_PUBLIC_API_BASE_URL?.trim() ||
    "https://hexavia.onrender.com/api",
  REQUEST_TIMEOUT_MS: 555_000,
};
