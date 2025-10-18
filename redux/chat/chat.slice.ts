// redux/chat/chat.slice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type {
  ChatMessage,
  ChatState,
  ThreadId,
  Thread,
} from "@/types/chat-model";
import { fetchMessages } from "./chat.thunks";

const initialState: ChatState = {
  meId: null,
  currentThreadId: null,
  threads: {},
  messages: {},
  joinedRooms: { me: false, channels: {} },
  connecting: false,
  connected: false,
  error: null,

  loadingByThread: {},
  hasMoreByThread: {},
  nextSkipByThread: {},
};

const looksImageUrl = (s: string) =>
  /^https?:\/\//i.test(s) && /\.(png|jpe?g|gif|webp)(\?|$)/i.test(s);

export const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setMe(state, action: PayloadAction<string>) {
      state.meId = action.payload;
    },
    wsConnecting(state) {
      state.connecting = true;
      state.error = null;
    },
    wsConnected(state) {
      state.connecting = false;
      state.connected = true;
    },
    wsDisconnected(state) {
      state.connected = false;
      state.joinedRooms.me = false;
      state.joinedRooms.channels = {};
    },

    joinedMeRoom(state) {
      state.joinedRooms.me = true;
    },
    joinedChannel(state, action: PayloadAction<string>) {
      state.joinedRooms.channels[action.payload] = true;
    },

    ensureThread(
      state,
      action: PayloadAction<{
        id: ThreadId;
        kind: Thread["kind"];
        title?: string;
        subtitle?: string;
      }>
    ) {
      const { id, kind, title, subtitle } = action.payload;
      if (!state.threads[id]) {
        state.threads[id] = { id, kind, title, subtitle, messages: [] };
      }
    },

    setCurrentThread(state, action: PayloadAction<ThreadId | null>) {
      state.currentThreadId = action.payload;
    },

    upsertMessage(state, action: PayloadAction<ChatMessage>) {
      const msg = action.payload;
      state.messages[msg.id] = { ...state.messages[msg.id], ...msg };
      // NOTE: addMessageToThread should be used to actually attach to a thread.
    },

    addMessageToThread(
      state,
      action: PayloadAction<{ threadId: ThreadId; message: ChatMessage }>
    ) {
      const { threadId, message } = action.payload;
      state.messages[message.id] = message;
      const thr = state.threads[threadId];
      if (!thr) return;
      if (!thr.messages.includes(message.id)) {
        thr.messages.push(message.id);
      }
    },

    replaceTempId(
      state,
      action: PayloadAction<{ tempId: string; realId: string }>
    ) {
      const { tempId, realId } = action.payload;
      const existing = state.messages[tempId];
      if (!existing) return;
      state.messages[realId] = { ...existing, id: realId, temp: false };
      delete state.messages[tempId];
      Object.values(state.threads).forEach((t) => {
        const idx = t.messages.indexOf(tempId);
        if (idx >= 0) t.messages[idx] = realId;
      });
    },

    setMessageStatus(
      state,
      action: PayloadAction<{
        id: string;
        status: ChatMessage["status"];
        isRead?: boolean;
      }>
    ) {
      const m = state.messages[action.payload.id];
      if (m) {
        m.status = action.payload.status;
        if (action.payload.isRead !== undefined)
          m.isRead = action.payload.isRead;
      }
    },

    markReadBulk(state, action: PayloadAction<string[]>) {
      action.payload.forEach((id) => {
        const m = state.messages[id];
        if (m) m.isRead = true;
      });
    },

    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
  },

  // ✅ correct builder callback usage
  extraReducers: (builder) => {
    builder
      .addCase(fetchMessages.pending, (state, { meta }) => {
        const { id } = meta.arg as { id: string };
        state.loadingByThread![id] = true;
        // first time: if nextSkip not set, initialize
        if (state.nextSkipByThread![id] == null)
          state.nextSkipByThread![id] = 0;
      })
      .addCase(fetchMessages.fulfilled, (state, { payload, meta }) => {
        const { threadId, kind, items, page } = payload;
        const { limit = 50, skip = 0 } = page || {};
        state.loadingByThread![threadId] = false;

        // ensure thread exists
        if (!state.threads[threadId]) {
          state.threads[threadId] = { id: threadId, kind, messages: [] };
        }
        const thr = state.threads[threadId];

        // normalize & add (same as you already do)
        for (const d of items) {
          const id = String(d._id ?? `${d.sender}-${d.createdAt}`);
          if (!state.messages[id]) {
            const text = d.message ?? "";
            const isImg =
              typeof text === "string" &&
              /^https?:\/\//i.test(text) &&
              /\.(png|jpe?g|gif|webp)(\?|$)/i.test(text);

            state.messages[id] = {
              id,
              text,
              createdAt: new Date(d.createdAt).valueOf(),
              senderId: String(d.sender),
              senderName: d.username ?? "",
              avatar: d.profilePicture ?? undefined,
              isRead: !!d.read,
              status: d.read ? "seen" : "delivered",
              mediaUri: isImg ? text : undefined,
              mimeType: isImg ? "image/jpeg" : undefined,
            };
          }
          if (!thr.messages.includes(id)) thr.messages.push(id);
        }
        thr.messages.sort(
          (a, b) => state.messages[a].createdAt - state.messages[b].createdAt
        );

        // hasMore: if fewer than limit came back, we reached the end
        const got = items.length;
        state.hasMoreByThread![threadId] = got >= limit; // true if possibly more
        // next skip (for your convenience)
        state.nextSkipByThread![threadId] = skip + got;
      })
      .addCase(fetchMessages.rejected, (state, { meta }) => {
        const { id } = meta.arg as { id: string };
        state.loadingByThread![id] = false;
      });
  },
});

export const {
  setMe,
  wsConnecting,
  wsConnected,
  wsDisconnected,
  joinedMeRoom,
  joinedChannel,
  ensureThread,
  setCurrentThread,
  addMessageToThread,
  replaceTempId,
  setMessageStatus,
  markReadBulk,
  setError,
} = chatSlice.actions;

export default chatSlice.reducer;
