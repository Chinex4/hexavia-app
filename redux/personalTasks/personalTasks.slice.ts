import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type {
  PersonalTasksState,
  PersonalTaskUI,
  PersonalTaskApi,
} from "@/features/staff/personalTasks.types";
import {
  fetchPersonalTasks,
  createPersonalTask,
  updatePersonalTask,
  deletePersonalTask,
} from "./personalTasks.thunks";

const initialState: PersonalTasksState = {
  items: {},
  order: [],
  status: "idle",
  error: null,
};

const upsertMany = (state: PersonalTasksState, list: PersonalTaskUI[]) => {
  list.forEach((t) => {
    state.items[t.id] = t;
    if (!state.order.includes(t.id)) state.order.unshift(t.id);
  });
  if (state.order.length > 500) state.order = state.order.slice(0, 500);
};

const toUI = (a: PersonalTaskApi): PersonalTaskUI => ({
  id: String(a._id),
  title: String(a.name ?? "Untitled task"),
  description: a.description ?? null,
  status: a.status,
  createdAt:
    typeof a.createdAt === "number"
      ? a.createdAt
      : new Date(a.createdAt).getTime(),
  updatedAt: a.updatedAt
    ? typeof a.updatedAt === "number"
      ? a.updatedAt
      : new Date(a.updatedAt).getTime()
    : undefined,
  channelCode: "personal",
  channelId: "personal",
});

export const personalTasksSlice = createSlice({
  name: "personalTasks",
  initialState,
  reducers: {
    clearPersonalTasks(state) {
      state.items = {};
      state.order = [];
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPersonalTasks.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(
        fetchPersonalTasks.fulfilled,
        (state, action: PayloadAction<PersonalTaskApi[]>) => {
          state.status = "succeeded";
          const mapped = action.payload.map(toUI);
          upsertMany(state, mapped);
        }
      )
      .addCase(fetchPersonalTasks.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error?.message || "Failed to load personal tasks";
      });

    builder
      .addCase(
        createPersonalTask.fulfilled,
        (state, action: PayloadAction<PersonalTaskApi>) => {
          upsertMany(state, [toUI(action.payload)]);
        }
      )
      .addCase(
        updatePersonalTask.fulfilled,
        (state, action: PayloadAction<PersonalTaskApi>) => {
          upsertMany(state, [toUI(action.payload)]);
        }
      )
      .addCase(
        deletePersonalTask.fulfilled,
        (state, action: PayloadAction<{ id: string }>) => {
          const id = action.payload.id;
          delete state.items[id];
          state.order = state.order.filter((x) => x !== id);
        }
      );
  },
});

export const { clearPersonalTasks } = personalTasksSlice.actions;
export default personalTasksSlice.reducer;
