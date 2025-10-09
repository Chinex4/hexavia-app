// components/staff/channels/HorizontalChannelList.tsx
import React, { useMemo } from "react";
import { FlatList, View } from "react-native";
import ChannelCard from "@/components/client/ChannelCard";
import useChannelCardLayout from "@/hooks/useChannelCardLayout";

type ChannelCardItem = {
  id: string;
  title: string;
  subtitle: string;
  logo?: string;
  color: string;
  code: string;
};

export default function HorizontalChannelList({
  items,
  outerPadding = 20, // matches px-5 on your ScrollView
}: {
  items: ChannelCardItem[];
  outerPadding?: number;
}) {
  const { GAP, CARD_WIDTH } = useChannelCardLayout();
  const CARD_WIDTH_NARROW = Math.max(250, CARD_WIDTH - 40);
  const SNAP = CARD_WIDTH_NARROW + GAP;

  // stable key & layout
  const getItemLayout = (_: any, index: number) => ({
    length: SNAP,
    offset: SNAP * index,
    index,
  });

  // remove the ScrollView’s left padding visually, but keep right padding
  return (
    <View style={{ marginHorizontal: -outerPadding , marginTop: 10 }}>
      <FlatList
        horizontal
        data={items}
        keyExtractor={(it) => it.id}
        renderItem={({ item }) => (
          <ChannelCard item={item} width={CARD_WIDTH_NARROW} gap={GAP} />
        )}
        showsHorizontalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
        decelerationRate="fast"
        // restore the left padding inside the list so text above stays aligned
        contentContainerStyle={{ paddingLeft: outerPadding, paddingRight: 8 }}
        style={{ height: 200 + 16 }}
        getItemLayout={getItemLayout}
      />
    </View>
  );
}
