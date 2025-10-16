import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { ChatMessage, ChatState, ThreadId, Thread } from '@/types/chat-model';

const initialState: ChatState = {
  meId: null,
  currentThreadId: null,
  threads: {},
  messages: {},
  joinedRooms: { me: false, channels: {} },
  connecting: false,
  connected: false,
  error: null,
};

export const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setMe(state, action: PayloadAction<string>) {
      state.meId = action.payload;
    },
    wsConnecting(state) { state.connecting = true; state.error = null; },
    wsConnected(state) { state.connecting = false; state.connected = true; },
    wsDisconnected(state) { state.connected = false; state.joinedRooms.me = false; state.joinedRooms.channels = {}; },

    joinedMeRoom(state) { state.joinedRooms.me = true; },
    joinedChannel(state, action: PayloadAction<string>) { state.joinedRooms.channels[action.payload] = true; },

    ensureThread(state, action: PayloadAction<{ id: ThreadId; kind: Thread['kind']; title?: string; subtitle?: string }>) {
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
      const threadId = (msg as any).channelId ?? (msg as any).otherUserId ?? null;
      // we’ll pass threadId explicitly from middleware or UI:
    },
    addMessageToThread(state, action: PayloadAction<{ threadId: ThreadId; message: ChatMessage }>) {
      const { threadId, message } = action.payload;
      state.messages[message.id] = message;
      if (!state.threads[threadId]) return;
      if (!state.threads[threadId].messages.includes(message.id)) {
        state.threads[threadId].messages.push(message.id);
      }
    },
    replaceTempId(state, action: PayloadAction<{ tempId: string; realId: string }>) {
      const { tempId, realId } = action.payload;
      const existing = state.messages[tempId];
      if (!existing) return;
      state.messages[realId] = { ...existing, id: realId, temp: false };
      delete state.messages[tempId];
      Object.values(state.threads).forEach(t => {
        const idx = t.messages.indexOf(tempId);
        if (idx >= 0) t.messages[idx] = realId;
      });
    },
    setMessageStatus(state, action: PayloadAction<{ id: string; status: ChatMessage['status']; isRead?: boolean }>) {
      const m = state.messages[action.payload.id];
      if (m) {
        m.status = action.payload.status;
        if (action.payload.isRead !== undefined) m.isRead = action.payload.isRead;
      }
    },
    markReadBulk(state, action: PayloadAction<string[]>) {
      action.payload.forEach(id => {
        const m = state.messages[id];
        if (m) m.isRead = true;
      });
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
  },
});

export const {
  setMe, wsConnecting, wsConnected, wsDisconnected,
  joinedMeRoom, joinedChannel,
  ensureThread, setCurrentThread,
  addMessageToThread, replaceTempId, setMessageStatus, markReadBulk,
  setError,
} = chatSlice.actions;

export default chatSlice.reducer;
