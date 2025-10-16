// redux/client/client.selectors.ts
import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "@/store";

const selectClientSlice = (state: RootState) => state.client;

export const selectClientsLoading = (state: RootState) =>
  selectClientSlice(state).listLoading;
export const selectClientMutationLoading = (state: RootState) =>
  selectClientSlice(state).mutationLoading;
export const selectClientDetailLoading = (state: RootState) =>
  selectClientSlice(state).detailLoading;

export const selectClientPagination = (state: RootState) =>
  selectClientSlice(state).pagination;
export const selectClientFilters = (state: RootState) =>
  selectClientSlice(state).filters;
export const selectClientStats = (state: RootState) =>
  selectClientSlice(state).stats;
export const selectClientStatsLoading = (state: RootState) =>
  selectClientSlice(state).statsLoading;

export const selectAllClients = createSelector(selectClientSlice, (s) =>
  s.allIds.map((id: any) => s.byId[id]).filter(Boolean)
);

export const makeSelectClientById = (id: string) =>
  createSelector(selectClientSlice, (s) => s.byId[id]);

export const selectCurrentClient = (state: RootState) =>
  selectClientSlice(state).current || null;
