import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "@/store";

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
