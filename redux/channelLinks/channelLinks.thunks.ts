import { api } from "@/api/axios";
import { showError, showPromise } from "@/components/ui/toast";
import { extractErrorMessage } from "@/redux/api/extractErrorMessage";
import { createAsyncThunk } from "@reduxjs/toolkit";
import type {
  ChannelLink,
  CreateChannelLinkBody,
  DeleteChannelLinkBody,
  UpdateChannelLinkBody,
} from "./channelLinks.types";

const normalizeLinks = (data: any): ChannelLink[] => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.links)) return data.links;
  if (Array.isArray(data?.data?.links)) return data.data.links;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

export const fetchChannelLinks = createAsyncThunk<
  ChannelLink[],
  string,
  { rejectValue: string }
>("channelLinks/fetch", async (channelId, { rejectWithValue }) => {
  try {
    const res = await api.get(`/channel/${channelId}/links`);
    return normalizeLinks(res.data);
  } catch (err) {
    const msg = extractErrorMessage(err);
    showError(msg);
    return rejectWithValue(msg);
  }
});

export const createChannelLink = createAsyncThunk<
  ChannelLink,
  CreateChannelLinkBody,
  { rejectValue: string }
>("channelLinks/create", async (body, { rejectWithValue }) => {
  try {
    const res = await showPromise(
      api.post(`/channel/${body.channelId}/links`, {
        title: body.title,
        url: body.url,
        description: body.description,
      }),
      "Saving link…",
      "Link saved"
    );
    return (
      (res.data as any)?.link ?? (res.data as any)?.data ?? res.data
    ) as ChannelLink;
  } catch (err) {
    const msg = extractErrorMessage(err);
    showError(msg);
    return rejectWithValue(msg);
  }
});

export const updateChannelLink = createAsyncThunk<
  ChannelLink,
  UpdateChannelLinkBody,
  { rejectValue: string }
>("channelLinks/update", async (body, { rejectWithValue }) => {
  try {
    const res = await showPromise(
      api.put(
        `/channel/${body.channelId}/links/${body.linkId}`,
        {
          title: body.title,
          url: body.url,
          description: body.description,
        }
      ),
      "Saving link…",
      "Link updated"
    );
    return (
      (res.data as any)?.link ?? (res.data as any)?.data ?? res.data
    ) as ChannelLink;
  } catch (err) {
    const msg = extractErrorMessage(err);
    showError(msg);
    return rejectWithValue(msg);
  }
});

export const deleteChannelLink = createAsyncThunk<
  string,
  DeleteChannelLinkBody,
  { rejectValue: string }
>("channelLinks/delete", async (body, { rejectWithValue }) => {
  try {
    await showPromise(
      api.delete(`/channel/${body.channelId}/links/${body.linkId}`),
      "Deleting link…",
      "Link deleted"
    );
    return body.linkId;
  } catch (err) {
    const msg = extractErrorMessage(err);
    showError(msg);
    return rejectWithValue(msg);
  }
});
