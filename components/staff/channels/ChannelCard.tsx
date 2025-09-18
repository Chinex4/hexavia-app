import React from "react";
import { View, Text, Image } from "react-native";
import MemberStack from "../../MemberStack";

type Channel = {
  id: string;
  name: string;
  description: string;
  department: string;
  memberAvatars: string[];
  logo: string;
  color: string;
  membersCount: number;
  unread?: boolean;
};

export default function ChannelCard({ item }: { item: Channel }) {
  return (
    <View
      style={{ backgroundColor: item.color }}
      className="mx-4 mt-4 rounded-3xl p-6 overflow-hidden"
    >
      <View className="flex-row">
        <View className="flex-1">
          <Text className="text-white text-3xl font-kumbhBold">
            {item.name}
          </Text>
        </View>

        <View className="items-center">
          <Image
            source={{ uri: item.logo }}
            style={{
              width: 72,
              height: 72,
              borderRadius: 88,
              borderWidth: 4,
              borderColor: "white",
            }}
          />
        </View>
      </View>

      <View className="mt-4 flex-row justify-between items-end">
        <Text className="text-white/90 mt-4 leading-5 text-[13px] font-kumbh w-44">
          {item.description}
        </Text>
        <MemberStack avatars={item.memberAvatars} />
      </View>
    </View>
  );
}
