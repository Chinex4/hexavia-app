import React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import AuthGate from "@/components/AuthGate";

export default function AdminLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <AuthGate>
        <View style={{ flex: 1 }}>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: "#F3F4F6" }, // tailwind background
              animation: "fade",
            }}
          />
        </View>
      </AuthGate>
    </>
  );
}
