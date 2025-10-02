export function slugifyFilename(name?: string | null): string {
  if (!name) return `file_${Date.now()}`;
  const dot = name.lastIndexOf(".");
  const base = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot).toLowerCase() : "";
  const cleanBase = base
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9-_]/g, "")
    .toLowerCase();
  return (cleanBase || `file_${Date.now()}`) + ext;
}

export function normalizeCloudinaryUrl(u: string): string {
  try {
    if (u.includes("%25")) {
      return decodeURIComponent(u);
    }
    return u;
  } catch {
    return u;
  }
}
