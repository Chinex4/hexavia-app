// app/(admin)/team/[id]/index.tsx
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, CalendarCheck2 } from "lucide-react-native";
import React, { useEffect, useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { selectAdminUsers } from "@/redux/admin/admin.slice";
import { promoteUser, toggleUserSuspension } from "@/redux/admin/admin.thunks";
import {
  selectAllChannels,
  selectChannelsForUser,
} from "@/redux/channels/channels.slice";
import { fetchChannels } from "@/redux/channels/channels.thunks";

import { dialPhone, openEmail } from "@/utils/contact";
import { Mail, MessageCircle, Phone as PhoneIcon } from "lucide-react-native";
import { Linking } from "react-native";

function openWhatsApp(phone?: string) {
  if (!phone) return;

  // keep only digits (and +)
  const digits = phone.replace(/[^\d+]/g, "");

  // WhatsApp wants country code, no leading 0. Example: 2348012345678
  // If your numbers are stored like "080..." you should normalize to 234...
  // This keeps it simple; adjust if you already store intl format.
  const normalized = digits.startsWith("0")
    ? `234${digits.slice(1)}`
    : digits.startsWith("+")
      ? digits.slice(1)
      : digits;

  const url = `https://wa.me/${normalized}`;
  Linking.openURL(url).catch(() => {});
}

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
        <View className="w-10" />
      </View>

      {/* Details */}
      <View className="px-6 mt-4">
        <Row label="Name" value={name} />
        <Row
          label="Email"
          value={user.email ?? "—"}
          actions={
            user.email
              ? [
                  {
                    icon: Mail,
                    onPress: () => openEmail(user.email),
                    label: "Send email",
                  },
                ]
              : undefined
          }
        />

        <Row
          label="Phone"
          value={user.phoneNumber ?? "—"}
          actions={
            user.phoneNumber
              ? [
                  {
                    icon: PhoneIcon,
                    onPress: () => dialPhone(user.phoneNumber),
                    label: "Call",
                  },
                  {
                    icon: MessageCircle,
                    onPress: () => openWhatsApp(user.phoneNumber),
                    label: "WhatsApp",
                  },
                ]
              : undefined
          }
        />

        <Row label="Username" value={user.username ?? "—"} />
        <Row label="Role" value={user.role} />
        <Row label="Joined" value={joined} />
        <Row label="Status" value={user.suspended ? "Suspended" : "Active"} />
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

type RowAction = {
  icon: React.ComponentType<{ size?: number; color?: string }>;
  onPress: () => void;
  label?: string;
};

function Row({
  label,
  value,
  actions,
}: {
  label: string;
  value: string;
  actions?: RowAction[];
}) {
  return (
    <View className="flex-row items-center py-4">
      <Text
        className="text-base text-gray-700 font-kumbh w-28"
        numberOfLines={1}
      >
        {label}
      </Text>

      <View className="flex-1 flex-row items-center justify-end min-w-0">
        <Text
          className="text-base text-text font-kumbhBold max-w-[65%] text-right"
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {value}
        </Text>

        {actions?.length ? (
          <View className="flex-row items-center ml-3">
            {actions.map((action, idx) => (
              <Pressable
                key={`${label}-act-${idx}`}
                onPress={action.onPress}
                className="w-9 h-9 rounded-full border border-gray-200 bg-white items-center justify-center ml-2"
                accessibilityLabel={action.label}
                hitSlop={8}
              >
                <action.icon size={16} color="#111827" />
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>
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
