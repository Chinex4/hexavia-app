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
        from: filters?.from,
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

export const fetchDeletedClients = createAsyncThunk<
  ClientListResponse,
  void
>("client/fetchDeletedClients", async (_, { rejectWithValue, signal }) => {
  try {
    const { data } = await api.get<ClientListResponse>(
      "/admin/clients/deleted",
      { signal }
    );
    return data;
  } catch (err: any) {
    const status = err?.response?.status;
    const retryAfter = err?.response?.headers?.["retry-after"] ?? null;

    return rejectWithValue({
      code: status ?? 0,
      message:
        err?.response?.data?.message ||
        err?.message ||
        "Failed to fetch deleted clients",
      retryAfter,
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
      const documentFile = (payload as any)?.documentFile as
        | { uri: string; name: string; type?: string }
        | undefined;

      let data: { success: boolean; message: string; client: Client };
      if (documentFile?.uri) {
        const form = new FormData();
        Object.entries(payload as any).forEach(([key, value]) => {
          if (key === "documentFile" || value === undefined || value === null) {
            return;
          }
          form.append(key, String(value));
        });
        form.append("document", {
          uri: documentFile.uri,
          name: documentFile.name,
          type: documentFile.type ?? "application/pdf",
        } as any);

        const res = await api.post("/admin/clients", form, {
          headers: { Accept: "application/json" },
          transformRequest: (v) => v,
        });
        data = res.data;
      } else {
        const res = await api.post<{
          success: boolean;
          message: string;
          client: Client;
        }>("/admin/clients", payload);
        data = res.data;
      }
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
    const documentFile = (body as any)?.documentFile as
      | { uri: string; name: string; type?: string }
      | undefined;

    const req = documentFile?.uri
      ? (() => {
          const form = new FormData();
          Object.entries(body as any).forEach(([key, value]) => {
            if (key === "documentFile" || value === undefined || value === null) {
              return;
            }
            form.append(key, String(value));
          });
          form.append("document", {
            uri: documentFile.uri,
            name: documentFile.name,
            type: documentFile.type ?? "application/pdf",
          } as any);
          return api.put(`/admin/clients/${id}`, form, {
            headers: { Accept: "application/json" },
            transformRequest: (v) => v,
          });
        })()
      : api.put<{
          success: boolean;
          message: string;
          client: Client;
        }>(`/admin/clients/${id}`, body);

    const { data } = await showPromise(
      req,
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
