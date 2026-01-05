import { api } from "@/api/axios";
import { showError, showPromise, showSuccess } from "@/components/ui/toast";
import { extractErrorMessage } from "@/redux/api/extractErrorMessage";
import { createAsyncThunk } from "@reduxjs/toolkit";
import type {
  AddMemberBody,
  AddMemberResponse,
  Channel,
  CreateChannelBody,
  CreateChannelResponse,
  CreateTaskBody,
  CreateTaskResponse,
  DeleteChannelBody,
  DeleteChannelResponse,
  GenerateCodeResponse,
  GetChannelByCodeResponse,
  GetChannelByIdResponse,
  GetChannelsResponse,
  JoinChannelResponse,
  RemoveMemberBody,
  RemoveMemberResponse,
  UpdateMemberRoleBody,
  UpdateMemberRoleResponse,
  UpdateTaskBody,
  UpdateTaskResponse,
  UploadResourcesBody,
} from "./channels.types";

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
  CreateChannelBody,
  { rejectValue: string }
>("channels/create", async (body, { rejectWithValue }) => {
  try {
    const res = await showPromise(
      api.post<CreateChannelResponse>("/channel", body),
      "Creating project...",
      "Project created"
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
      api.delete<DeleteChannelResponse>("/admin/channels", { data: body }),
      "Deleting project...",
      "Project deleted"
    );

    return res.data?.channelId ?? body.channelId;
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
    const res = await showPromise(
      api.put<UpdateTaskResponse>("/channel/update-task", body),
      "updating task…",
      "Task updated"
    );
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
      api.post(`/channel/upload-resources`, body),
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
    const msg = extractErrorMessage(err);
    showError(msg);
    return rejectWithValue(msg);
  }
});

export const fetchChannelByCode = createAsyncThunk<
  Channel,
  string,
  { rejectValue: string }
>("channels/fetchByCode", async (code, { rejectWithValue }) => {
  try {
    const res = await api.get<GetChannelByCodeResponse>(
      `/channel/${code}/code`
    );
    return res.data.channel;
  } catch (err: any) {
    const status = err?.response?.status;

    if (status === 404) {
      const msg = "Channel not found";
      showError(msg);
      return rejectWithValue(msg);
    }

    const msg = extractErrorMessage(err);
    showError(msg);
    return rejectWithValue(msg);
  }
});

export const joinChannel = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("channels/join", async (code, { rejectWithValue }) => {
  try {
    console.log("Joining channel with code:", code);
    const res = await api.put<JoinChannelResponse>("/channel/join", {
      code: `#${code}`,
    });
    console.log("Join response:", res.data);
    if (res.status === 200) {
      showSuccess("Joined channel successfully");
      return res.data.message;
    } else {
      throw new Error(res.data.message || "Failed to join channel");
    }
  } catch (err) {
    // console.error("Join channel error:", err);
    const msg = extractErrorMessage(err);
    showError(msg);
    return rejectWithValue(msg);
  }
});
