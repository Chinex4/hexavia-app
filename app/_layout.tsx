// app/_layout.tsx
import React, { useEffect } from "react";
import { Platform, View } from "react-native";
import { Slot } from "expo-router";
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
import { router } from "expo-router";
import { useAppSelector } from "@/store/hooks";
import { PersistGate } from "redux-persist/integration/react";

SplashScreen.preventAutoHideAsync();
attachStore(store);

/** Global handler (safe at module scope) */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: false,
    shouldShowList: false,
  }),
});

const PENDING_CHANNEL_KEY = "PENDING_CHANNEL_ID";
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

  // ✅ No selectors here
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

/** Everything that needs Redux hooks goes here (inside Provider) */
function AppFrame() {
  const role = useAppSelector((s: RootState) => s.auth.user?.role);
  const phase = useAppSelector((s: RootState) => s.auth.phase);

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(
      async (response) => {
        const channelId = response.notification.request.content.data
          ?.channelId as string | undefined;

        if (!channelId) return;

        // If auth not ready yet, stash and Splash/index will route later
        if (phase !== "authenticated") {
          await AsyncStorage.setItem(PENDING_CHANNEL_KEY, channelId);
          return;
        }

        router.push({
          pathname: chatPathForRole(role),
          params: { channelId },
        } as any);
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
