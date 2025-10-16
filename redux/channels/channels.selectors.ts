import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "@/store";
import { Channel } from "./channels.types";

export const normalizeCode = (s: string | null | undefined): string => {
  if (!s) return "";
  const t = s.trim();
  if (!t) return "";
  const withHash = t.startsWith("#") ? t : `#${t}`;
  return withHash.toLowerCase();
};

const selectChannelsState = (s: RootState) => s.channels;
const selectById = (s: RootState) => s.channels.byId;
const selectAllIds = (s: RootState) => s.channels.allIds;

export const selectStatus = (s: RootState) => selectChannelsState(s).status;

export const selectAllChannels = createSelector(
  [selectById, selectAllIds],
  (byId, allIds) => allIds.map((id) => byId[id])
);

// console.log(selectAllChannels);

export const makeSelectChannelById = (id: string) =>
  createSelector([selectById], (byId) => byId[id] ?? null);

export const selectCodeIndex = createSelector([selectAllChannels], (arr) => {
  const m = new Map<string, string>();
  for (const c of arr) {
    const code = (c as any)?.code;
    if (code) m.set(normalizeCode(code), c._id);
  }
  return m;
});

export const makeSelectChannelByCode = (codeInput: string) =>
  createSelector([selectById, selectCodeIndex], (byId, idx) => {
    const id = idx.get(normalizeCode(codeInput));
    return id ? byId[id] : null;
  });

const toStr = (v: any) => (v == null ? "" : String(v));

const sameId = (a: any, b: any) => toStr(a) === toStr(b);

const getCreatorId = (ch: any) =>
  ch?.createdBy?._id ??
  ch?.createdBy ?? // handle plain string id
  ch?.owner?._id ??
  ch?.ownerId ??
  null;

const getMemberId = (m: any) =>
  (typeof m === "string" && m) ||
  m?._id ||
  m?.id ||
  m?.user?._id ||
  m?.userId ||
  m?.memberId ||
  null;

const userIsCreator = (ch: any, userId: string | number) =>
  sameId(getCreatorId(ch), userId);

const channelHasUser = (ch: Channel, userId: string | number) => {
  const members = (ch as any)?.members ?? [];
  return (
    Array.isArray(members) &&
    members.some((m: any) => {
      const id = (typeof m === "string" && m) || m?._id;
      return id === userId;
    })
  );
};
export const selectMyChannelsByUserId = createSelector(
  [selectAllChannels, (_: RootState, userId: string | number | null) => userId],
  (channels, userId) => {
    if (!userId) return [];
    // console.log(channels., userId)
    return channels.filter(
      (ch) =>
        (ch as any)?.createdBy?._id === userId || channelHasUser(ch, userId) || (ch as any)?.createdBy === userId
    );
  }
);

export const makeSelectMyChannelsByUserId = (userId?: string | number | null) =>
  createSelector([selectAllChannels], (channels) => {
    if (!userId) return [];
    // guard to avoid crashing when empty
    // console.log(channels[0]?.members); // only if channels[0] exists

    return channels.filter(
      (ch) => userIsCreator(ch, userId) || channelHasUser(ch, userId)
    );
  });

type Strategy = "recent" | "members" | "alpha";

export const makeSelectDefaultChannelId = (
  userId?: string | number | null,
  strategy: Strategy = "recent"
) =>
  createSelector(
    [(s: RootState) => selectMyChannelsByUserId(s, userId ?? null)],
    (mine) => {
      if (!userId || !Array.isArray(mine) || mine.length === 0) return null;

      const toId = (c: any) => String(c?._id ?? c?.id ?? "");

      const ts = (c: any) => {
        const v = c?.updatedAt ?? c?.createdAt ?? 0;
        const n = typeof v === "string" ? Date.parse(v) : Number(v);
        return Number.isFinite(n) ? n : 0;
      };

      const membersCount = (c: any) =>
        Array.isArray(c?.members)
          ? c.members.length
          : Number(c?.membersCount ?? 0);

      const byAlpha = (a: any, b: any) =>
        String(a?.name ?? "").localeCompare(String(b?.name ?? ""));

      const arr = [...mine];
      if (strategy === "recent") arr.sort((a, b) => ts(b) - ts(a));
      else if (strategy === "members")
        arr.sort((a, b) => membersCount(b) - membersCount(a));
      else arr.sort(byAlpha); // "alpha"

      const first = arr[0];
      return first ? toId(first) : null;
    }
  );



  // If you already exported this, reuse it
export const selectChannelById = (id: string) => (s: RootState) =>
  id ? s.channels.byId[id] ?? null : null;

export type ChannelStatusKey = "not-started" | "in-progress" | "completed" | "canceled";

export const normalizeTaskStatus = (raw?: string | null): ChannelStatusKey => {
  const s = String(raw ?? "").toLowerCase().replace(/\s+/g, "_").replace(/-/g, "_");
  if (["not-started", "notstart", "todo", "to_do", "pending"].includes(s)) return "not-started";
  if (["in-progress", "inprogress", "doing", "ongoing"].includes(s)) return "in-progress";
  if (["completed", "done", "finished", "resolved"].includes(s)) return "completed";
  if (["canceled", "cancelled", "archived", "void"].includes(s)) return "canceled";
  return "not-started";
};

export type ChannelTask = {
  id: string;
  title: string;
  description: string | null;
  status: ChannelStatusKey;
  channelCode: string;
  channelId?: string;
  createdAt: number;
};

// All Channel tasks for a channel (normalized)
export const makeSelectChannelTasksByChannelId = (channelId?: string | null) =>
  createSelector([(s: RootState) => (channelId ? selectChannelById(channelId)(s) : null)], (channel) => {
    const rawTasks: any[] = Array.isArray((channel as any)?.tasks) ? (channel as any).tasks : [];
    return rawTasks.map<ChannelTask>((t) => ({
      id: String(t?._id ?? t?.id ?? Math.random()),
      title: String(t?.name ?? t?.title ?? "Untitled task"),
      description: t?.description ?? null,
      status: normalizeTaskStatus(t?.status),
      channelCode: String((channel as any)?.code ?? ""),
      channelId: t?.channelId ? String(t.channelId) : undefined,
      createdAt:
        typeof t?.createdAt === "number"
          ? t.createdAt
          : t?.createdAt
          ? Date.parse(t.createdAt)
          : Date.now(),
    }));
  });

// Tasks for a channel filtered by a status
export const makeSelectChannelTasksByStatus = (channelId?: string | null, status?: ChannelStatusKey) =>
  createSelector([makeSelectChannelTasksByChannelId(channelId)], (tasks) =>
    status ? tasks.filter((t) => t.status === status) : tasks
  );