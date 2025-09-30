// app/_layout.tsx
import React, { useEffect } from "react";
import { Platform, View } from "react-native";
import { Slot } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import { Provider } from "react-redux";
import { store } from "@/store";

import "../global.css";
import { TasksProvider } from "@/features/staff/tasksStore";
import { attachStore } from "@/api/axios";
import Toast from "react-native-toast-message";

SplashScreen.preventAutoHideAsync();

attachStore(store);

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
        <View style={{ flex: 1 }}>
          <Slot />
          <Toast
            topOffset={Platform.select({ ios: 60, android: 40 })}
            visibilityTime={2500}
          />
        </View>
      </TasksProvider>
    </Provider>
  );
}
