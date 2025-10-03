import React from "react";
import { View, Text } from "react-native";

export default function ProgressRow({
  label,
  percent,
}: {
  label: string;
  percent: number;
}) {
  const pct = Math.max(0, Math.min(100, percent));
  return (
    <View>
      <Text className="text-sm text-text mb-1 font-kumbh">{label}</Text>
      <View className="h-3 rounded-full bg-primary-100 overflow-hidden">
        <View
          className="h-3 bg-primary-500 rounded-full"
          style={{ width: `${pct}%` }}
        />
      </View>
    </View>
  );
}
