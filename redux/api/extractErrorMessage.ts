import type { AxiosError } from "axios";

export function extractErrorMessage(err: unknown): string {
  const ax = err as AxiosError<any>;
  const data = ax?.response?.data as any;
  const retryAfter = data?.retryAfter;
  const firstArrayError =
    Array.isArray(data?.errors) && data.errors.length
      ? data.errors[0]?.msg || data.errors[0]
      : null;

  const base =
    data?.message ||
    data?.error ||
    firstArrayError ||
    ax?.message ||
    "Something went wrong. Please try again.";

  if (ax?.response?.status === 429 && retryAfter) {
    return `${base} (Retry after: ${retryAfter})`;
  }

  return base;
}
