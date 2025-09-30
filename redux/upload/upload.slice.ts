import { createSlice } from "@reduxjs/toolkit";
import type { UploadState, UploadResult } from "./upload.types";
import { uploadSingle } from "./upload.thunks";
import type { RootState } from "@/store";
import { setUploadProgress } from "./upload.actions";

const initialState: UploadState = {
  phase: "idle",
  progress: 0,
  error: null,
  last: null,
};

const uploadSlice = createSlice({
  name: "upload",
  initialState,
  reducers: {
    reset(state) {
      state.phase = "idle";
      state.progress = 0;
      state.error = null;
      state.last = null;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(setUploadProgress, (state, { payload }) => {
        state.progress = payload;
      })
      .addCase(uploadSingle.pending, (state) => {
        state.phase = "uploading";
        state.progress = 0;
        state.error = null;
      })
      .addCase(uploadSingle.fulfilled, (state, { payload }) => {
        state.phase = "success";
        state.last = payload as UploadResult;
        state.error = null;
        state.progress = 100;
      })
      .addCase(uploadSingle.rejected, (state, { payload }) => {
        state.phase = "error";
        state.error = (payload as string) || "Upload failed";
      });
  },
});

export const { reset } = uploadSlice.actions;
export default uploadSlice.reducer;

export const selectUpload = (s: RootState) => s.upload as UploadState;
