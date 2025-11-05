// app/(staff)/channels/[channelId]/info.tsx
import React, { useMemo, useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  RefreshControl,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft, User } from "lucide-react-native";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchChannelById } from "@/redux/channels/channels.thunks";
import { selectChannelById } from "@/redux/channels/channels.selectors";
import { selectUser } from "@/redux/user/user.slice";

type MemberItem = {
  id: string;
  name: string;
  avatar?: string | null;
  role?: string | null;
};

function initialsFrom(name?: string | null) {
  const s = String(name ?? "").trim();
  if (!s) return "??";
  const [a, b] = s.split(/\s+/);
  return ((a?.[0] ?? "") + (b?.[0] ?? "")).toUpperCase() || "?";
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <View className="bg-gray-100 rounded-full px-3 py-1 mr-2 mb-2">
      <Text className="text-xs text-gray-700 font-kumbh">{children}</Text>
    </View>
  );
}

function RowMember({
  item,
  onPress,
}: {
  item: MemberItem;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center px-5 py-3 border-b border-gray-100 active:bg-gray-50"
    >
      {item.avatar ? (
        <Image
          source={{ uri: item.avatar }}
          className="w-10 h-10 rounded-full"
        />
      ) : (
        <View className="w-10 h-10 rounded-full bg-gray-200 items-center justify-center">
          <Text className="text-gray-700 font-semibold font-kumbh">
            {initialsFrom(item.name)}
          </Text>
        </View>
      )}
      <View className="ml-3 flex-1">
        <Text className="text-base font-medium text-gray-900 font-kumbh">
          {item.name || "Member"}
        </Text>
        {!!item.role && (
          <Text className="text-xs text-gray-500 font-kumbh">{item.role}</Text>
        )}
      </View>
    </Pressable>
  );
}

export default function ChannelInfoScreen() {
  const { channelId: rawId } = useLocalSearchParams<{ channelId: string }>();
  const channelId = typeof rawId === "string" ? rawId : rawId?.[0];

  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const router = useRouter();

  const me = useAppSelector(selectUser);
  //   console.log(me?.role);
  const path =
    me?.role === "client"
      ? "/(client)/(tabs)/chats/[channelId]"
      : me?.role === "staff"
        ? "/(staff)/(tabs)/chats/[channelId]"
        : "/(admin)/chats/[channelId]";

  // ✅ Memoize selector factory
  const channelSel = useMemo(
    () => selectChannelById(channelId ?? ""),
    [channelId]
  );
  const channel = useAppSelector(channelSel);

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    if (!channelId) return;
    setRefreshing(true);
    try {
      await dispatch(fetchChannelById(channelId)).unwrap();
    } finally {
      setRefreshing(false);
    }
  }, [dispatch, channelId]);

  const members: MemberItem[] = useMemo(() => {
    if (!channel) return [];

    const rawMembers = Array.isArray((channel as any)?.members)
      ? (channel as any).members
      : [];

    // If API already provides members, normalize and return.
    if (rawMembers.length > 0) {
      return rawMembers.map((m: any) => {
        const user =
          typeof m === "string" ? { _id: m } : m?.user || m?.member || m;
        return {
          id: String(
            user?._id ?? user?.id ?? m?.userId ?? m?.memberId ?? Math.random()
          ),
          name: String(
            user?.name ??
              user?.fullName ??
              user?.username ??
              user?.displayName ??
              "Admin"
          ),
          avatar: user?.profilePicture ?? user?.avatar ?? null,
          role: m?.role ?? user?.role ?? null,
        };
      });
    }

    // Fallback: derive members from createdBy + contributors in resources
    const byId = new Map<string, MemberItem>();

    // 1) Owner / creator
    const cb = (channel as any).createdBy;
    console.log(cb);
    if (cb) {
      const id = String(typeof cb === "string" ? cb : (cb?._id ?? ""));
      if (id) {
        byId.set(id, {
          id,
          name:
            (typeof cb === "string"
              ? "Owner"
              : cb?.username || cb?.name || cb?.email || "Owner") + " (Owner)",
          avatar: (cb as any)?.profilePicture ?? null,
          role: "owner",
        });
      }
    }

    // 2) Contributors (anyone who uploaded a resource)
    const resArr: any[] = Array.isArray((channel as any)?.resources)
      ? (channel as any).resources
      : [];
    for (const r of resArr) {
      const uid = r?.addedBy ? String(r.addedBy) : "";
      if (!uid) continue;
      if (!byId.has(uid)) {
        byId.set(uid, {
          id: uid,
          name:
            // If the uploader is the owner, reuse owner name; else generic
            uid === (typeof cb === "string" ? cb : cb?._id)
              ? (cb?.username || cb?.name || cb?.email || "Owner") + " (Owner)"
              : "Admin",
          avatar: null,
          role: "admin",
        });
      }
    }

    // Optional: include current user if they’re in context and absent
    if (me?._id && !byId.has(String(me._id))) {
      byId.set(String(me._id), {
        id: String(me._id),
        name: me?.fullname || me?.username || me?.email || "You",
        avatar: (me as any)?.profilePicture ?? null,
        role: "you",
      });
    }

    return Array.from(byId.values());
  }, [channel, me?._id]);

  const isLoading = !channel && !!channelId;

  const HeaderBar = (
    <View
      style={{ paddingTop: insets.top }}
      className="bg-white border-b border-gray-100"
    >
      <View className="px-4 pb-3 pt-2">
        <View className="flex-row items-center justify-between">
          <Pressable
            onPress={() =>
              router.push({ pathname: path as any, params: { channelId } })
            }
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={12}
            className="h-10 w-10 rounded-full items-center justify-center bg-gray-100 mr-2"
          >
            <ChevronLeft size={22} color="#111827" />
          </Pressable>
          <Text className="text-2xl font-semibold font-kumbh text-center">
            Channel Info
          </Text>
          <View className="w-10" />
        </View>
      </View>
    </View>
  );

  const header = (
    <View className="px-5 pt-4 pb-3">
      <Text className="text-2xl font-semibold text-gray-900 font-kumbh">
        {channel?.name ?? "Channel"}
      </Text>

      {!!(channel as any)?.code && (
        <Text className="text-gray-600 mt-1 font-kumbh">
          Code: {(channel as any).code}
        </Text>
      )}

      {!!channel?.description && (
        <Text className="text-gray-700 mt-2 font-kumbh">
          {channel.description}
        </Text>
      )}

      <View className="flex-row flex-wrap mt-3">
        <Chip>
          {members.length} member{members.length === 1 ? "" : "s"}
        </Chip>

        {!!(channel as any)?.createdAt && (
          <Chip>
            Created {new Date((channel as any).createdAt).toLocaleDateString()}
          </Chip>
        )}

        {!!(channel as any)?.createdBy && (
          <Chip>
            Owner:{" "}
            {typeof (channel as any).createdBy === "string"
              ? (channel as any).createdBy
              : (channel as any).createdBy?.username ||
                (channel as any).createdBy?.name ||
                "Unknown"}
          </Chip>
        )}
      </View>

      <View className="flex-row mt-4">
        <Pressable
          className="bg-primary px-4 py-3 rounded-2xl mr-3"
          onPress={() =>
            router.push({
              pathname: "/(staff)/channels/[channelId]/resources" as any,
              params: { channelId },
            })
          }
        >
          <Text className="text-white font-medium font-kumbh">Resources</Text>
        </Pressable>

        <Pressable
          className="bg-gray-200 px-4 py-3 rounded-2xl"
          onPress={() =>
            router.push({
              pathname: "/(staff)/channels/[channelId]/tasks" as any,
              params: { channelId },
            })
          }
        >
          <Text className="text-gray-900 font-medium font-kumbh">Tasks</Text>
        </Pressable>
      </View>

      <Text className="mt-6 mb-2 text-sm font-semibold text-gray-800 font-kumbh">
        Members
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <View
        style={{ paddingTop: insets.top }}
        className="flex-1 bg-white items-center justify-center"
      >
        <ActivityIndicator />
        <Text className="text-gray-600 mt-3 font-kumbh">Loading channel…</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      {HeaderBar}

      <FlatList
        data={members}
        keyExtractor={(m) => m.id}
        ListHeaderComponent={header}
        renderItem={({ item }) => (
          <RowMember
            item={item}
            onPress={() => {
              // e.g., router.push({ pathname: "/(staff)/users/[userId]", params: { userId: item.id }});
            }}
          />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={
          <View className="px-5 py-10">
            <Text className="text-gray-500 font-kumbh">No members found.</Text>
          </View>
        }
      />
    </View>
  );
}
