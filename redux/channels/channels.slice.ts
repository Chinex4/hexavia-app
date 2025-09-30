// store/channels.slice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "@/store";
import type { Channel, ChannelId } from "./channels.types";
import {
  fetchChannels,
  fetchChannelById,
  createChannel,
  generateChannelCode,
  addMemberToChannel,
  removeMemberFromChannel,
  updateChannelMemberRole,
} from "./channels.thunks";

type Status = "idle" | "loading" | "succeeded" | "failed";

export interface ChannelsState {
  byId: Record<ChannelId, Channel>;
  allIds: ChannelId[];
  status: Status;
  error: string | null;
  currentChannelId: ChannelId | null;
  lastGeneratedCode: string | null;
}

const initialState: ChannelsState = {
  byId: {},
  allIds: [],
  status: "idle",
  error: null,
  currentChannelId: null,
  lastGeneratedCode: null,
};

function upsertMany(state: ChannelsState, channels: Channel[]) {
  for (const ch of channels) {
    state.byId[ch.id] = { ...state.byId[ch.id], ...ch };
    if (!state.allIds.includes(ch.id)) state.allIds.push(ch.id);
  }
}

function upsertOne(state: ChannelsState, channel: Channel) {
  state.byId[channel.id] = { ...state.byId[channel.id], ...channel };
  if (!state.allIds.includes(channel.id)) state.allIds.push(channel.id);
}

const channelsSlice = createSlice({
  name: "channels",
  initialState,
  reducers: {
    setCurrentChannel(state, action: PayloadAction<ChannelId | null>) {
      state.currentChannelId = action.payload;
    },
    clearChannels(state) {
      state.byId = {};
      state.allIds = [];
      state.currentChannelId = null;
      state.lastGeneratedCode = null;
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // fetchChannels
    builder
      .addCase(fetchChannels.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchChannels.fulfilled, (state, action) => {
        state.status = "succeeded";
        upsertMany(state, action.payload);
      })
      .addCase(fetchChannels.rejected, (state, action) => {
        state.status = "failed";
        state.error =
          (action.payload as string) ?? action.error.message ?? null;
      });

    // fetchChannelById
    builder
      .addCase(fetchChannelById.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchChannelById.fulfilled, (state, action) => {
        state.status = "succeeded";
        upsertOne(state, action.payload);
      })
      

    builder
      .addCase(createChannel.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(createChannel.fulfilled, (state, action) => {
        state.status = "succeeded";
        upsertOne(state, action.payload);
        state.currentChannelId = action.payload.id;
      })
      .addCase(createChannel.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message ?? "Failed to create channel";
      });

    builder
      .addCase(generateChannelCode.pending, (state) => {
        state.error = null;
      })
      .addCase(generateChannelCode.fulfilled, (state, action) => {
        state.lastGeneratedCode = action.payload;
      })
      .addCase(generateChannelCode.rejected, (state, action) => {
        state.error = action.error.message ?? "Failed to generate code";
      });

    //   Admin actions: add/remove/update member
    builder
      .addCase(addMemberToChannel.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(addMemberToChannel.fulfilled, (state, action) => {
        state.status = "succeeded";
        upsertOne(state, action.payload);
      })
      .addCase(addMemberToChannel.rejected, (state, action) => {
        state.status = "failed";
        state.error =
          (action.payload as string) ?? action.error.message ?? null;
      });

    builder
      .addCase(removeMemberFromChannel.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(removeMemberFromChannel.fulfilled, (state, action) => {
        state.status = "succeeded";
        upsertOne(state, action.payload);
      })
      .addCase(removeMemberFromChannel.rejected, (state, action) => {
        state.status = "failed";
        state.error =
          (action.payload as string) ?? action.error.message ?? null;
      });

    builder
      .addCase(updateChannelMemberRole.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(updateChannelMemberRole.fulfilled, (state, action) => {
        state.status = "succeeded";
        upsertOne(state, action.payload);
      })
      .addCase(updateChannelMemberRole.rejected, (state, action) => {
        state.status = "failed";
        state.error =
          (action.payload as string) ?? action.error.message ?? null;
      });
  },
});

export const { setCurrentChannel, clearChannels } = channelsSlice.actions;
export default channelsSlice.reducer;

export const selectChannelsState = (s: RootState) => s.channels;
export const selectAllChannels = (s: RootState) =>
  s.channels.allIds.map((id) => s.channels.byId[id]);
export const selectChannelById = (id: ChannelId) => (s: RootState) =>
  s.channels.byId[id] ?? null;
export const selectCurrentChannel = (s: RootState) =>
  s.channels.currentChannelId
    ? s.channels.byId[s.channels.currentChannelId]
    : null;
export const selectLastGeneratedCode = (s: RootState) =>
  s.channels.lastGeneratedCode;
