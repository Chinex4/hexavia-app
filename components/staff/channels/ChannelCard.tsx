// components/staff/channels/ChannelCard.tsx
import React from "react";
import { View, Text, Image } from "react-native";

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
}: {
  item: CardChannel;
  colorOverride: string;
}) {
  return (
    <View
      style={{ backgroundColor: colorOverride }}
      className="mx-4 mt-4 rounded-3xl p-6 overflow-hidden"
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
            {!!item.code && (
              <Text className="text-white/90 font-kumbh text-[13px]">
                Channel Code: {item.code.toUpperCase()}
              </Text>
            )}
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
    </View>
  );
}

export default React.memo(ChannelCard);
