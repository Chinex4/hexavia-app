import { createSelector, createSlice, PayloadAction } from "@reduxjs/toolkit";
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
  createChannelTask,
  updateChannelTask,
  uploadChannelResources,
} from "./channels.thunks";

const normalizeCode = (c: string) => c.trim().toUpperCase().replace(/\s+/g, "");

type Status = "idle" | "loading" | "succeeded" | "failed";

export interface ChannelsState {
  byId: Record<ChannelId, Channel>;
  allIds: ChannelId[];
  status: Status;
  error: string | null;
  currentChannelId: ChannelId | null;
  lastGeneratedCode: string | null;
  codeIndex: Record<string, ChannelId>;
}

const initialState: ChannelsState = {
  byId: {},
  allIds: [],
  status: "idle",
  error: null,
  currentChannelId: null,
  lastGeneratedCode: null,
  codeIndex: {},
};

function indexChannel(state: ChannelsState, ch: Channel) {
  const rawCode = (ch as any).code ?? (ch as any).channelCode;
  if (rawCode) state.codeIndex[normalizeCode(String(rawCode))] = ch._id;
}

function upsertMany(state: ChannelsState, channels: Channel[]) {
  for (const ch of channels) {
    state.byId[ch._id] = { ...state.byId[ch._id], ...ch };
    if (!state.allIds.includes(ch._id)) state.allIds.push(ch._id);
    indexChannel(state, ch);
  }
}

function upsertOne(state: ChannelsState, channel: Channel) {
  state.byId[channel._id] = { ...state.byId[channel._id], ...channel };
  if (!state.allIds.includes(channel._id)) state.allIds.push(channel._id);
  indexChannel(state, channel);
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

    builder
      .addCase(fetchChannelById.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchChannelById.fulfilled, (state, action) => {
        state.status = "succeeded";
        upsertOne(state, action.payload);
      });

    builder
      .addCase(createChannel.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(createChannel.fulfilled, (state, action) => {
        state.status = "succeeded";
        upsertOne(state, action.payload);
        state.currentChannelId = action.payload._id;
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

    //   Channel tasks & resources
    builder
      .addCase(createChannelTask.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(createChannelTask.fulfilled, (state, action) => {
        state.status = "succeeded";
        upsertOne(state, action.payload);
      })
      .addCase(createChannelTask.rejected, (state, action) => {
        state.status = "failed";
        state.error =
          (action.payload as string) ?? action.error.message ?? null;
      });

    builder
      .addCase(updateChannelTask.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(updateChannelTask.fulfilled, (state, action) => {
        state.status = "succeeded";
        upsertOne(state, action.payload);
      })
      .addCase(updateChannelTask.rejected, (state, action) => {
        state.status = "failed";
        state.error =
          (action.payload as string) ?? action.error.message ?? null;
      });

    builder
      .addCase(uploadChannelResources.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(uploadChannelResources.fulfilled, (state, action) => {
        state.status = "succeeded";
        upsertOne(state, action.payload);
      })
      .addCase(uploadChannelResources.rejected, (state, action) => {
        state.status = "failed";
        state.error =
          (action.payload as string) ?? action.error.message ?? null;
      });
  },
});

export const { setCurrentChannel, clearChannels } = channelsSlice.actions;
export default channelsSlice.reducer;

export const selectChannelsState = (s: RootState) => s.channels;
export const selectAllChannels = createSelector(
  [(s: RootState) => s.channels.allIds, (s: RootState) => s.channels.byId],
  (allIds, byId) => allIds.map((id) => byId[id])
);
export const selectChannelById = (id: ChannelId) => (s: RootState) =>
  s.channels.byId[id] ?? null;
export const selectCurrentChannel = (s: RootState) =>
  s.channels.currentChannelId
    ? s.channels.byId[s.channels.currentChannelId]
    : null;
export const selectLastGeneratedCode = (s: RootState) =>
  s.channels.lastGeneratedCode;

export const selectChannelIdByCode = (code: string) => (s: RootState) =>
  s.channels.codeIndex[normalizeCode(code)] ?? null;

export const selectChannelByCode = (code: string) => (s: RootState) => {
  const id = s.channels.codeIndex[normalizeCode(code)];
  return id ? s.channels.byId[id] : null;
};

type MemberLike =
  | string
  | { _id?: string; userId?: string; user?: { _id?: string } }
  | null
  | undefined;

const hasUserId = (m: MemberLike, userId: string) => {
  if (!m) return false;
  if (typeof m === "string") return m === userId;
  if (m._id === userId) return true;
  if (m.userId === userId) return true;
  if (m.user?._id === userId) return true;
  return false;
};

export const selectChannelsForUser = (userId: string) =>
  createSelector(
    [
      (s: RootState) => s.channels.allIds,
      (s: RootState) => s.channels.byId as Record<ChannelId, Channel>,
    ],
    (allIds, byId) =>
      allIds
        .map((id) => byId[id])
        .filter(
          (ch) =>
            Array.isArray((ch as any)?.members) &&
            (ch as any).members.some((m: MemberLike) => hasUserId(m, userId))
        )
  );
