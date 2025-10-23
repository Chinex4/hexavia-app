// redux/installments/installments.selectors.ts
import { RootState } from "@/store";

export const selectInstallmentsState = (s: RootState) => s.installments;

export const selectClientId = (s: RootState) => s.installments.clientId;
export const selectRows = (s: RootState) => s.installments.rows;
export const selectTotalAmount = (s: RootState) => s.installments.totalAmount;
export const selectAmountPaid = (s: RootState) => s.installments.amountPaid;

export const selectAdding = (s: RootState) => s.installments.adding;
export const selectDeleting = (s: RootState) => s.installments.deleting;
export const selectInstallmentsError = (s: RootState) => s.installments.error;
export const selectInstallmentsErrorDetail = (s: RootState) =>
  s.installments.errorDetail;

export const selectLastAdd = (s: RootState) => s.installments.lastAdd;
export const selectLastDelete = (s: RootState) => s.installments.lastDelete;

/** Derived: numeric totals */
export const selectDerivedRemaining = (s: RootState) => {
  const total = Number(s.installments.totalAmount || 0);
  const paid = Number(s.installments.amountPaid || 0);
  return Math.max(total - paid, 0);
};
