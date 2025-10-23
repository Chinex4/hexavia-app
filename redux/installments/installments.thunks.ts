import { createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "@/api/axios";
import type {
  AddInstallmentsPayload,
  AddInstallmentsSuccess,
  DeleteInstallmentPayload,
  DeleteInstallmentSuccess,
  InstallmentsErrorDetail,
} from "./installments.types";

/** Helper to normalize Axios errors into our expected shape */
function toRejectValue(err: any): {
  message: string;
  details?: InstallmentsErrorDetail["details"];
} {
  // Prefer backend payload if provided
  const data = err?.response?.data;
  if (data && typeof data === "object") {
    return {
      message: data.message ?? "Request failed",
      details: data.details ?? undefined,
    };
  }
  return { message: err?.message || "Network error" };
}

/** POST /admin/clients/installmental-payment/add */
export const addClientInstallments = createAsyncThunk<
  AddInstallmentsSuccess,
  AddInstallmentsPayload,
  {
    rejectValue: {
      message: string;
      details?: InstallmentsErrorDetail["details"];
    };
  }
>("installments/addClientInstallments", async (body, { rejectWithValue }) => {
  try {
    const { data } = await api.post<AddInstallmentsSuccess>(
      "/admin/clients/installmental-payment/add",
      body
    );
    return data;
  } catch (err: any) {
    return rejectWithValue(toRejectValue(err));
  }
});

/** DELETE /admin/clients/installmental-payment/delete */
export const deleteClientInstallment = createAsyncThunk<
  DeleteInstallmentSuccess,
  DeleteInstallmentPayload,
  { rejectValue: { message: string } }
>("installments/deleteClientInstallment", async (body, { rejectWithValue }) => {
  try {
    const { data } = await api.delete<DeleteInstallmentSuccess>(
      "/admin/clients/installmental-payment/delete",
      { data: body }
    );
    return data;
  } catch (err: any) {
    return rejectWithValue({
      message: err?.response?.data?.message || err.message || "Request failed",
    });
  }
});
