import { createAsyncThunk } from "@reduxjs/toolkit";
import { AxiosError } from "axios";
import { api } from "@/api/axios";
import {
  ApiSanction,
  CreateSanctionBody,
  UpdateSanctionBody,
  SanctionsQuery,
} from "./sanctions.type";
import { showPromise } from "@/components/ui/toast";

export const fetchSanctions = createAsyncThunk<
  { rows: ApiSanction[]; userIdKey: string | "_all" },
  SanctionsQuery | void,
  { rejectValue: string }
>("sanctions/fetch", async (query, thunkAPI) => {
  try {
    const params: Record<string, string> = {};
    if (query?.userId) params.userId = query.userId;

    const { data } = await api.get("/sanction", { params });

    const rowsRaw = Array.isArray(data)
      ? data
      : Array.isArray(data?.sanctions)
        ? data.sanctions
        : Array.isArray(data?.data)
          ? data.data
          : [];

    const rows: ApiSanction[] = rowsRaw.map((s: any) => ({
      ...s,
      createdAt: s.createdAt ?? s.date ?? undefined,
      user: s.user ?? s.sanctionUser ?? undefined,
    }));

    return { rows, userIdKey: query?.userId ?? "_all" };
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

export const createSanction = createAsyncThunk<
  ApiSanction,
  CreateSanctionBody,
  { rejectValue: string }
>("sanctions/create", async (body, { rejectWithValue }) => {
  try {
    const { data } = await showPromise(
      api.post("/sanction/create", body),
      "Creating Sanction...",
      "Sanction given"
    );
    const created = (data as any)?.sanction ?? data;
    return {
      ...created,
      createdAt: created.date ?? undefined,
      user: created.sanctionUser ?? undefined,
    } as ApiSanction;
  } catch (err) {
    const e = err as AxiosError<any>;
    return rejectWithValue(e.response?.data?.message || e.message);
  }
});

export const updateSanction = createAsyncThunk<
  ApiSanction,
  UpdateSanctionBody,
  { rejectValue: string }
>("sanctions/update", async (body, { rejectWithValue }) => {
  try {
    const { data } = await showPromise(
      api.put<ApiSanction>("/sanction/update", body),
      "Updating Sanction",
      "Sanction Updated"
    );

    return data;
  } catch (err) {
    const e = err as AxiosError<any>;
    return rejectWithValue(e.response?.data?.message || e.message);
  }
});
