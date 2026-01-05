import { createSlice } from "@reduxjs/toolkit";
import type { RootState } from "@/store";
import {
  createChannelNote,
  deleteChannelNote,
  fetchChannelNotes,
  updateChannelNote,
} from "./channelNotes.thunks";
import type { ChannelNote } from "./channelNotes.types";

type Status = "idle" | "loading" | "succeeded" | "failed";

export interface ChannelNotesState {
  byChannel: Record<string, ChannelNote[]>;
  status: Record<string, Status>;
  error: Record<string, string | null>;
}

const initialState: ChannelNotesState = {
  byChannel: {},
  status: {},
  error: {},
};

const channelNotesSlice = createSlice({
  name: "channelNotes",
  initialState,
  reducers: {
    clearNotesForChannel(state, action) {
      const channelId = action.payload as string;
      delete state.byChannel[channelId];
      delete state.status[channelId];
      delete state.error[channelId];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchChannelNotes.pending, (state, action) => {
        const channelId = action.meta.arg;
        state.status[channelId] = "loading";
        state.error[channelId] = null;
      })
      .addCase(fetchChannelNotes.fulfilled, (state, action) => {
        const channelId = action.meta.arg;
        state.status[channelId] = "succeeded";
        state.byChannel[channelId] = action.payload;
      })
      .addCase(fetchChannelNotes.rejected, (state, action) => {
        const channelId = action.meta.arg;
        state.status[channelId] = "failed";
        state.error[channelId] = action.payload ?? "Failed to load notes";
      })
      .addCase(createChannelNote.fulfilled, (state, action) => {
        const channelId = action.meta.arg.channelId;
        const existing = state.byChannel[channelId] ?? [];
        state.byChannel[channelId] = [action.payload, ...existing];
      })
      .addCase(updateChannelNote.fulfilled, (state, action) => {
        const channelId = action.meta.arg.channelId;
        const existing = state.byChannel[channelId] ?? [];
        state.byChannel[channelId] = existing.map((note) =>
          note._id === action.payload._id ? action.payload : note
        );
      })
      .addCase(deleteChannelNote.fulfilled, (state, action) => {
        const channelId = action.meta.arg.channelId;
        const existing = state.byChannel[channelId] ?? [];
        state.byChannel[channelId] = existing.filter(
          (note) => note._id !== action.payload
        );
      });
  },
});

export const { clearNotesForChannel } = channelNotesSlice.actions;
export default channelNotesSlice.reducer;

export const selectChannelNotes = (channelId: string) => (state: RootState) =>
  state.channelNotes.byChannel[channelId] ?? [];
export const selectChannelNotesStatus = (channelId: string) => (
  state: RootState
) => state.channelNotes.status[channelId] ?? "idle";
export const selectChannelNotesError = (channelId: string) => (
  state: RootState
) => state.channelNotes.error[channelId] || null;
