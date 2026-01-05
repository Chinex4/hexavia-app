import { createSlice } from "@reduxjs/toolkit";
import type { RootState } from "@/store";
import {
  createChannelLink,
  deleteChannelLink,
  fetchChannelLinks,
  updateChannelLink,
} from "./channelLinks.thunks";
import type { ChannelLink } from "./channelLinks.types";

type Status = "idle" | "loading" | "succeeded" | "failed";

export interface ChannelLinksState {
  byChannel: Record<string, ChannelLink[]>;
  status: Record<string, Status>;
  error: Record<string, string | null>;
}

const initialState: ChannelLinksState = {
  byChannel: {},
  status: {},
  error: {},
};

const channelLinksSlice = createSlice({
  name: "channelLinks",
  initialState,
  reducers: {
    clearLinksForChannel(state, action) {
      const channelId = action.payload as string;
      delete state.byChannel[channelId];
      delete state.status[channelId];
      delete state.error[channelId];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchChannelLinks.pending, (state, action) => {
        const channelId = action.meta.arg;
        state.status[channelId] = "loading";
        state.error[channelId] = null;
      })
      .addCase(fetchChannelLinks.fulfilled, (state, action) => {
        const channelId = action.meta.arg;
        state.status[channelId] = "succeeded";
        state.byChannel[channelId] = action.payload;
      })
      .addCase(fetchChannelLinks.rejected, (state, action) => {
        const channelId = action.meta.arg;
        state.status[channelId] = "failed";
        state.error[channelId] = action.payload ?? "Failed to load links";
      })
      .addCase(createChannelLink.fulfilled, (state, action) => {
        const channelId = action.meta.arg.channelId;
        const existing = state.byChannel[channelId] ?? [];
        state.byChannel[channelId] = [action.payload, ...existing];
      })
      .addCase(updateChannelLink.fulfilled, (state, action) => {
        const channelId = action.meta.arg.channelId;
        const existing = state.byChannel[channelId] ?? [];
        state.byChannel[channelId] = existing.map((link) =>
          link._id === action.payload._id ? action.payload : link
        );
      })
      .addCase(deleteChannelLink.fulfilled, (state, action) => {
        const channelId = action.meta.arg.channelId;
        const existing = state.byChannel[channelId] ?? [];
        state.byChannel[channelId] = existing.filter(
          (link) => link._id !== action.payload
        );
      });
  },
});

export const { clearLinksForChannel } = channelLinksSlice.actions;
export default channelLinksSlice.reducer;

export const selectChannelLinks = (channelId: string) => (state: RootState) =>
  state.channelLinks.byChannel[channelId] ?? [];
export const selectChannelLinksStatus = (channelId: string) => (
  state: RootState
) => state.channelLinks.status[channelId] ?? "idle";
export const selectChannelLinksError = (channelId: string) => (
  state: RootState
) => state.channelLinks.error[channelId] || null;
