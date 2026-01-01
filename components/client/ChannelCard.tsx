import { useRouter } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";

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
  isMember?: boolean;
  onJoin?: (code: string) => void;
};

function ChannelCard({ item, width, gap, isMember = true, onJoin }: Props) {
  const router = useRouter();

  const handlePress = () => {
    if (isMember) {
      router.push({
        pathname: "/(client)/(tabs)/chats/[channelId]" as any,
        params: { channelId: item.id },
      });
    } else if (onJoin) {
      onJoin(item.code);
    }
  };

  return (
    <Pressable
      onPress={handlePress}
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
        <View className="mt-4 flex-row justify-between items-end">
          <Text
            className="text-white/90 flex-1 leading-5 text-[13px] font-kumbh"
            numberOfLines={2}
          >
            {item.subtitle}
          </Text>
          <View className="ml-2">
            {isMember ? (
              <Text className="text-white/90 font-kumbh text-[12px]">
                Code: {item.code}
              </Text>
            ) : (
              <View className="bg-white/20 px-3 py-1 rounded-full">
                <Text className="text-white font-kumbh text-[12px]">Join</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export default React.memo(ChannelCard);
