import React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function AdminLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#F3F4F6" }, // tailwind background
          animation: "fade",
        }}
      >
        <Stack.Screen name="index" />
        {/* Future admin routes:
            <Stack.Screen name="clients/index" />
            <Stack.Screen name="channels/index" />
            <Stack.Screen name="team/index" />
            <Stack.Screen name="finance/index" />
        */}
      </Stack>
    </>
  );
}
