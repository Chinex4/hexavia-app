import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Bell, ChevronRight } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import { FlatList, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AvatarPlaceholder from "@/components/staff/AvatarPlaceHolder";
import ChannelCard from "@/components/staff/ChannelCard";
import SanctionCard from "@/components/staff/SanctionCard";
import TaskOverview from "@/components/staff/TaskOverviewCard";
import CreateChannelCard from "@/components/staff/channels/CreateChannelCard";
import CreateChannelModal from "@/components/staff/channels/CreateChannelModal";
import useChannelCardLayout from "@/hooks/useChannelCardLayout";

type Channel = {
  id: string;
  title: string;
  subtitle: string;
  color: string;
  logo?: string;
  memberAvatars?: string[];
};

type ListItem =
  | ({ kind: "create" } & { id: "create" })
  | ({ kind: "channel" } & Channel);

const baseChannels: Channel[] = [
  {
    id: "1",
    title: "FinTeam",
    subtitle:
      "Horizontal swipeable carousel of channel cards PR/Marketing Channel",
    color: "#14D699",
    memberAvatars: [
      "https://i.pravatar.cc/100?img=1",
      "https://i.pravatar.cc/100?img=2",
      "https://i.pravatar.cc/100?img=3",
      "https://i.pravatar.cc/100?img=4",
      "https://i.pravatar.cc/100?img=5",
    ],
  },
  {
    id: "2",
    title: "ZEETeam",
    subtitle:
      "Horizontal swipeable carousel of channel cards PR/Marketing Channel",
    color: "#60A5FA",
    memberAvatars: [
      "https://i.pravatar.cc/100?img=1",
      "https://i.pravatar.cc/100?img=2",
      "https://i.pravatar.cc/100?img=3",
      "https://i.pravatar.cc/100?img=4",
      "https://i.pravatar.cc/100?img=5",
    ],
  },
];

export default function StaffHome() {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const { PAGE_PAD, GAP, CARD_WIDTH, SNAP } = useChannelCardLayout();

  // Build list with the "create" card first
  const listData: ListItem[] = useMemo(
    () => [
      { kind: "create", id: "create" },
      ...baseChannels.map((c) => ({ ...c, kind: "channel" as const })),
    ],
    []
  );

  const LEFT_PAD = 12; // keep your visual padding
  const ITEM_GAP = GAP; // from useChannelCardLayout()
  const ITEM_WIDTH = CARD_WIDTH;
  const INTERVAL = ITEM_WIDTH + ITEM_GAP;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        className="px-5"
        showsVerticalScrollIndicator={false}
      >
        {/* Top Bar */}
        <View className="flex-row items-center justify-between mt-8">
          <AvatarPlaceholder />
          <View className="flex-1 ml-3">
            <Text className="text-3xl text-gray-900 font-kumbhBold">Hi Nj</Text>
            <View className="self-start mt-2 rounded-full border border-emerald-300 px-3 py-1">
              <Text className="text-emerald-600 text-[12px] font-kumbhBold">
                Project Manager
              </Text>
            </View>
          </View>

          <Pressable className="h-11 w-11 items-center justify-center rounded-2xl bg-gray-100">
            <Bell size={20} color="#111827" />
          </Pressable>
        </View>

        {/* Channels */}
        <View className="mt-6 flex-row items-center justify-between">
          <Text className="text-3xl text-gray-900 font-kumbh">Channels</Text>
          <Pressable
            onPress={() => router.push("/(staff)/channels")}
            className="flex-row items-center"
          >
            <Text className="text-primary mr-1 font-sans">See all</Text>
            <ChevronRight size={16} color="#4C5FAB" />
          </Pressable>
        </View>

        <View style={{ marginTop: 16 }}>
          <FlatList
            data={listData}
            horizontal
            keyExtractor={(it) => it.id}
            renderItem={({ item }) =>
              item.kind === "create" ? (
                <CreateChannelCard
                  width={CARD_WIDTH}
                  gap={GAP} // spacing stays on each card
                  onPress={() => setShowCreate(true)}
                />
              ) : (
                <ChannelCard
                  width={CARD_WIDTH}
                  gap={GAP}
                  item={{ ...item, memberAvatars: item.memberAvatars ?? [] }}
                />
              )
            }
            showsHorizontalScrollIndicator={false}
            // No snapping:
            snapToAlignment={undefined as any}
            snapToOffsets={undefined as any}
            // Make scroll feel natural:
            decelerationRate="normal"
            pagingEnabled={false}
            overScrollMode="auto"
          />
        </View>

        {/* Task */}
        <TaskOverview />

        {/* Sanction */}
        <SanctionCard />
      </ScrollView>

      {/* Modal */}
      <CreateChannelModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
      />
    </SafeAreaView>
  );
}
