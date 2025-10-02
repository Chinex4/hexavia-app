// redux/sanctions/sanctions.thunks.ts
import { createAsyncThunk } from "@reduxjs/toolkit";
import { AxiosError } from "axios";
import { api } from "@/api/axios"; // <-- adjust if your axios instance lives elsewhere
import {
  ApiSanction,
  CreateSanctionBody,
  UpdateSanctionBody,
  SanctionsQuery,
} from "./sanctions.type";

// GET /api/sanction?userId=...
export const fetchSanctions = createAsyncThunk<
  { rows: ApiSanction[]; userIdKey: string | "_all" },
  SanctionsQuery | void,
  { rejectValue: string }
>("sanctions/fetch", async (query, thunkAPI) => {
  try {
    const params: Record<string, string> = {};
    if (query?.userId) params.userId = query.userId;

    const { data } = await api.get<ApiSanction[]>("/api/sanction", { params });
    return { rows: data ?? [], userIdKey: query?.userId ?? "_all" };
  } catch (err) {
    const e = err as AxiosError<any>;
    if (e.response?.status === 404) {
      return thunkAPI.fulfillWithValue({
        rows: [],
        userIdKey: query?.userId ?? "_all",
      });
    }
    return thunkAPI.rejectWithValue(e.response?.data?.message || e.message);
  }
});

// POST /api/sanction/create
export const createSanction = createAsyncThunk<
  ApiSanction,
  CreateSanctionBody,
  { rejectValue: string }
>("sanctions/create", async (body, { rejectWithValue }) => {
  try {
    const { data } = await api.post<ApiSanction>("/api/sanction/create", body);
    return data;
  } catch (err) {
    const e = err as AxiosError<any>;
    return rejectWithValue(e.response?.data?.message || e.message);
  }
});

// PUT /api/sanction/update
export const updateSanction = createAsyncThunk<
  ApiSanction,
  UpdateSanctionBody,
  { rejectValue: string }
>("sanctions/update", async (body, { rejectWithValue }) => {
  try {
    const { data } = await api.put<ApiSanction>("/api/sanction/update", body);
    return data;
  } catch (err) {
    const e = err as AxiosError<any>;
    return rejectWithValue(e.response?.data?.message || e.message);
  }
});
