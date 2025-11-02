import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "@/store";

export const selectPersonalTasksState = (s: RootState) => s.personalTasks;

export const selectPersonalTasksStatus = (s: RootState) =>
  s.personalTasks.status;

export const selectAllPersonalTasks = createSelector(
  selectPersonalTasksState,
  (st) => st.order.map((id) => st.items[id]).filter(Boolean)
);

export const makeSelectPersonalTasksByStatus = (status: string) =>
  createSelector(selectAllPersonalTasks, (list) =>
    list.filter((t) => t.status === status)
  );
