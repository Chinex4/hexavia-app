import React from "react";
import { Stack, usePathname, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Pressable, Text, View } from "react-native";
import { Home } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AuthGate from "@/components/AuthGate";

export default function AdminLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const showHomeShortcut = pathname !== "/";

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
          >
            <Stack.Screen name="index" />
            {/* Future admin routes:
                <Stack.Screen name="clients/index" />
                <Stack.Screen name="channels/index" />
                <Stack.Screen name="team/index" />
                <Stack.Screen name="finance/index" />
            */}
          </Stack>

          {showHomeShortcut ? (
            <View
              pointerEvents="box-none"
              style={{
                position: "absolute",
                left: 16,
                bottom: Math.max(insets.bottom + 12, 24),
              }}
            >
              <Pressable
                onPress={() => router.replace("/(admin)")}
                className="flex-row items-center gap-2 rounded-full px-4 py-3 bg-[#111827]"
                accessibilityRole="button"
                accessibilityLabel="Go to admin home"
              >
                <Home size={16} color="#FFFFFF" />
                <Text className="text-white font-kumbh text-sm">Home</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </AuthGate>
    </>
  );
}
