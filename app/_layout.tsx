// app/_layout.tsx
import React, { useEffect } from "react";
import { Platform } from "react-native";
import { Slot } from "expo-router"; // or use <Stack /> if you prefer
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import { Provider } from "react-redux";
import { ToastProvider } from "react-native-toast-notifications";

import { store } from "@/store";

import "../global.css";
import { TasksProvider } from "@/features/staff/tasksStore";

SplashScreen.preventAutoHideAsync();

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
      <TasksProvider>
        <ToastProvider
          placement="top"
          duration={2500}
          animationType="zoom-in"
          swipeEnabled
          offsetTop={Platform.select({ ios: 60, android: 40 })}
          style={{ zIndex: 99999 }}
          textStyle={{ fontFamily: "KumbhSans-Regular" }}
          successColor="#16a34a"
          dangerColor="#ef4444"
          warningColor="#f59e0b"
          normalColor="#4C5FAB"
        >
          <Slot />
        </ToastProvider>
      </TasksProvider>
    </Provider>
  );
}
