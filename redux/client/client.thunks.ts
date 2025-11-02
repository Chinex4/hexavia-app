import { createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "@/api/axios";
import { showError, showPromise } from "@/components/ui/toast";
import type {
  Client,
  ClientCreateInput,
  ClientListResponse,
  ClientUpdateInput,
  ClientFilters,
  ClientStats,
} from "./client.types";

export const fetchClients = createAsyncThunk<
  ClientListResponse,
  ClientFilters | undefined
>("client/fetchClients", async (filters, { rejectWithValue, signal }) => {
  try {
    const { data } = await api.get<ClientListResponse>("/admin/clients", {
      params: {
        status: filters?.status,
        industry: filters?.industry,
        engagement: filters?.engagement,
        page: filters?.page ?? 1,
        limit: filters?.limit ?? 10,
        sortBy: filters?.sortBy,
        sortOrder: filters?.sortOrder ?? "desc",
      },
      signal,
    });
    return data;
  } catch (err: any) {
    const status = err?.response?.status;
    const retryAfter = err?.response?.headers?.["retry-after"] ?? null;

    // return structured payload; DO NOT toast here
    return rejectWithValue({
      code: status ?? 0,
      message:
        err?.response?.data?.message ||
        err?.message ||
        "Failed to fetch clients",
      retryAfter,
      // custom marker set by interceptor when it gave up retrying
      gaveUpAfterRetries: err?.__gaveUp429 === true,
    });
  }
});

export const fetchClientById = createAsyncThunk<Client, string>(
  "client/fetchClientById",
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await api.get<{ success: boolean; client: Client }>(
        `/admin/clients/${id}`
      );
      return data.client;
    } catch (err: any) {
      const status = err?.response?.status;
      const retryAfter = err?.response?.headers?.["retry-after"] ?? null;

      // return structured payload; DO NOT toast here
      return rejectWithValue({
        code: status ?? 0,
        message:
          err?.response?.data?.message ||
          err?.message ||
          "Failed to fetch client",
        retryAfter,
        // custom marker set by interceptor when it gave up retrying
        gaveUpAfterRetries: err?.__gaveUp429 === true,
      });
    }
  }
);

export const createClient = createAsyncThunk<Client, ClientCreateInput>(
  "client/createClient",
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await api.post<{
        success: boolean;
        message: string;
        client: Client;
      }>("/admin/clients", payload);
      return data.client;
    } catch (err: any) {
      const status = err?.response?.status;
      const retryAfter = err?.response?.headers?.["retry-after"] ?? null;

      // return structured payload; DO NOT toast here
      return rejectWithValue({
        code: status ?? 0,
        message:
          err?.response?.data?.message ||
          err?.message ||
          "Failed to create client",
        retryAfter,
        // custom marker set by interceptor when it gave up retrying
        gaveUpAfterRetries: err?.__gaveUp429 === true,
      });
    }
  }
);

export const updateClient = createAsyncThunk<
  Client,
  { id: string; body: ClientUpdateInput }
>("client/updateClient", async ({ id, body }, { rejectWithValue }) => {
  try {
    const { data } = await showPromise(
      api.put<{
        success: boolean;
        message: string;
        client: Client;
      }>(`/admin/clients/${id}`, body),
      "Updating Client Details",
      "Client details updated"
    );
    return data.client;
  } catch (err: any) {
    const status = err?.response?.status;
    const retryAfter = err?.response?.headers?.["retry-after"] ?? null;

    // return structured payload; DO NOT toast here
    return rejectWithValue({
      code: status ?? 0,
      message:
        err?.response?.data?.message ||
        err?.message ||
        "Failed to update client",
      retryAfter,
      // custom marker set by interceptor when it gave up retrying
      gaveUpAfterRetries: err?.__gaveUp429 === true,
    });
  }
});

export const patchClient = createAsyncThunk<
  Client,
  { id: string; body: Partial<Pick<Client, "status" | "payableAmount">> }
>("client/patchClient", async ({ id, body }, { rejectWithValue }) => {
  try {
    const { data } = await api.patch<{
      success: boolean;
      message: string;
      client: Client;
    }>(`/admin/clients/${id}`, body);
    return data.client;
  } catch (err: any) {
    const status = err?.response?.status;
    const retryAfter = err?.response?.headers?.["retry-after"] ?? null;

    // return structured payload; DO NOT toast here
    return rejectWithValue({
      code: status ?? 0,
      message:
        err?.response?.data?.message ||
        err?.message ||
        "Failed to update clients",
      retryAfter,
      // custom marker set by interceptor when it gave up retrying
      gaveUpAfterRetries: err?.__gaveUp429 === true,
    });
  }
});

export const deleteClient = createAsyncThunk<string, string>(
  "client/deleteClient",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete<{ success: boolean; message: string }>(
        `/admin/clients/${id}`
      );
      return id;
    } catch (err: any) {
      const status = err?.response?.status;
      const retryAfter = err?.response?.headers?.["retry-after"] ?? null;

      // return structured payload; DO NOT toast here
      return rejectWithValue({
        code: status ?? 0,
        message:
          err?.response?.data?.message ||
          err?.message ||
          "Failed to delete client",
        retryAfter,
        // custom marker set by interceptor when it gave up retrying
        gaveUpAfterRetries: err?.__gaveUp429 === true,
      });
    }
  }
);

export const fetchClientStats = createAsyncThunk<ClientStats>(
  "client/fetchClientStats",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get<{ success: boolean; stats: ClientStats }>(
        "/admin/clients/stats"
      );
      return data.stats;
    } catch (err: any) {
      const status = err?.response?.status;
      const retryAfter = err?.response?.headers?.["retry-after"] ?? null;

      // return structured payload; DO NOT toast here
      return rejectWithValue({
        code: status ?? 0,
        message:
          err?.response?.data?.message ||
          err?.message ||
          "Failed to load client stats",
        retryAfter,
        // custom marker set by interceptor when it gave up retrying
        gaveUpAfterRetries: err?.__gaveUp429 === true,
      });
    }
  }
);
