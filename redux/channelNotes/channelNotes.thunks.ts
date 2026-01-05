import { api } from "@/api/axios";
import { showError, showPromise } from "@/components/ui/toast";
import { extractErrorMessage } from "@/redux/api/extractErrorMessage";
import { createAsyncThunk } from "@reduxjs/toolkit";
import type {
  ChannelNote,
  CreateChannelNoteBody,
  DeleteChannelNoteBody,
  UpdateChannelNoteBody,
} from "./channelNotes.types";

const normalizeNotes = (data: any): ChannelNote[] => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.notes)) return data.notes;
  if (Array.isArray(data?.data?.notes)) return data.data.notes;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

export const fetchChannelNotes = createAsyncThunk<
  ChannelNote[],
  string,
  { rejectValue: string }
>("channelNotes/fetch", async (channelId, { rejectWithValue }) => {
  try {
    const res = await api.get(`/channel/${channelId}/notes`);
    return normalizeNotes(res.data);
  } catch (err) {
    const msg = extractErrorMessage(err);
    showError(msg);
    return rejectWithValue(msg);
  }
});

export const createChannelNote = createAsyncThunk<
  ChannelNote,
  CreateChannelNoteBody,
  { rejectValue: string }
>("channelNotes/create", async (body, { rejectWithValue }) => {
  try {
    const res = await showPromise(
      api.post(`/channel/${body.channelId}/notes`, {
        title: body.title,
        description: body.description,
      }),
      "Saving note…",
      "Note saved"
    );
    return (
      (res.data as any)?.note ?? (res.data as any)?.data ?? res.data
    ) as ChannelNote;
  } catch (err) {
    const msg = extractErrorMessage(err);
    showError(msg);
    return rejectWithValue(msg);
  }
});

export const updateChannelNote = createAsyncThunk<
  ChannelNote,
  UpdateChannelNoteBody,
  { rejectValue: string }
>("channelNotes/update", async (body, { rejectWithValue }) => {
  try {
    const res = await showPromise(
      api.put(
        `/channel/${body.channelId}/notes/${body.noteId}`,
        {
          title: body.title,
          description: body.description,
        }
      ),
      "Saving note…",
      "Note updated"
    );
    return (
      (res.data as any)?.note ?? (res.data as any)?.data ?? res.data
    ) as ChannelNote;
  } catch (err) {
    const msg = extractErrorMessage(err);
    showError(msg);
    return rejectWithValue(msg);
  }
});

export const deleteChannelNote = createAsyncThunk<
  string,
  DeleteChannelNoteBody,
  { rejectValue: string }
>("channelNotes/delete", async (body, { rejectWithValue }) => {
  try {
    await showPromise(
      api.delete(`/channel/${body.channelId}/notes/${body.noteId}`),
      "Deleting note…",
      "Note deleted"
    );
    return body.noteId;
  } catch (err) {
    const msg = extractErrorMessage(err);
    showError(msg);
    return rejectWithValue(msg);
  }
});
