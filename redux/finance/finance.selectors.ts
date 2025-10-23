// redux/finance/finance.selectors.ts
import { RootState } from "@/store";

export const selectFinanceState = (s: RootState) => s.finance;

export const selectFinanceRecords = (s: RootState) => s.finance.records;
export const selectFinancePagination = (s: RootState) => s.finance.pagination;
export const selectFinanceSummary = (s: RootState) => s.finance.summary;

export const selectFinanceFilters = (s: RootState) => s.finance.filters;

export const selectFinanceListLoading = (s: RootState) => s.finance.listLoading;
export const selectFinanceCreating = (s: RootState) => s.finance.creating;
export const selectFinanceUpdating = (s: RootState) => s.finance.updating;
export const selectFinanceDeletingId = (s: RootState) => s.finance.deletingId;

export const selectFinanceError = (s: RootState) => s.finance.error;
