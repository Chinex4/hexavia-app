// components/staff/channels/HorizontalChannelList.tsx
import React from "react";
import { FlatList, View, Text, Pressable } from "react-native";
import { RefreshCw } from "lucide-react-native";
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
  outerPadding = 20,
  onRefreshPress,
}: {
  items: ChannelCardItem[];
  outerPadding?: number;
  onRefreshPress?: () => void;
}) {
  const { GAP, CARD_WIDTH } = useChannelCardLayout();
  const CARD_WIDTH_NARROW = Math.max(250, CARD_WIDTH - 40);
  const SNAP = CARD_WIDTH_NARROW + GAP;

  const getItemLayout = (_: any, index: number) => ({
    length: SNAP,
    offset: SNAP * index,
    index,
  });

  if (!items || items.length === 0) {
    return (
      <View style={{ marginHorizontal: -outerPadding, marginTop: 10 }}>
        {/* small header row */}
        <View
          style={{
            paddingLeft: outerPadding,
            paddingRight: 8,
            marginBottom: 8,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Text
            style={{
              fontFamily: "KumbhSans_500Medium",
              fontSize: 14,
              color: "#6B7280",
            }}
          >
            No channels yet
          </Text>

          {onRefreshPress ? (
            <Pressable
              onPress={onRefreshPress}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 8,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: "#E5E7EB",
                backgroundColor: "white",
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
              }}
            >
              <RefreshCw size={16} color="#111827" />
              <Text
                style={{
                  color: "#111827",
                  fontFamily: "KumbhSans_500Medium",
                  fontSize: 13,
                }}
              >
                Refresh
              </Text>
            </Pressable>
          ) : null}
        </View>

        {/* ghost cards to preserve the horizontal layout */}
        <FlatList
          horizontal
          data={[0, 1, 2]}
          keyExtractor={(i) => String(i)}
          showsHorizontalScrollIndicator={false}
          bounces={false}
          overScrollMode="never"
          decelerationRate="fast"
          contentContainerStyle={{ paddingLeft: outerPadding, paddingRight: 8 }}
          style={{ height: 200 + 16 }}
          renderItem={() => (
            <View
              style={{
                width: CARD_WIDTH_NARROW,
                height: 200,
                borderRadius: 16,
                marginRight: GAP,
                backgroundColor: "#F3F4F6",
                overflow: "hidden",
                padding: 16,
              }}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  backgroundColor: "#E5E7EB",
                  marginBottom: 12,
                }}
              />
              <View
                style={{
                  height: 14,
                  width: "70%",
                  borderRadius: 6,
                  backgroundColor: "#E5E7EB",
                  marginBottom: 8,
                }}
              />
              <View
                style={{
                  height: 12,
                  width: "50%",
                  borderRadius: 6,
                  backgroundColor: "#E5E7EB",
                  marginBottom: "auto",
                }}
              />
              <View
                style={{
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: "#E5E7EB",
                  marginTop: 16,
                }}
              />
            </View>
          )}
        />
      </View>
    );
  }

  // Normal (non-empty) rendering
  return (
    <View style={{ marginHorizontal: -outerPadding, marginTop: 10 }}>
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
        contentContainerStyle={{ paddingLeft: outerPadding, paddingRight: 8 }}
        style={{ height: 200 + 16 }}
        getItemLayout={getItemLayout}
      />
    </View>
  );
}
