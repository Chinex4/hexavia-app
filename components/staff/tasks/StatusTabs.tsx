import React from "react";
import { Pressable, Text, View } from "react-native";
import { STATUS_META, StatusKey, TAB_ORDER } from "@/features/staff/types";

type Props = { active: StatusKey; onChange: (k: StatusKey) => void };

export default function StatusTabs({ active, onChange }: Props) {
  return (
    <View className="px-5 mt-6">
      <View className="flex-row flex-wrap items-center" style={{ columnGap: 18 }}>
        {TAB_ORDER.map((key) => {
          const isActive = key === active;
          return (
            <Pressable key={key} onPress={() => onChange(key)}>
              <View className="items-start">
                <Text
                  className="font-kumbh text-[13px]"
                  style={{ color: isActive ? "#111827" : "#6B7280" }}
                >
                  {STATUS_META[key].title}
                </Text>
                <View
                  className="mt-1"
                  style={{
                    height: 2,
                    width: 64,
                    backgroundColor: isActive ? "#111827" : "transparent",
                  }}
                />
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
