import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "@/store";

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
