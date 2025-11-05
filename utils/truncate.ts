export function truncateWords(
  input: unknown,
  limit = 10,
  suffix = "…"
): string {
  const text = String(input ?? "").trim();
  if (!text) return "";

  const words = text.split(/\s+/);
  if (words.length <= limit) return text;

  return words.slice(0, limit).join(" ") + suffix;
}
