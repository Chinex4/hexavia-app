// utils/handles.ts
export type Mentionable = {
  id: string;
  name: string;
  avatar?: string;
  handle: string;
};

export function toHandle(base: string) {
  return base
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._\s-]/g, "")
    .replace(/\s+/g, " ") // collapse spaces
    .replace(/\s/g, ""); // remove spaces => "john.doe" stays, "John Doe" -> "johndoe"
}

export function buildMentionables(
  members: Array<{
    _id: string;
    name?: string;
    fullName?: string;
    displayName?: string;
    avatar?: string;
  }>,
  meId?: string
): Mentionable[] {
  const raw =
    members
      ?.filter((m) => m?._id && m._id !== meId)
      .map((m) => {
        const name = m.displayName || m.fullName || m.name || "User";
        return { id: m._id, name, avatar: m.avatar, handle: toHandle(name) };
      }) ?? [];

  // ensure uniqueness of handles
  const seen: Record<string, number> = {};
  return raw.map((m) => {
    const base = m.handle || "user";
    if (!(base in seen)) {
      seen[base] = 0;
      return { ...m, handle: base };
    }
    seen[base] += 1;
    return { ...m, handle: `${base}${seen[base]}` };
  });
}
