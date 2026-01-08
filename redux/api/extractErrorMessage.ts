import type { AxiosError } from "axios";

export function extractErrorMessage(err: unknown): string {
  const ax = err as AxiosError<any>;
  const data = ax?.response?.data as any;
  const status = ax?.response?.status;
  const retryAfter = data?.retryAfter;
  const firstArrayError =
    Array.isArray(data?.errors) && data.errors.length
      ? data.errors[0]?.msg || data.errors[0]
      : null;

  if (!ax?.response) {
    return "Network error. Please check your connection and try again.";
  }

  const statusMessage = (() => {
    switch (status) {
      case 400:
        return "Request failed. Please check your input.";
      case 401:
        return "You are not authorized. Please log in again.";
      case 403:
        return "You do not have permission to perform this action.";
      case 404:
        return "The requested resource was not found.";
      case 409:
        return "This request conflicts with existing data.";
      case 422:
        return "Validation failed. Please review your input.";
      case 429:
        return "Too many requests. Please try again shortly.";
      case 500:
        return "Server error. Please try again later.";
      case 503:
        return "Service unavailable. Please try again later.";
      default:
        return "Something went wrong. Please try again.";
    }
  })();

  const base =
    data?.message ||
    data?.error ||
    firstArrayError ||
    ax?.message ||
    statusMessage;

  if (ax?.response?.status === 429 && retryAfter) {
    return `${base} (Retry after: ${retryAfter})`;
  }

  if (base?.toLowerCase?.().startsWith("request failed with status code")) {
    return statusMessage;
  }

  return base || statusMessage;
}
