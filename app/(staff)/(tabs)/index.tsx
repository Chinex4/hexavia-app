import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Bell, ChevronRight } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AvatarPlaceholder from "@/components/staff/AvatarPlaceHolder";
import ChannelCard from "@/components/staff/ChannelCard";
import SanctionCard from "@/components/staff/SanctionCard";
import TaskOverview from "@/components/staff/TaskOverviewCard";
import CreateChannelCard from "@/components/staff/channels/CreateChannelCard";
import CreateChannelModal from "@/components/staff/channels/CreateChannelModal";
import useChannelCardLayout from "@/hooks/useChannelCardLayout";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchProfile } from "@/redux/user/user.thunks";
import { selectUser } from "@/redux/user/user.slice";
import { fetchChannels } from "@/redux/channels/channels.thunks";
import {
  selectMyChannelsByUserId,
  selectAllChannels,
  selectStatus,
} from "@/redux/channels/channels.selectors";
import Ionicons from "@expo/vector-icons/Ionicons";
import SkeletonChannelCard from "@/components/staff/channels/SkeletonChannelCard";
import { StaffHeader } from "@/components/common/UserHeader";

const PALETTE = [
  "#14D699",
  "#60A5FA",
  "#F6A94A",
  "#29C57A",
  "#4C5FAB",
  "#9B7BF3",
];
const colorFor = (key: string) => {
  let hash = 0;
  for (let i = 0; i < key.length; i++)
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
};

function firstNameOf(fullname?: string | null) {
  if (!fullname) return "User";
  return fullname.trim().split(/\s+/)[0];
}
function prettyRole(role?: string | null) {
  if (!role) return "Project Member";
  return role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function StaffHome() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const user = useAppSelector(selectUser);
  useEffect(() => {
    dispatch(fetchProfile());
  }, [dispatch]);
  const userId = user?._id ?? null;
  const channels = useAppSelector((s) => selectMyChannelsByUserId(s, userId));
  // const channels = useAppSelector(selectAllChannels);
  // console.log(channels)

  const status = useAppSelector(selectStatus);
  // console.log("Channels:", channels);

  useEffect(() => {
    if (status === "idle") dispatch(fetchChannels());
  }, [status, dispatch]);

  const [showCreate, setShowCreate] = useState(false);

  const { GAP, CARD_WIDTH } = useChannelCardLayout();
  const CARD_WIDTH_NARROW = Math.max(250, CARD_WIDTH - 40);
  const SNAP = CARD_WIDTH_NARROW + GAP;

  const greetingName = firstNameOf(user?.fullname);
  const roleText = prettyRole(user?.role || "Hexavia Staff");

  const listData = useMemo(
    () =>
      [
        { kind: "create", id: "create" as const },
        ...channels.map((c) => ({
          kind: "channel" as const,
          id: String(c._id),
          title: c.name,
          subtitle: c.description ?? "",
          code: c.code,
          logo: (c as any)?.logo ?? undefined,
          color: colorFor(c._id || (c as any)?.code || c.name),
        })),
      ] as const,
    [channels]
  );

  const isLoading = status === "loading" && channels.length === 0;
  const skeletons = Array.from({ length: 4 }, (_, i) => ({
    kind: "skeleton" as const,
    id: `skeleton-${i}`,
  }));

  // console.log(channels);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        className="px-5"
        showsVerticalScrollIndicator={false}
        directionalLockEnabled
        alwaysBounceVertical={false}
      >
        {/* Top Bar */}
        <StaffHeader rightIcon={<Bell size={20} color="#111827" />} />

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
            data={listData as any}
            horizontal
            keyExtractor={(it: any) => `${it.kind}:${it.id}`}
            renderItem={({ item }: any) =>
              item.kind === "create" ? (
                <CreateChannelCard
                  width={CARD_WIDTH_NARROW}
                  gap={GAP}
                  onPress={() => setShowCreate(true)}
                />
              ) : item.kind === "skeleton" ? (
                <SkeletonChannelCard width={CARD_WIDTH_NARROW} gap={GAP} />
              ) : (
                <ChannelCard width={CARD_WIDTH_NARROW} gap={GAP} item={item} />
              )
            }
            ListEmptyComponent={
              <View className="items-center mt-24">
                <Ionicons
                  name="chatbubbles-outline"
                  size={28}
                  color={"#9CA3AF"}
                />
                <Text className="mt-2 text-gray-500 font-kumbh">
                  {status === "loading"
                    ? "Loading channels…"
                    : "No channels found"}
                </Text>
              </View>
            }
            showsHorizontalScrollIndicator={false}
            bounces={false}
            alwaysBounceVertical={false}
            overScrollMode="never"
            // snapToInterval={SNAP}
            // snapToAlignment="start"
            decelerationRate="fast"
            style={{ height: 200 + 16 }}
            contentContainerStyle={{ paddingRight: 8 }}
            getItemLayout={(_, index) => ({
              length: SNAP,
              offset: SNAP * index,
              index,
            })}
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
