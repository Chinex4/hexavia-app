// store/channels.thunks.ts
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
    const res = await showPromise(
      api.get<GetChannelByIdResponse>(`/channel/${id}`),
      "Loading channel…",
      "Channel loaded"
    );
    return res.data.data.channel as Channel;
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
