// components/staff/channels/ChannelCard.tsx
import { useRouter } from "expo-router";
import React from "react";
import { Image, Pressable, Text, View } from "react-native";

type CardChannel = {
  id: string;
  name: string;
  description?: string | null;
  logo?: string | null;
  code?: string;
};

function ChannelCard({
  item,
  colorOverride,
  isMember = true,
  onJoin,
}: {
  item: CardChannel;
  colorOverride: string;
  isMember?: boolean;
  onJoin?: (code: string) => void;
}) {
  const router = useRouter();

  const handlePress = () => {
    router.push({
      pathname: "/(staff)/(tabs)/chats/[channelId]" as any,
      params: { channelId: item.id },
    });
  };

  return (
    <Pressable
      onPress={handlePress}
      android_ripple={{ color: "#eee" }}
      style={{ backgroundColor: colorOverride }}
      className="mx-4 mt-4 rounded-2xl p-6 overflow-hidden"
    >
      <View className="flex-row">
        <View className="flex-1 pr-3">
          <Text
            className="text-white text-3xl font-kumbhBold"
            numberOfLines={1}
          >
            {item.name}
          </Text>

          <View className="mt-24 flex-row justify-between items-center">
            {!!item.description && (
              <Text
                className="text-white/90 leading-5 text-[13px] font-kumbh"
                numberOfLines={3}
              >
                {item.description}
              </Text>
            )}
            <View className="flex-row items-center">
              {!!item.code && (
                <Text className="text-white/90 font-kumbh text-[13px]">
                  Project Code: {item.code.toUpperCase()}
                </Text>
              )}
            </View>
          </View>
        </View>

        {!!item.logo && (
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
        )}
      </View>
    </Pressable>
  );
}

export default React.memo(ChannelCard);
