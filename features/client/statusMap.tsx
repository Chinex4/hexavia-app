export type StatusKey =
  | "in_progress"
  | "completed"
  | "not_started"
  | "canceled";

export const toApiStatus = (s?: string | null) => {
  if (!s) return undefined;
  const v = s.toLowerCase().replace(/_/g, "-");
  if (v === "in-progress") return "in-progress";
  if (v === "not-started") return "not-started";
  if (v === "completed") return "completed";
  if (v === "canceled" || v === "cancelled") return "canceled";
  return v;
};

export const fromApiStatus = (s?: string | null): StatusKey => {
  const v = (s ?? "").toLowerCase().replace(/_/g, "-");
  if (v === "in-progress") return "in_progress";
  if (v === "not-started" || v === "pending" || v === "todo")
    return "not_started";
  if (v === "completed" || v === "done") return "completed";
  if (v === "canceled" || v === "cancelled") return "canceled";
  return "in_progress";
};
