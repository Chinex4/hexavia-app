import React from "react";
import { View, Text } from "react-native";

export default function BoardCard({
  project,
  title,
  description,
  statusLabel,
}: {
  project: string;
  title: string;
  description?: string | null;
  statusLabel: string;
}) {
  return (
    <View
      className="mx-4 mt-4 rounded-3xl px-5 pt-5 pb-4"
      style={{ backgroundColor: "#7380BD" }}
    >
      <View className="flex-row items-center justify-between">
        <Text className="text-white font-kumbhBold text-[18px]">{project}</Text>
        {/* dummy icons in screenshot — omit actions for now */}
        <Text className="text-white/80">⋮</Text>
      </View>

      <View className="h-[1px] bg-white/40 my-3" />

      <Text className="text-white font-kumbhBold text-[22px]">{title}</Text>
      {!!description && (
        <Text className="text-white/90 font-kumbh mt-1">{description}</Text>
      )}

      <View
        className="mt-3 self-start px-3 py-1 rounded-full"
        style={{ backgroundColor: "#D1FAE5" }}
      >
        <Text
          className="text-[12px] font-kumbhBold"
          style={{ color: "#047857" }}
        >
          {statusLabel}
        </Text>
      </View>
    </View>
  );
}
