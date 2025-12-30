import { createAsyncThunk } from "@reduxjs/toolkit";
import type { AxiosError } from "axios";
import { api } from "@/api/axios";
import { showPromise, showError } from "@/components/ui/toast";
import type {
  Channel,
  CreateChannelResponse,
  GetChannelsResponse,
  GenerateCodeResponse,
  GetChannelByIdResponse,
  AddMemberBody,
  AddMemberResponse,
  RemoveMemberBody,
  RemoveMemberResponse,
  UpdateMemberRoleBody,
  UpdateMemberRoleResponse,
  DeleteChannelBody,
  DeleteChannelResponse,
  CreateTaskBody,
  CreateTaskResponse,
  UpdateTaskBody,
  UpdateTaskResponse,
  UploadResourcesBody,
  UploadResourcesResponse,
} from "./channels.types";

function extractErrorMessage(err: unknown): string {
  const ax = err as AxiosError<any>;
  const data = ax?.response?.data as any;
  const firstArrayError =
    Array.isArray(data?.errors) && data.errors.length
      ? data.errors[0]?.msg || data.errors[0] // support express-validator or arrays
      : null;

  return (
    data?.message ||
    data?.error ||
    firstArrayError ||
    ax?.message ||
    "Something went wrong. Please try again."
  );
}

export const fetchChannels = createAsyncThunk<
  Channel[],
  void,
  { rejectValue: string }
>("channels/fetchAll", async (_: void, { rejectWithValue }) => {
  try {
    const res = await api.get<GetChannelsResponse>("/channel");
    // console.log(res.data);
    return res.data.channels;
  } catch (err) {
    const msg = extractErrorMessage(err);
    showError(msg);
    return rejectWithValue(msg);
  }
});

export const fetchChannelById = createAsyncThunk<
  Channel,
  string,
  { rejectValue: string }
>("channels/fetchById", async (id, { rejectWithValue }) => {
  try {
    const res = await api.get<GetChannelByIdResponse>(`/channel/${id}`);
    // console.log(res.data)
    return res.data.channel as Channel;
  } catch (err) {
    const msg = extractErrorMessage(err);
    showError(msg);
    return rejectWithValue(msg);
  }
});

export const generateChannelCode = createAsyncThunk<
  string,
  void,
  { rejectValue: string }
>("channels/generateCode", async (_: void, { rejectWithValue }) => {
  try {
    const res = await api.get<GenerateCodeResponse>("/channel/generate-code");
    return res.data.code as string;
  } catch (err) {
    const msg = extractErrorMessage(err);
    showError(msg);
    return rejectWithValue(msg);
  }
});

export const createChannel = createAsyncThunk<
  Channel,
  { name: string; description?: string | null; code: string },
  { rejectValue: string }
>("channels/create", async (body, { rejectWithValue }) => {
  try {
    const res = await showPromise(
      api.post<CreateChannelResponse>("/channel", body),
      "Creating channel…",
      "Channel created"
    );
    return res.data.channel as Channel;
  } catch (err) {
    const msg = extractErrorMessage(err);
    showError(msg);
    return rejectWithValue(msg);
  }
});

// ADMIN ACTIONS

export const addMemberToChannel = createAsyncThunk<
  Channel,
  AddMemberBody,
  { rejectValue: string }
>("channels/addMember", async (body, { rejectWithValue }) => {
  try {
    const res = await showPromise(
      api.post<AddMemberResponse>("/channel/add-member", body),
      "Adding member…",
      "Member added"
    );
    return res.data.channel as Channel;
  } catch (err) {
    const msg = extractErrorMessage(err);
    showError(msg);
    return rejectWithValue(msg);
  }
});

export const removeMemberFromChannel = createAsyncThunk<
  Channel,
  RemoveMemberBody,
  { rejectValue: string }
>("channels/removeMember", async (body, { rejectWithValue }) => {
  try {
    const res = await showPromise(
      api.post<RemoveMemberResponse>("/channel/remove-member", body),
      "Removing member…",
      "Member removed"
    );
    return res.data.channel as Channel;
  } catch (err) {
    const msg = extractErrorMessage(err);
    showError(msg);
    return rejectWithValue(msg);
  }
});

export const updateChannelMemberRole = createAsyncThunk<
  Channel,
  UpdateMemberRoleBody,
  { rejectValue: string }
>("channels/updateMemberRole", async (body, { rejectWithValue }) => {
  try {
    const res = await showPromise(
      api.post<UpdateMemberRoleResponse>("/channel/update-member-role", body),
      "Updating role…",
      "Member role updated"
    );
    return res.data.channel as Channel;
  } catch (err) {
    const msg = extractErrorMessage(err);
    showError(msg);
    return rejectWithValue(msg);
  }
});

// DELETE CHANNEL (assumed endpoint)
export const deleteChannelById = createAsyncThunk<
  string,
  DeleteChannelBody,
  { rejectValue: string }
>("channels/deleteChannel", async (body, { rejectWithValue }) => {
  try {
    const res = await showPromise(
      api.post<DeleteChannelResponse>("/channel/delete", body),
      "Deleting channel…",
      "Channel deleted"
    );
    return (res.data as any)?.channelId ?? body.channelId;
  } catch (err) {
    const msg = extractErrorMessage(err);
    showError(msg);
    return rejectWithValue(msg);
  }
});

// CHANNEL TASKS & RESOURCES
export const createChannelTask = createAsyncThunk<
  Channel,
  CreateTaskBody,
  { rejectValue: string }
>("channels/createTask", async (body, { rejectWithValue }) => {
  try {
    const res = await showPromise(
      api.post<CreateTaskResponse>(`/channel/create-task`, body),
      "Creating task…",
      "Task created"
    );
    // console.log(res.data)
    return res.data.channel as Channel;
  } catch (err) {
    const msg = extractErrorMessage(err);
    showError(msg);
    return rejectWithValue(msg);
  }
});

export const updateChannelTask = createAsyncThunk<
  Channel,
  UpdateTaskBody,
  { rejectValue: string }
>("channels/updateTask", async (body, { rejectWithValue }) => {
  try {
    const res = await showPromise(api.put<UpdateTaskResponse>("/channel/update-task", body), "updating task…", "Task updated");
    return res.data.channel as Channel;
  } catch (err) {
    const msg = extractErrorMessage(err);
    return rejectWithValue(msg ?? "Failed to update task");
  }
});

export const uploadChannelResources = createAsyncThunk<
  Channel,
  UploadResourcesBody,
  { rejectValue: string }
>("channels/uploadResources", async (body, { rejectWithValue }) => {
  try {
    const res = await showPromise(
      api.post<UploadResourcesResponse>(`/channel/upload-resources`, body),
      "Uploading resources…",
      "Resources uploaded"
    );
    const channel =
      (res.data as any)?.channel ||
      (res.data as any)?.data?.channel ||
      (res.data as any)?.data;
    if (!channel) {
      throw new Error("Missing channel in response");
    }
    return channel as Channel;
  } catch (err: any) {
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "Failed to upload resources";
    showError(msg);
    return rejectWithValue(msg);
  }
});
