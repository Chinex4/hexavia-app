import { createAsyncThunk } from "@reduxjs/toolkit";
import type {
  PersonalTaskApi,
  PersonalApiStatus,
} from "@/features/staff/personalTasks.types";
import { api } from "@/api/axios";
import { RootState } from "@/store";

export const fetchPersonalTasks = createAsyncThunk<
  PersonalTaskApi[],
  void,
  { state: RootState }
>("personalTasks/fetchAll", async (_, thunkApi) => {
  try {
    // GET /tasks returns personal tasks for current user (assumption)
    const res = await api.get("/tasks");
    return Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
  } catch (e: any) {
    return thunkApi.rejectWithValue(
      e?.response?.data || { message: "Failed to fetch personal tasks" }
    ) as any;
  }
});

export const createPersonalTask = createAsyncThunk<
  PersonalTaskApi,
  {
    userId: string;
    name: string;
    description: string | null;
    status: PersonalApiStatus;
  },
  { state: RootState }
>("personalTasks/create", async (body, thunkApi) => {
  try {
    const state = thunkApi.getState();
    const brr =
      state.user?.token || null; // flexible fallback
    const headers = brr ? { Authorization: `Bearer ${brr}` } : undefined;

    const res = await api.post("/tasks", body, { headers });
    return res.data;
  } catch (e: any) {
    return thunkApi.rejectWithValue(
      e?.response?.data || { message: "Failed to create personal task" }
    ) as any;
  }
});

export const updatePersonalTask = createAsyncThunk<
  PersonalTaskApi,
  {
    id: string;
    patch: Partial<Pick<PersonalTaskApi, "name" | "description" | "status">>;
  },
  { state: RootState }
>("personalTasks/update", async ({ id, patch }, thunkApi) => {
  try {
    const state = thunkApi.getState();
    const brr =
      state.user?.token || null;
    const headers = brr ? { Authorization: `Bearer ${brr}` } : undefined;

    const res = await api.patch(`/tasks/${id}`, patch, { headers });
    return res.data;
  } catch (e: any) {
    return thunkApi.rejectWithValue(
      e?.response?.data || { message: "Failed to update personal task" }
    ) as any;
  }
});

export const deletePersonalTask = createAsyncThunk<
  { id: string },
  { id: string },
  { state: RootState }
>("personalTasks/delete", async ({ id }, thunkApi) => {
  try {
    const state = thunkApi.getState();
    const brr =
      state.user?.token || null;
    const headers = brr ? { Authorization: `Bearer ${brr}` } : undefined;

    await api.delete(`/tasks/${id}`, { headers });
    return { id };
  } catch (e: any) {
    return thunkApi.rejectWithValue(
      e?.response?.data || { message: "Failed to delete personal task" }
    ) as any;
  }
});
