import React from "react";
import { Pressable, Text, View } from "react-native";

export default function FilterChip({
  label,
  onPress,
}: {
  label: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-2 rounded-full bg-white px-4 py-2"
    >
      <Text className="text-sm font-kumbh text-text">{label}</Text>
      <View className="w-5 h-5 rounded-full border border-primary-500" />
    </Pressable>
  );
}
