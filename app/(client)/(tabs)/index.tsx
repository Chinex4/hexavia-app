import AvatarPlaceholder from "@/components/staff/AvatarPlaceHolder";
import ChannelCard from "@/components/staff/ChannelCard";
import SanctionCard from "@/components/staff/SanctionCard";
import TaskCard from "@/components/staff/TaskOverviewCard";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Bell, ChevronRight } from "lucide-react-native";
import React from "react";
import {
  Dimensions,
  FlatList,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Channel = {
  id: string;
  title: string;
  subtitle: string;
  color: string;
  logo?: string;
  memberAvatars?: string[];
};

const channels: Channel[] = [
  {
    id: "1",
    title: "FinTeam",
    subtitle:
      "Horizontal swipeable carousel of channel cards PR/Marketing Channel",
    color: "#14D699",
    logo: undefined,
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
    color: "#60A5FA", // blue-400-ish
    logo: undefined,
    memberAvatars: [
      "https://i.pravatar.cc/100?img=1",
      "https://i.pravatar.cc/100?img=2",
      "https://i.pravatar.cc/100?img=3",
      "https://i.pravatar.cc/100?img=4",
      "https://i.pravatar.cc/100?img=5",
    ],
  },
];

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const PAGE_PAD = 16;
const GAP = 10;
const PEEK = 20;
const CARD_WIDTH = SCREEN_WIDTH - PAGE_PAD * 2 - PEEK;
const SNAP = CARD_WIDTH + GAP;

export default function StaffHome() {
  const router = useRouter();
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

        <View style={{ marginHorizontal: -PAGE_PAD, marginTop: 16 }}>
          <FlatList
            data={channels}
            horizontal
            keyExtractor={(it) => it.id}
            renderItem={({ item }) => (
              <ChannelCard
                width={CARD_WIDTH}
                gap={GAP}
                item={{
                  ...item,
                  memberAvatars: item.memberAvatars ?? [],
                }}
              />
            )}
            contentContainerStyle={{
              paddingLeft: 12,
              paddingRight: PAGE_PAD,
            }}
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            snapToInterval={SNAP}
            snapToAlignment="start"
          />
        </View>

        {/* Task */}
        <TaskCard />

        {/* Sanction */}
        <SanctionCard />
      </ScrollView>
    </SafeAreaView>
  );
}
