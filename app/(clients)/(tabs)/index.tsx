// app/(staff)/(tabs)/index.tsx
import React from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  FlatList,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Bell, ChevronRight } from "lucide-react-native";
import SanctionCard from "@/components/staff/SanctionCard";
import AvatarPlaceholder from "@/components/staff/AvatarPlaceHolder";
import ChannelCard from "@/components/staff/ChannelCard";
import TaskCard from "@/components/staff/TaskCard";
import { StatusBar } from "expo-status-bar";

type Channel = {
  id: string;
  title: string;
  subtitle: string;
  color: string; 
  logo?: string; 
  members?: string[]; 
};

const channels: Channel[] = [
  {
    id: "1",
    title: "FinTeam",
    subtitle:
      "Horizontal swipeable carousel of channel cards PR/Marketing Channel",
    color: "#14D699",
    logo: undefined,
    members: [],
  },
  {
    id: "2",
    title: "ZEETeam",
    subtitle:
      "Horizontal swipeable carousel of channel cards PR/Marketing Channel",
    color: "#60A5FA", // blue-400-ish
    logo: undefined,
    members: [],
  },
];

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const PAGE_PAD = 16; // parent px-4
const GAP = 10; // tighter gap
const PEEK = 20; // smaller visible next-card peek
// Neutralize parent padding with marginHorizontal: -PAGE_PAD
// Then we control paddingLeft ourselves (12).
const CARD_WIDTH = SCREEN_WIDTH - PAGE_PAD * 2 - PEEK;
const SNAP = CARD_WIDTH + GAP;

export default function StaffHome() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        className="px-4"
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
          <Pressable className="flex-row items-center">
            <Text className="text-primary mr-1 font-sans">See all</Text>
            <ChevronRight size={16} color="#4C5FAB" />
          </Pressable>
        </View>

        <View
          style={{ marginHorizontal: -PAGE_PAD, marginTop: 16 /* was mt-4 */ }}
        >
          <FlatList
            data={channels}
            horizontal
            keyExtractor={(it) => it.id}
            renderItem={({ item }) => (
              <ChannelCard width={CARD_WIDTH} gap={GAP} item={item} />
            )}
            contentContainerStyle={{
              paddingLeft: 12, // small left padding (tight)
              paddingRight: PAGE_PAD, // align with page end
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
