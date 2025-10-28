// utils/mentions.ts
export function buildMentionDirectory(channel: any) {
  const toHandle = (s: string) =>
    "@" +
    s
      .toLowerCase()
      .replace(/[^\w]+/g, "_")
      .replace(/^_+|_+$/g, "");
  return (channel?.members ?? []).map((m: any) => ({
    id: m._id,
    name: m.name || "Member",
    handle: m.handle || toHandle(m.name || String(m._id).slice(-6)),
  }));
}
