// store/index.ts
import { combineReducers, configureStore } from "@reduxjs/toolkit";

import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";

import authReducer from "@/redux/auth/auth.slice";
import userReducer from "@/redux/user/user.slice";
import channelsReducer from "@/redux/channels/channels.slice";
import uploadReducer from "@/redux/upload/upload.slice";
import sanctionsReducer from "@/redux/sanctions/sanctions.slice";
import adminReducer from "@/redux/admin/admin.slice";
import chatReducer from "@/redux/chat/chat.slice";
import clientReducer from "@/redux/client/client.slice";
import installmentsReducer from "@/redux/installments/installments.slice";
import financeReducer from "@/redux/finance/finance.slice";
import personalTasksReducer from "@/redux/personalTasks/personalTasks.slice";
import { chatMiddleware } from "@/redux/chat/chat.middleware";

// 1) Define rootReducer so types don’t depend on the constructed store
export const rootReducer = combineReducers({
  auth: authReducer,
  user: userReducer,
  channels: channelsReducer,
  upload: uploadReducer,
  sanctions: sanctionsReducer,
  admin: adminReducer,
  chat: chatReducer,
  client: clientReducer,
  installments: installmentsReducer,
  finance: financeReducer,
  personalTasks: personalTasksReducer,
});

// 2) Export RootState from the reducer (no circular reference)
export type RootState = ReturnType<typeof rootReducer>;

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // ignore redux-persist actions
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(chatMiddleware),
});

export const persistor = persistStore(store);

export type AppDispatch = typeof store.dispatch;
