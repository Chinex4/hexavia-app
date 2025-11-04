import React from "react";
import { Pressable, Text, View } from "react-native";

type JoinableChannel = {
  id: string;
  name: string;
  description?: string | null;
  code?: string | null;
};

export default function JoinableChannelCard({
  item,
  onJoin,
  disabled,
}: {
  item: JoinableChannel;
  onJoin: (ch: JoinableChannel) => void;
  disabled?: boolean;
}) {
  return (
    <View className="mx-4 mt-4 rounded-3xl border border-gray-200 p-6 bg-primary">
      <Text className="text-xl text-white font-kumbhBold" numberOfLines={1}>
        {item.name}
      </Text>
      {!!item.description && (
        <Text
          className="mt-2 text-white/60 leading-5 text-[13px] font-kumbh"
          numberOfLines={3}
        >
          {item.description}
        </Text>
      )}
      {!!item.code && (
        <Text className="mt-3 text-white font-kumbh text-[13px]">
          Group Code: {String(item.code).toUpperCase()}
        </Text>
      )}

      <View className="mt-4 items-end">
        <Pressable
          onPress={() => onJoin(item)}
          disabled={disabled}
          className={`px-4 py-2 rounded-xl ${
            disabled ? "bg-gray-200" : "bg-emerald-600"
          }`}
        >
          <Text
            className={`font-kumbh ${disabled ? "text-gray-500" : "text-white"}`}
          >
            {disabled ? "Joined" : "Request to join"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
