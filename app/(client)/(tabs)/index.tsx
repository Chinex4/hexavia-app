import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Bell, ChevronRight } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ClientHeader } from "@/components/common/UserHeader";
import BotpressFab from "@/components/common/BotpressFab";
import SanctionCard from "@/components/staff/SanctionCard";
import TaskOverview from "@/components/staff/TaskOverviewCard";
import CreateChannelModal from "@/components/staff/channels/CreateChannelModal";
import HorizontalChannelList from "@/components/staff/channels/HorizontaChannelList";
import HorizontalChannelSkeletonList from "@/components/staff/channels/HorizontalChannelSkeletonList";
import useChannelCardLayout from "@/hooks/useChannelCardLayout";
import {
  selectAllChannels,
  selectStatus
} from "@/redux/channels/channels.selectors";
import { fetchChannels, joinChannel } from "@/redux/channels/channels.thunks";
import { selectUser } from "@/redux/user/user.slice";
import { fetchProfile } from "@/redux/user/user.thunks";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

const PALETTE = [
  // "#14D699",
  // "#60A5FA",
  // "#F6A94A",
  // "#29C57A",
  // "#4C5FAB",
  // "#9B7BF3",
  "#4c5fab",
];
const colorFor = (key?: string) => {
  const safeKey = String(key ?? "");
  let hash = 0;
  for (let i = 0; i < safeKey.length; i++) {
    hash = (hash * 31 + safeKey.charCodeAt(i)) >>> 0;
  }
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

const toStr = (v: any) => (v == null ? "" : String(v));
const sameId = (a: any, b: any) => toStr(a) === toStr(b);

const getCreatorId = (ch: any) =>
  ch?.createdBy?._id ??
  ch?.createdBy ?? // sometimes it's a string id
  ch?.owner?._id ??
  ch?.ownerId ??
  null;

const getMemberId = (m: any) =>
  (typeof m === "string" && m) ||
  m?._id ||
  m?.id ||
  m?.user?._id ||
  m?.userId ||
  m?.memberId ||
  null;

const hasUser = (ch: any, uid: string) => {
  const members = Array.isArray(ch?.members) ? ch.members : [];
  
  return (
    sameId(getCreatorId(ch), uid) ||
    members.some((m: any) => sameId(getMemberId(m), uid))
  );
};

export default function StaffHome() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const user = useAppSelector(selectUser);
  const userId = toStr(user?._id);
  // console.log(userId)
  const allChannels = useAppSelector(selectAllChannels) ?? [];
  // console.log(allChannels);
  // console.log(allChannels)

  // console.log(allChannels)

  useEffect(() => {
    if (!user) dispatch(fetchProfile());
    dispatch(fetchChannels());
  }, [dispatch]);
  const channels = useMemo<any[]>(() => {
    if (!userId) return [];
    return allChannels.filter((ch: any) => hasUser(ch, userId));
  }, [allChannels, userId]);
  const myChannelIds = new Set(channels.map((c: any) => c._id));
  // console.log(channels[0].members.map(m => m._id), userId)


  const status = useAppSelector(selectStatus);
  // console.log("Channels:", channels);

  useEffect(() => {
    if (status === "idle") dispatch(fetchChannels());
  }, [status, dispatch]);

  const [showCreate, setShowCreate] = useState(false);

  const handleJoin = (code: string) => {
    dispatch(joinChannel(code.replace(/^#/, "")));
  };

  const { GAP, CARD_WIDTH } = useChannelCardLayout();
  const CARD_WIDTH_NARROW = Math.max(250, CARD_WIDTH - 40);
  const SNAP = CARD_WIDTH_NARROW + GAP;

  const greetingName = firstNameOf(user?.fullname);
  const roleText = prettyRole(user?.role || "Hexavia Staff");

  const listData = useMemo(
    () =>
      [
        { kind: "create", id: "create" as const },
        ...allChannels.map((c) => ({
          kind: "channel" as const,
          id: String(c._id),
          title: c.name,
          subtitle: c.description ?? "",
          code: c.code,
          logo: (c as any)?.logo ?? undefined,
          color: colorFor(c._id || (c as any)?.code || c.name),
          isMember: myChannelIds.has(c._id),
        })),
      ] as const,
    [allChannels, myChannelIds]
  );

  type ChannelCardItem = {
    id: string;
    title: string;
    subtitle: string;
    logo?: string;
    color: string;
    code: string;
  };

  const channelItems: ChannelCardItem[] = useMemo(
    () =>
      listData
        .filter((x: any) => x.kind === "channel")
        .map((x: any) => ({
          id: x.id,
          title: x.title,
          subtitle: x.subtitle,
          code: x.code,
          logo: x.logo,
          color: x.color,
        })),
    [listData]
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
        <ClientHeader
          subtitleBadge="Client"
          rightIcon={<Bell size={20} color="#111827" />}
        />
        {/* Channels */}
        <View className="mt-6 flex-row items-center justify-between">
          <Text className="text-3xl text-gray-900 font-kumbh">Projects</Text>
          <Pressable
            onPress={() => router.push("/(client)/channels")}
            className="flex-row items-center"
          >
            <Text className="text-primary mr-1 font-sans">See all</Text>
            <ChevronRight size={16} color="#4C5FAB" />
          </Pressable>
        </View>

        {isLoading ? (
          <HorizontalChannelSkeletonList outerPadding={20} />
        ) : (
          <HorizontalChannelList items={channelItems} onJoin={handleJoin} />
        )}
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
      <BotpressFab title="Hexavia Assistant" />
    </SafeAreaView>
  );
}
