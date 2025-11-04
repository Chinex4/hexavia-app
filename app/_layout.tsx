// app/_layout.tsx
import React, { useEffect } from "react";
import { Platform, View } from "react-native";
import { Slot, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import { Provider } from "react-redux";
import { persistor, store, type RootState } from "@/store";

import "../global.css";
import { TasksProvider } from "@/features/staff/tasksStore";
import { attachStore } from "@/api/axios";
import Toast from "react-native-toast-message";

import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { PersistGate } from "redux-persist/integration/react";
import { getExpoPushToken } from "@/utils/pushToken";
import { setPushToken } from "@/redux/auth/auth.slice";

SplashScreen.preventAutoHideAsync();
attachStore(store);

/** Global handler (safe at module scope) */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

if (Platform.OS === "android") {
  Notifications.setNotificationChannelAsync("default", {
    name: "Hexavia",
    importance: Notifications.AndroidImportance.MAX,
    sound: "default",
    enableVibrate: true,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });
}

const PENDING_CHANNEL_KEY = "PENDING_CHANNEL_ID";

/** Unify chat path by role → always navigates to channels route */
const chatPathForRole = (role?: string | null | undefined) =>
  role === "client"
    ? "/(client)/(tabs)/chats/[channelId]"
    : role === "staff"
      ? "/(staff)/(tabs)/chats/[channelId]"
      : "/(admin)/chats/[channelId]";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    "KumbhSans-Regular": require("../assets/fonts/KumbhSans-Regular.ttf"),
    "KumbhSans-Light": require("../assets/fonts/KumbhSans-Light.ttf"),
    "KumbhSans-Bold": require("../assets/fonts/KumbhSans-Bold.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <TasksProvider>
          <AppFrame />
        </TasksProvider>
      </PersistGate>
    </Provider>
  );
}

function AppFrame() {
  const role = useAppSelector((s: RootState) => s.auth.user?.role);
  const phase = useAppSelector((s: RootState) => s.auth.phase);
  const dispatch = useAppDispatch();

  useEffect(() => {
    (async () => {
      try {
        const tok = await getExpoPushToken();
        dispatch(setPushToken(tok));
      } catch {
        dispatch(setPushToken(null));
      }
    })();
  }, [dispatch]);

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(
      async (response) => {
        const data = response.notification.request.content.data as any;
        const channelId = data?.channelId as string | undefined;
        const kind = data?.kind as string | undefined;

        if (channelId && phase !== "authenticated") {
          await AsyncStorage.setItem(PENDING_CHANNEL_KEY, channelId);
          return;
        }

        if (kind === "chat" && channelId) {
          router.push({
            pathname: chatPathForRole(role),
            params: { channelId },
          } as any);
          return;
        }

        if (kind === "finance") {
          router.push("/(admin)/finance");
          return;
        }
      }
    );
    return () => sub.remove();
  }, [role, phase]);

  return (
    <View style={{ flex: 1 }}>
      <Slot />
      <Toast
        topOffset={Platform.select({ ios: 60, android: 40 })}
        visibilityTime={2500}
      />
    </View>
  );
}
