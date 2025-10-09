import React from "react";
import { FlatList, View } from "react-native";
import useChannelCardLayout from "@/hooks/useChannelCardLayout";
import SkeletonChannelCard from "@/components/staff/channels/SkeletonChannelCard";

export default function HorizontalChannelSkeletonList({
  count = 4,
  outerPadding = 20,
}: {
  count?: number;
  outerPadding?: number;
}) {
  const { GAP, CARD_WIDTH } = useChannelCardLayout();
  const CARD_WIDTH_NARROW = Math.max(250, CARD_WIDTH - 40);
  const SNAP = CARD_WIDTH_NARROW + GAP;

  const data = Array.from({ length: count }, (_, i) => `s-${i}`);

  const getItemLayout = (_: any, index: number) => ({
    length: SNAP,
    offset: SNAP * index,
    index,
  });

  return (
    <View style={{ marginHorizontal: -outerPadding }}>
      <FlatList
        horizontal
        data={data}
        keyExtractor={(k) => k}
        renderItem={() => (
          <View style={{ width: CARD_WIDTH_NARROW, marginRight: GAP }}>
            <SkeletonChannelCard width={CARD_WIDTH_NARROW} gap={GAP} />
          </View>
        )}
        showsHorizontalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
        decelerationRate="fast"
        contentContainerStyle={{ paddingLeft: outerPadding, paddingRight: 8 }}
        style={{ height: 200 + 16 }}
        getItemLayout={getItemLayout}
      />
    </View>
  );
}
