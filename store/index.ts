import { configureStore } from "@reduxjs/toolkit";
import authReducer from "@/redux/auth/auth.slice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
  middleware: (gdm) =>
    gdm({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type RootStore = typeof store;
