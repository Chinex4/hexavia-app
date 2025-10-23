// redux/finance/finance.slice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type {
  FinanceState,
  FinanceFilters,
  FinanceRecord,
} from "./finance.types";
import {
  fetchFinance,
  createFinanceRecord,
  updateFinanceRecord,
  deleteFinanceRecord,
} from "./finance.thunks";

const initialState: FinanceState = {
  records: [],
  pagination: null,
  summary: null,

  filters: { page: 1, limit: 50 },

  listLoading: false,
  creating: false,
  updating: false,
  deletingId: null,

  error: null,
};

const financeSlice = createSlice({
  name: "finance",
  initialState,
  reducers: {
    setFinanceFilters(state, action: PayloadAction<Partial<FinanceFilters>>) {
      state.filters = { ...state.filters, ...action.payload };
    },
    setFinancePage(state, action: PayloadAction<number>) {
      state.filters.page = action.payload;
    },
    clearFinanceError(state) {
      state.error = null;
    },
  },
  extraReducers: (b) => {
    // LIST
    b.addCase(fetchFinance.pending, (s) => {
      s.listLoading = true;
      s.error = null;
    });
    b.addCase(fetchFinance.fulfilled, (s, { payload }) => {
      s.listLoading = false;
      s.records = payload.data?.records ?? [];
      s.pagination = payload.data?.pagination ?? null;
      s.summary = payload.data?.summary ?? null;
    });
    b.addCase(fetchFinance.rejected, (s, { payload }) => {
      s.listLoading = false;
      s.error = payload?.message || "Failed to fetch finance";
    });

    // CREATE
    b.addCase(createFinanceRecord.pending, (s) => {
      s.creating = true;
      s.error = null;
    });
    b.addCase(createFinanceRecord.fulfilled, (s) => {
      s.creating = false;
      // caller can refetch list after creating if needed
    });
    b.addCase(createFinanceRecord.rejected, (s, { payload }) => {
      s.creating = false;
      s.error = payload?.message || "Failed to create finance record";
    });

    // UPDATE
    b.addCase(updateFinanceRecord.pending, (s) => {
      s.updating = true;
      s.error = null;
    });
    b.addCase(updateFinanceRecord.fulfilled, (s) => {
      s.updating = false;
    });
    b.addCase(updateFinanceRecord.rejected, (s, { payload }) => {
      s.updating = false;
      s.error = payload?.message || "Failed to update finance record";
    });

    // DELETE
    b.addCase(deleteFinanceRecord.pending, (s, a) => {
      s.deletingId = (a.meta.arg as string) || null;
      s.error = null;
    });
    b.addCase(deleteFinanceRecord.fulfilled, (s, { payload }) => {
      const delId = payload.data?.deletedRecord?._id;
      if (delId) s.records = s.records.filter((r) => r._id !== delId);
      s.deletingId = null;
    });
    b.addCase(deleteFinanceRecord.rejected, (s, { payload }) => {
      s.deletingId = null;
      s.error = payload?.message || "Failed to delete finance record";
    });
  },
});

export const { setFinanceFilters, setFinancePage, clearFinanceError } =
  financeSlice.actions;
export const financeReducer = financeSlice.reducer;
export default financeReducer;