import React from "react";
import { Image, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";

interface ChannelCardItem {
  id: string;
  title: string;
  subtitle: string;
  logo?: string;
  color: string;
  code: string;
}

type Props = {
  item: ChannelCardItem;
  width: number;
  gap: number;
};

function ChannelCard({ item, width, gap }: Props) {
  const router = useRouter();
  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: "/(staff)/(tabs)/chats/[channelId]" as any,
          params: { channelId: item.id },
        })
      }
      style={{ width, marginRight: gap }}
    >
      <View
        className="rounded-2xl p-4"
        style={{
          backgroundColor: item.color,
          height: 200,
          justifyContent: "space-between",
        }}
      >
        <View className="flex-row justify-between">
          <Text
            className="text-white text-3xl font-kumbhBold"
            numberOfLines={1}
          >
            {item.title}
          </Text>
          {/* <View className="size-16 rounded-full overflow-hidden border border-white/40">
            {item.logo ? (
              <Image source={{ uri: item.logo }} className="h-full w-full" />
            ) : (
              <View className="h-full w-full bg-white/30" />
            )}
          </View> */}
        </View>

        {/* Bottom (no member avatars to keep it clean & light) */}
        <View className="mt-4 flex-row justify-between items-center">
          <Text
            className="text-white/90 w-[89px] leading-5 text-[13px] font-kumbh"
            numberOfLines={3}
          >
            {item.subtitle}
          </Text>
          <Text className="text-white/90 font-kumbh text-[12px]">
            Channel Code: {item.code}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export default React.memo(ChannelCard);
