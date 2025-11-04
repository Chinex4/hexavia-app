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
  assignPersonalTask, // NEW
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

const extractTask = (payload: any): PersonalTaskApi => {
  // accepts { task: {...} } or the task itself
  return (payload?.task ?? payload) as PersonalTaskApi;
};

const toUI = (a: PersonalTaskApi): PersonalTaskUI => ({
  id: String(a._id),
  title: String(a.name ?? "Untitled task"),
  description: a.description ?? null,
  status: a.status,
  createdAt:
    typeof a.createdAt === "number"
      ? a.createdAt
      : a.createdAt
        ? new Date(a.createdAt).getTime()
        : Date.now(),
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
        (
          state,
          action: PayloadAction<PersonalTaskApi[] | { data: PersonalTaskApi[] }>
        ) => {
          state.status = "succeeded";
          const arr = Array.isArray(action.payload)
            ? action.payload
            : (action.payload?.data ?? []);
          const mapped = arr.map(toUI);
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
        (state, action: PayloadAction<any>) => {
          upsertMany(state, [toUI(extractTask(action.payload))]);
        }
      )
      .addCase(
        updatePersonalTask.fulfilled,
        (state, action: PayloadAction<any>) => {
          upsertMany(state, [toUI(extractTask(action.payload))]);
        }
      )
      .addCase(
        deletePersonalTask.fulfilled,
        (state, action: PayloadAction<{ id: string }>) => {
          const id = action.payload.id;
          delete state.items[id];
          state.order = state.order.filter((x) => x !== id);
        }
      )
      .addCase(
        assignPersonalTask.fulfilled,
        (state, action: PayloadAction<any>) => {
          // treat like create, server returns the created/assigned task
          upsertMany(state, [toUI(extractTask(action.payload))]);
        }
      );
  },
});

export const { clearPersonalTasks } = personalTasksSlice.actions;
export default personalTasksSlice.reducer;
