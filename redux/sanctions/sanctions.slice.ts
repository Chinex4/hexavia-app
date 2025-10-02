// redux/sanctions/sanctions.slice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ApiSanction, SanctionsState } from "./sanctions.type";
import {
  fetchSanctions,
  createSanction,
  updateSanction,
} from "./sanctions.thunks";

const initialState: SanctionsState = {
  items: [],
  loading: false,
  error: null,
  creating: false,
  updating: false,
  fetchedFor: {},
};

const sanctionsSlice = createSlice({
  name: "sanctions",
  initialState,
  reducers: {
    resetSanctions(state) {
      state.items = [];
      state.error = null;
      state.loading = false;
      state.creating = false;
      state.updating = false;
      state.fetchedFor = {};
    },
  },
  extraReducers: (builder) => {
    // fetch
    builder.addCase(fetchSanctions.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(
      fetchSanctions.fulfilled,
      (
        state,
        action: PayloadAction<{
          rows: ApiSanction[];
          userIdKey: string | "_all";
        }>
      ) => {
        state.loading = false;
        state.items = action.payload.rows;
        state.fetchedFor[action.payload.userIdKey] = true;
      }
    );
    builder.addCase(fetchSanctions.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || "Failed to fetch sanctions";
    });

    // create
    builder.addCase(createSanction.pending, (state) => {
      state.creating = true;
      state.error = null;
    });
    builder.addCase(createSanction.fulfilled, (state, action) => {
      state.creating = false;
      // prepend newest
      state.items = [action.payload, ...state.items];
    });
    builder.addCase(createSanction.rejected, (state, action) => {
      state.creating = false;
      state.error = action.payload || "Failed to create sanction";
    });

    // update
    builder.addCase(updateSanction.pending, (state) => {
      state.updating = true;
      state.error = null;
    });
    builder.addCase(updateSanction.fulfilled, (state, action) => {
      state.updating = false;
      const idx = state.items.findIndex((s) => s._id === action.payload._id);
      if (idx !== -1) state.items[idx] = action.payload;
    });
    builder.addCase(updateSanction.rejected, (state, action) => {
      state.updating = false;
      state.error = action.payload || "Failed to update sanction";
    });
  },
});

export const { resetSanctions } = sanctionsSlice.actions;
export default sanctionsSlice.reducer;

// Selectors
export const selectSanctionsState = (s: any) => s.sanctions as SanctionsState;
export const selectSanctions = (s: any) =>
  (s.sanctions as SanctionsState).items;
export const selectSanctionsLoading = (s: any) =>
  (s.sanctions as SanctionsState).loading;
export const selectSanctionsError = (s: any) =>
  (s.sanctions as SanctionsState).error;
