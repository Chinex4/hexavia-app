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
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft } from "lucide-react-native";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchChannelById,
  removeMemberFromChannel,
} from "@/redux/channels/channels.thunks";
import { selectChannelById } from "@/redux/channels/channels.selectors";
import { selectUser } from "@/redux/user/user.slice";
import { fetchAdminUsers } from "@/redux/admin/admin.thunks";
import { selectAdminUsers } from "@/redux/admin/admin.slice";
import { StatusBar } from "expo-status-bar";

type MemberItem = {
  id: string;
  name: string;
  avatar?: string | null;
  role?: string | null;
  channelType?: string | null;
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
  onRemove,
  canRemove,
  isRemoving,
}: {
  item: MemberItem;
  onPress?: () => void;
  onRemove?: () => void;
  canRemove?: boolean;
  isRemoving?: boolean;
}) {
  return (
    <View className="flex-row items-center px-5 py-3 border-b border-gray-100">
      <Pressable
        onPress={onPress}
        className="flex-row items-center flex-1 active:bg-gray-50"
        disabled={!onPress}
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
            <Text className="text-xs text-gray-500 font-kumbh">
              {item.role}
            </Text>
          )}
        </View>
      </Pressable>

      {canRemove && (
        <Pressable
          onPress={onRemove}
          disabled={isRemoving}
          className="bg-red-50 px-3 py-2 rounded-full active:bg-red-100"
        >
          {isRemoving ? (
            <ActivityIndicator size="small" color="#dc2626" />
          ) : (
            <Text className="text-xs font-semibold text-red-600 font-kumbh">
              Remove
            </Text>
          )}
        </Pressable>
      )}
    </View>
  );
}

export default function ChannelInfoScreen() {
  const { channelId: rawId } = useLocalSearchParams<{ channelId: string }>();
  const channelId = typeof rawId === "string" ? rawId : rawId?.[0];

  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const router = useRouter();

  const me = useAppSelector(selectUser);
  const adminUsers = useAppSelector(selectAdminUsers);
  const path =
    me?.role === "client"
      ? "/(client)/(tabs)/chats/[channelId]"
      : me?.role === "staff"
        ? "/(staff)/(tabs)/chats/[channelId]"
        : "/(admin)/chats/[channelId]";

  const channelSel = useMemo(
    () => selectChannelById(channelId ?? ""),
    [channelId]
  );
  const channel = useAppSelector(channelSel);

  const [refreshing, setRefreshing] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const onRefresh = useCallback(async () => {
    if (!channelId) return;
    setRefreshing(true);
    try {
      await dispatch(fetchChannelById(channelId)).unwrap();
    } finally {
      setRefreshing(false);
    }
  }, [dispatch, channelId]);

  const meRole = (me?.role ?? "").toLowerCase();
  const canManageMembers = meRole === "admin" || meRole === "super-admin";
  const meId = me?._id ? String(me._id) : null;

  // Fetch users when admins view so we can map member ids to user details.
  React.useEffect(() => {
    if (!canManageMembers) return;
    if (adminUsers?.length) return;
    dispatch(fetchAdminUsers());
    dispatch(fetchAdminUsers({ role: "client" } as any));
  }, [adminUsers?.length, canManageMembers, dispatch]);

  const userMap = useMemo(() => {
    const map = new Map<string, any>();
    for (const u of adminUsers ?? []) {
      if (!u?._id) continue;
      map.set(String(u._id), u);
    }
    return map;
  }, [adminUsers]);

  const tryRemoveMember = useCallback(
    async (member: MemberItem) => {
      if (!channelId) return;
      const rawType = (member.channelType || "normal").toLowerCase();
      const type = rawType === "member" ? "normal" : rawType;
      setRemovingId(member.id);
      try {
        await dispatch(
          removeMemberFromChannel({ channelId, userId: member.id, type })
        ).unwrap();
      } catch (err) {
        console.warn("[channel/remove-member] failed", err);
      } finally {
        setRemovingId(null);
      }
    },
    [dispatch, channelId]
  );

  const confirmRemove = useCallback(
    (member: MemberItem) => {
      if (!member?.id || !channelId) return;
      Alert.alert(
        "Remove member",
        `Remove ${member.name || "this member"} from the channel?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Remove",
            style: "destructive",
            onPress: () => tryRemoveMember(member),
          },
        ]
      );
    },
    [channelId, tryRemoveMember]
  );

  const members: MemberItem[] = useMemo(() => {
    if (!channel) return [];

    const rawMembers = Array.isArray((channel as any)?.members)
      ? (channel as any).members
      : [];

    // If API already provides members, normalize and return.
    if (rawMembers.length > 0) {
      const mapped: MemberItem[] = rawMembers.map((m: any, idx: number) => {
        const user = m;
        const userId =
          user?._id ??
          user?.id ??
          m?.userId ??
          m?.memberId ??
          `member-${idx}`;
        const userInfo = userMap.get(String(userId));
        const rawType = m?.type ?? m?.memberType ?? "normal";
        return {
          id: String(userId),
          name: String(
            userInfo?.fullname ??
              userInfo?.username ??
              userInfo?.email ??
              user?.name ??
              user?.fullName ??
              user?.username ??
              user?.displayName ??
              "Member"
          ),
          avatar:
            userInfo?.profilePicture ??
            user?.profilePicture ??
            user?.avatar ??
            null,
          role: userInfo?.role ?? m?.role ?? user?.role ?? null,
          channelType: rawType ? String(rawType) : null,
        };
      });
      const seen = new Set<string>();
      const deduped: MemberItem[] = [];
      for (const curr of mapped) {
        const id = curr.id || `member-${deduped.length}`;
        if (seen.has(id)) continue;
        seen.add(id);
        deduped.push({ ...curr, id });
      }
      return deduped;
    }

    // Fallback: derive members from createdBy + contributors in resources
    const byId = new Map<string, MemberItem>();

    // 1) Owner / creator
    const cb = (channel as any).createdBy;
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

    // Optional: include current user if they're in context and absent
    if (me?._id && !byId.has(String(me._id))) {
      byId.set(String(me._id), {
        id: String(me._id),
        name: me?.fullname || me?.username || me?.email || "You",
        avatar: (me as any)?.profilePicture ?? null,
        role: "you",
      });
    }

    return Array.from(byId.values());
  }, [channel, me?._id, userMap]);

  console.log(members)

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
        <Text className="text-gray-600 mt-3 font-kumbh">Loading channel...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />
      {HeaderBar}

      <FlatList
        data={members}
        keyExtractor={(m) => m.id}
        ListHeaderComponent={header}
        renderItem={({ item }) => {
          const memberRole = (item.role ?? "").toLowerCase();
          const isPrivileged = ["admin", "super-admin"].includes(memberRole);
          const isSelf = meId === item.id;
          const canRemoveMember =
            canManageMembers && !isSelf && !isPrivileged;

          return (
            <RowMember
              item={item}
              onPress={() => {
                // e.g., router.push({ pathname: "/(staff)/users/[userId]", params: { userId: item.id }});
              }}
              canRemove={canRemoveMember}
              isRemoving={removingId === item.id}
              onRemove={() => confirmRemove(item)}
            />
          );
        }}
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
