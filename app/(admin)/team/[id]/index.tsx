// app/(admin)/team/[id]/index.tsx
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, CalendarCheck2 } from "lucide-react-native";
import React, { useEffect, useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { selectAdminUsers } from "@/redux/admin/admin.slice";
import { promoteUser, toggleUserSuspension } from "@/redux/admin/admin.thunks";
import { selectAllChannels, selectChannelsForUser } from "@/redux/channels/channels.slice";
import { fetchChannels } from "@/redux/channels/channels.thunks";

export default function StaffDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const dispatch = useAppDispatch();

  const users = useAppSelector(selectAdminUsers);
  const channels = useAppSelector(selectAllChannels);
  // console.log(channels[0]["members"]);

  useEffect(() => {
    dispatch(fetchChannels());
  }, [dispatch]);

  const user = useMemo(() => users.find((u) => u._id === id), [users, id]) ?? {
    _id: String(id),
    email: "unknown@example.com",
    fullname: "Unknown Staff",
    username: "unknown",
    role: "staff",
    suspended: false,
  };

  // const memberChannels = useMemo(() => {
  //   if (!id) return [];
  //   return channels.filter((ch: any) => isUserInChannel(ch?.members, id));
  // }, [channels, id]);
  const userId = String(id ?? "");
  const memberChannels = useAppSelector(selectChannelsForUser(userId));
  // console.log(memberChannels)

  const name = user.fullname || user.username || user.email || "Unknown";
  const joined = formatDate(user.createdAt);

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="px-5 pt-6 pb-4 flex-row items-center justify-between gap-4">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full items-center justify-center"
        >
          <ArrowLeft size={24} color="#111827" />
        </Pressable>
        <Text className="text-3xl font-kumbh text-text">Staff Details</Text>
                  <View className="w-10"/>
        
      </View>

      {/* Details */}
      <View className="px-6 mt-4">
        <Row label="Name" value={name} />
        <Row label="Email" value={user.email ?? "—"} />
        <Row label="Username" value={user.username ?? "—"} />
        <Row label="Role" value={user.role} />
        <Row label="Joined" value={joined} />
        <Row label="Status" value={user.suspended ? "Suspended" : "Active"} />
      </View>

      {/* Channels */}
      <View className="px-6 mt-6">
        <Text className="text-lg font-kumbhBold text-text mb-2">Groups</Text>
        {memberChannels.length > 0 ? (
          memberChannels.map((ch) => (
            <View
              key={ch._id}
              className="flex-row items-center justify-between py-3 border-b border-gray-200"
            >
              <Text className="text-base font-kumbh text-text">{ch.name}</Text>
              <Text className="text-sm font-kumbh text-gray-500">
                {ch.code}
              </Text>
            </View>
          ))
        ) : (
          <Text className="text-gray-500 font-kumbh">No channels yet.</Text>
        )}
      </View>

      {/* Actions */}
      <View className="px-6 mt-8 gap-3">
        <Pressable
          onPress={() => dispatch(toggleUserSuspension({ userId: user._id }))}
          className="flex-row items-center justify-center gap-3 bg-primary-50 border border-primary-200 rounded-2xl py-4"
        >
          <Text className="text-base font-kumbhBold text-text">
            {user.suspended ? "Unsuspend Staff" : "Suspend Staff"}
          </Text>
        </Pressable>

        <Pressable
          onPress={() =>
            dispatch(promoteUser({ userId: user._id, role: "admin" }))
          }
          className="flex-row items-center justify-center gap-3 bg-primary-50 border border-primary-200 rounded-2xl py-4"
        >
          <Text className="text-base font-kumbhBold text-text">
            Promote to Admin
          </Text>
        </Pressable>

        <Pressable
          onPress={() =>
            router.push({
              pathname: "/(admin)/team/[id]/edit",
              params: { id: user._id },
            })
          }
          className="flex-row items-center justify-center gap-3 bg-gray-100 border border-gray-200 rounded-2xl py-4"
        >
          <Text className="text-base font-kumbhBold text-text">Edit Staff</Text>
        </Pressable>
      </View>

      {/* Task Board */}
      <View className="px-6 mt-8">
        <Pressable
          onPress={() =>
            router.push({
              pathname: "/(admin)/team/taskboard",
              params: { staffId: user._id },
            })
          }
          className="flex-row items-center justify-center gap-3 bg-primary-50 border border-primary-200 rounded-2xl py-4"
        >
          <View className="w-6 h-6 rounded-md bg-white items-center justify-center">
            <CalendarCheck2 size={16} color="#4c5fab" />
          </View>
          <Text className="text-base font-kumbhBold text-text">
            View Staff Task Board
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between py-4">
      <Text className="text-base text-gray-700 font-kumbh">{label}</Text>
      <Text className="text-base text-text font-kumbhBold max-w-[60%] text-right">
        {value}
      </Text>
    </View>
  );
}
function formatDate(d?: string) {
  if (!d) return "—";
  try {
    const dt = new Date(d);
    return dt.toLocaleDateString();
  } catch {
    return d;
  }
}
function isUserInChannel(members: any[] | undefined | null, userId: string) {
  if (!Array.isArray(members)) return false;
  return members.some((m) => {
    if (typeof m === "string") return m === userId;
    if (m && typeof m === "object") {
      return m._id === userId || m.userId === userId || m?.user?._id === userId;
    }
    return false;
  });
}
