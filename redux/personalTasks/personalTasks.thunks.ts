import { createAsyncThunk } from "@reduxjs/toolkit";
import type { PersonalTaskApi, PersonalApiStatus } from "@/features/staff/personalTasks.types";
import { api } from "@/api/axios";
import { RootState } from "@/store";
import { showPromise } from "@/components/ui/toast";

/** GET /api/personal-task */
export const fetchPersonalTasks = createAsyncThunk<
  PersonalTaskApi[],
  void,
  { state: RootState }
>("personalTasks/fetchAll", async (_, thunkApi) => {
  try {
    const res = await showPromise(api.get("/personal-task"), "Loading personal tasks…", "Personal tasks loaded");
    // console.log(res.data);
    return Array.isArray(res.data) ? res.data : (res.data?.tasks ?? []);
  } catch (e: any) {
    return thunkApi.rejectWithValue(
      e?.response?.data || { message: "Failed to fetch personal tasks" }
    ) as any;
  }
});

/** POST /api/personal-task (create for yourself) */
export const createPersonalTask = createAsyncThunk<
  PersonalTaskApi | { task: PersonalTaskApi },
  {
    name: string;
    description: string | null;
    status: PersonalApiStatus; // e.g. "not-started"
  },
  { state: RootState }
>("personalTasks/create", async (body, thunkApi) => {
  try {
    // Swagger shows body: { name, description, status } — no userId
    const res = await api.post("/personal-task", {
      name: body.name,
      description: body.description ?? "",
      status: body.status,
    });
    return res.data;
  } catch (e: any) {
    return thunkApi.rejectWithValue(
      e?.response?.data || { message: "Failed to create personal task" }
    ) as any;
  }
});

/** PUT /api/personal-task (update) */
export const updatePersonalTask = createAsyncThunk<
  PersonalTaskApi | { task: PersonalTaskApi },
  {
    id: string;
    changes: Partial<Pick<PersonalTaskApi, "name" | "description" | "status">>;
  },
  { state: RootState }
>("personalTasks/update", async ({ id, changes }, thunkApi) => {
  try {
    const res = await api.put("/personal-task", {
      taskId: id,
      ...changes,
    });
    return res.data;
  } catch (e: any) {
    return thunkApi.rejectWithValue(
      e?.response?.data || { message: "Failed to update personal task" }
    ) as any;
  }
});

/** DELETE /api/personal-task (body: { taskId }) */
export const deletePersonalTask = createAsyncThunk<
  { id: string },
  { id: string },
  { state: RootState }
>("personalTasks/delete", async ({ id }, thunkApi) => {
  try {
    await api.delete("/personal-task", {
      data: { taskId: id }, // axios sends body via `data` for DELETE
    });
    return { id };
  } catch (e: any) {
    return thunkApi.rejectWithValue(
      e?.response?.data || { message: "Failed to delete personal task" }
    ) as any;
  }
});

/** POST /api/personal-task/assign (admin only) */
export const assignPersonalTask = createAsyncThunk<
  PersonalTaskApi | { task: PersonalTaskApi },
  {
    assignedTo: string; // user id
    name: string;
    description: string | null;
    status: PersonalApiStatus;
  },
  { state: RootState }
>("personalTasks/assign", async (body, thunkApi) => {
  try {
    const res = await api.post("/personal-task/assign", {
      name: body.name,
      description: body.description ?? "",
      assignedTo: body.assignedTo,
      status: body.status,
    });
    return res.data;
  } catch (e: any) {
    return thunkApi.rejectWithValue(
      e?.response?.data || { message: "Failed to assign personal task" }
    ) as any;
  }
});
