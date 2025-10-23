import React from "react";
import { View, Text } from "react-native";
import { Users } from "lucide-react-native";

export default function StatPill({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View className="flex-1 rounded-2xl bg-white p-4">
      <View className="flex-row items-center gap-2">
        <View className="w-8 h-8 rounded-xl bg-primary-100 items-center justify-center">
          <Users size={16} color="#4c5fab" />
        </View>
        <Text className="text-xs text-gray-600 font-kumbh">{label}</Text>
      </View>
      <Text className="mt-2 text-sm font-kumbhBold text-text">{value}</Text>
    </View>
  );
}
