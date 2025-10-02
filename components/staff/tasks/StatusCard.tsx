import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { STATUS_META, StatusKey } from "@/features/staff/types";
import { router } from "expo-router";

type Props = { status: StatusKey };

export default function StatusCard({ status }: Props) {
  const meta = STATUS_META[status];
  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: "/(staff)/tasks/[status]",
          params: { status },
        })
      }
      android_ripple={{ color: "#ffffff30" }}
      className="rounded-2xl p-5"
      style={{ backgroundColor: meta.bgColor }}
    >
      <View className="flex-row items-start justify-between">
        <View style={{ flex: 1, paddingRight: 12 }}>
          <Text className="font-kumbh text-white text-[22px] leading-8">
            {meta.title}
          </Text>
          <View
            className="flex-row items-center"
            style={{ gap: 16, marginTop: 16 }}
          >
            <Text className="font-kumbh text-white/90 text-[14px]">
              View Tasks
            </Text>
            <View
              className="h-8 w-8 rounded-full items-center justify-center"
              style={{ backgroundColor: meta.arrowBg }}
            >
              <Ionicons name="arrow-forward" size={12} color="#FFFFFF" />
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}
