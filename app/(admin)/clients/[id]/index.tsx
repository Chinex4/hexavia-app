import React, { useMemo } from "react";
import { View, Text, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, CalendarCheck2 } from "lucide-react-native";

import { useAppDispatch, useAppSelector } from "@/store/hooks";

import { selectAdminUsers } from "@/redux/admin/admin.slice";
import { toggleUserSuspension, promoteUser } from "@/redux/admin/admin.thunks";

import { selectAllChannels } from "@/redux/channels/channels.slice";

type AdminUser = {
  _id: string;
  email: string;
  fullname?: string;
  username?: string;
  role: "client" | "staff" | "admin" | "super-admin";
  isSuspended?: boolean;
  createdAt?: string;
  [k: string]: any;
};

export default function ClientDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const dispatch = useAppDispatch();

  const users = useAppSelector(selectAdminUsers);
  const channels = useAppSelector(selectAllChannels);

  const fallbackUser: AdminUser = {
    _id: String(id ?? "unknown"),
    email: "unknown@example.com",
    fullname: "Unknown User",
    username: "unknown",
    role: "client",
    isSuspended: false,
  };

  const user = useMemo(() => {
    if (!id) return fallbackUser;
    return users.find((u) => u._id === id) ?? fallbackUser;
  }, [users, id]);

  const name = user.fullname || user.username || user.email || "Unknown";
  const joined = formatDate(user.createdAt);

  const memberChannels = useMemo(() => {
    if (!id) return [];
    return channels.filter((ch: any) => isUserInChannel(ch?.members, id));
  }, [channels, id]);

  const onToggleSuspension = () => {
    dispatch(toggleUserSuspension({ userId: user._id }));
  };

  const onPromote = () => {
    // You can customize: "admin" or "super-admin"
    dispatch(promoteUser({ userId: user._id, role: "admin" }));
  };

  const onEdit = () => {
    router.push({
      pathname: "/(admin)/clients/[id]/edit",
      params: { id: user._id },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="px-5 pt-6 pb-4 flex-row items-center gap-4">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full items-center justify-center"
        >
          <ArrowLeft size={24} color="#111827" />
        </Pressable>
        <Text className="text-3xl font-kumbhBold text-text">
          Client Details
        </Text>
      </View>

      {/* Details */}
      <View className="px-6 mt-4">
        <DetailRow label="Name:" value={name} />
        <DetailRow label="Email" value={user.email ?? "—"} />
        <DetailRow label="Role" value={user.role} />
        <DetailRow label="Joined" value={joined} />
        <DetailRow
          label="Status"
          value={user.isSuspended ? "Suspended" : "Active"}
        />
      </View>

      {/* Channels */}
      <View className="px-6 mt-6">
        <Text className="text-lg font-kumbhBold text-text mb-2">Channels</Text>
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

      {/* Admin actions */}
      <View className="px-6 mt-8 gap-3">
        <Pressable
          onPress={onToggleSuspension}
          className="flex-row items-center justify-center gap-3 bg-primary-50 border border-primary-200 rounded-2xl py-4"
        >
          <Text className="text-base font-kumbhBold text-text">
            {user.isSuspended ? "Unsuspend User" : "Suspend User"}
          </Text>
        </Pressable>

        <Pressable
          onPress={onPromote}
          className="flex-row items-center justify-center gap-3 bg-primary-50 border border-primary-200 rounded-2xl py-4"
        >
          <Text className="text-base font-kumbhBold text-text">
            Promote to Admin
          </Text>
        </Pressable>

        <Pressable
          onPress={onEdit}
          className="flex-row items-center justify-center gap-3 bg-gray-100 border border-gray-200 rounded-2xl py-4"
        >
          <Text className="text-base font-kumbhBold text-text">Edit User</Text>
        </Pressable>
      </View>

      {/* Installment action (kept) */}
      <View className="px-6 mt-8">
        <Pressable
          onPress={() => router.push("/(admin)/clients/installments")}
          className="flex-row items-center justify-center gap-3 bg-primary-50 border border-primary-200 rounded-2xl py-4"
        >
          <View className="w-6 h-6 rounded-md bg-white items-center justify-center">
            <CalendarCheck2 size={16} color="#4c5fab" />
          </View>
          <Text className="text-base font-kumbhBold text-text">
            Client Installment Payment
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

/* ---------- helpers ---------- */

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between py-4">
      <Text className="text-base text-gray-700 font-kumbh">{label}</Text>
      <Text className="text-base text-text font-kumbhBold">{value}</Text>
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

/** Accepts string[] or object[] where object has _id or userId that equals userId */
function isUserInChannel(
  members: Array<any> | undefined | null,
  userId: string
): boolean {
  if (!Array.isArray(members)) return false;
  for (const m of members) {
    if (typeof m === "string" && m === userId) return true;
    if (m && typeof m === "object") {
      if (m._id === userId) return true;
      if (m.userId === userId) return true;
      if (m.user?._id === userId) return true; // extra safety
    }
  }
  return false;
}
