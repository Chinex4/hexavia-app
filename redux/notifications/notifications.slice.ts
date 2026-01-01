import type { RootState } from "@/store";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { AppNotification } from "./notification.types";
import { fetchNotifications, sendMassNotification } from "./notifications.thunks";

type Status = "idle" | "loading" | "succeeded" | "failed";

export interface NotificationsState {
  items: AppNotification[];
  status: Status;
  error: string | null;
}

const initialState: NotificationsState = {
  items: [],
  status: "idle",
  error: null,
};

const notificationsSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<AppNotification>) => {
      state.items.unshift(action.payload);
    },
    clearNotifications: (state) => {
      state.items = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Failed to fetch notifications";
      })
      .addCase(sendMassNotification.pending, (state) => {
        // Optional: set loading for send
      })
      .addCase(sendMassNotification.fulfilled, (state) => {
        // Optional: handle success
      })
      .addCase(sendMassNotification.rejected, (state) => {
        // Optional: handle error
      });
  },
});

export const { addNotification, clearNotifications } = notificationsSlice.actions;

export const selectNotifications = (state: RootState) => state.notifications.items;
export const selectNotificationsStatus = (state: RootState) => state.notifications.status;
export const selectNotificationsError = (state: RootState) => state.notifications.error;

export default notificationsSlice.reducer;