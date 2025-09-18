import { createSlice } from "@reduxjs/toolkit";
import type { AuthState } from "./types";
import { bootstrapAuthThunk, loginThunk, logoutThunk } from "./thunks";

const initialState: AuthState = { user: null, bootstrapped: false };

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {},
  extraReducers: (b) => {
    b.addCase(loginThunk.fulfilled, (s, a) => {
      s.user = a.payload;
    });
    b.addCase(logoutThunk.fulfilled, (s) => {
      s.user = null;
    });
    b.addCase(bootstrapAuthThunk.fulfilled, (s, a) => {
      s.user = a.payload;
      s.bootstrapped = true;
    });
  },
});

export const authReducer = authSlice.reducer;
