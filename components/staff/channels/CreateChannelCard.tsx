import React from "react";
import { View, Text, Pressable } from "react-native";
import { Plus } from "lucide-react-native";

type Props = {
  width: number;
  gap: number;
  onPress: () => void;
};

export default function CreateChannelCard({ width, gap, onPress }: Props) {
  const CARD_HEIGHT = 200;
  const REDUCED_WIDTH = width * 0.6;

  return (
    <Pressable
      onPress={onPress}
      className="rounded-2xl overflow-hidden"
      style={{ width: REDUCED_WIDTH, marginRight: gap }}
      testID="create-channel-card"
    >
      <View
        className="bg-[#48A7FF] rounded-2xl p-5 justify-between"
        style={{ height: CARD_HEIGHT }}
      >
        <Text className="text-white font-kumbhBold text-xl">
          Create Channel
        </Text>

        <View className="items-center justify-center">
          <View className="h-14 w-14 rounded-2xl bg-white/20 items-center justify-center">
            <Plus size={28} color="#FFFFFF" />
          </View>
        </View>

        <Text className="text-white/90 text-[11px]">
          Start a space for your team to plan and chat.
        </Text>
      </View>
    </Pressable>
  );
}
