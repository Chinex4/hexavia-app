export const ENV = {
  API_BASE_URL:
    process.env.EXPO_PUBLIC_API_BASE_URL?.trim() ||
    "https://hexavia.cloud/api",
  REQUEST_TIMEOUT_MS: 555_000,
  EXPO_PUBLIC_OPENAI_API_KEY:
    process.env.EXPO_PUBLIC_OPENAI_API_KEY?.trim() || "",
};
