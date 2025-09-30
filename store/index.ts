import { configureStore } from "@reduxjs/toolkit";
import authReducer from "@/redux/auth/auth.slice";
import userReducer from "@/redux/user/user.slice";
import channelsReducer from "@/redux/channels/channels.slice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
    channels: channelsReducer,
  },
  middleware: (gdm) =>
    gdm({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type RootStore = typeof store;
