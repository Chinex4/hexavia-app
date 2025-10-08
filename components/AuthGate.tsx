import React from "react";
import { View, ActivityIndicator } from "react-native";
import { useAppSelector } from "@/store/hooks";
import { RootState } from "@/store";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { hydrated, phase } = useAppSelector((s: RootState) => s.auth);

  const blocking = !hydrated || phase === "loading";
  if (blocking) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  return <>{children}</>;
}
