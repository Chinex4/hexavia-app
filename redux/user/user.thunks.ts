import { createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "@/api/axios";
import { showPromise, showError, showSuccess } from "@/components/ui/toast";
import { saveUser } from "@/storage/auth";
import type { ApiEnvelope, User } from "@/api/types";

export const fetchProfile = createAsyncThunk<
  User,
  void,
  { rejectValue: string }
>("user/fetchProfile", async (_, { rejectWithValue }) => {
  try {
    const res = await api.get<ApiEnvelope<User>>("/users/profile");

    const user = (res.data.data as User) ?? (res.data as any).user;
    if (!user) throw new Error("Profile not found");
    await saveUser(user);
    return user;
  } catch (err: any) {
    const msg =
      err?.response?.data?.message || err?.message || "Could not load profile";
    showError(msg);
    return rejectWithValue(msg);
  }
});

export const updateProfile = createAsyncThunk<
  User,
  { username?: string; fullname?: string; profilePicture?: string },
  { rejectValue: string }
>("user/updateProfile", async (body, { rejectWithValue }) => {
  try {
    const payload: Record<string, any> = {};
    if (body.username !== undefined) payload.username = body.username;
    if (body.fullname !== undefined) payload.fullname = body.fullname;
    if (body.profilePicture !== undefined)
      payload.profilePicture = body.profilePicture;

    const res = await showPromise(
      api.put<ApiEnvelope<User>>("/users/profile", payload),
      "Updating profile…",
      "Profile updated"
    );

    const user = (res.data.data as User) ?? (res.data as any).user;
    if (!user) throw new Error("No user returned");
    await saveUser(user);
    showSuccess("Saved");
    return user;
  } catch (err: any) {
    const msg = err?.response?.data?.message || err?.message || "Update failed";
    showError(msg);
    return rejectWithValue(msg);
  }
});
