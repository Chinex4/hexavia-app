import React from "react";
import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";

export default function BackHeader({ title }: { title: string }) {
  const router = useRouter();
  return (
    <View className="mt-2 flex-row items-center justify-between px-4 pt-4 pb-2">
      <Pressable
        onPress={() => router.back()}
        className="h-10 w-10 rounded-full items-center justify-center"
        android_ripple={{ color: "#e5e7eb", radius: 24 }}
      >
        <Ionicons name="chevron-back" size={24} color="#111827" />
      </Pressable>
      <Text className="ml-2 text-3xl font-kumbh text-gray-900">
        {title}
      </Text>
      <View className="w-10" />
    </View>
  );
}
