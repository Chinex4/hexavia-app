// app/(admin)/clients/index.tsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Plus } from "lucide-react-native";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchAdminUsers } from "@/redux/admin/admin.thunks";
import {
  selectAdminUsers,
  selectAdminLoading,
  selectAdminErrors,
} from "@/redux/admin/admin.slice";
import type { AdminUser } from "@/redux/admin/admin.types";

// local tabs aligned with API fields
type TabKey = "all" | "active" | "suspended";

export default function ClientsIndex() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const users = useAppSelector(selectAdminUsers);
  const loading = useAppSelector(selectAdminLoading);
  const lastError = useAppSelector(selectAdminErrors);

  const [tab, setTab] = useState<TabKey>("all");
  const [refreshing, setRefreshing] = useState(false);

  // fetch ONLY clients on mount
  useEffect(() => {
    dispatch(fetchAdminUsers({ role: "client" }));
  }, [dispatch]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await dispatch(fetchAdminUsers({ role: "client" })).unwrap();
    } finally {
      setRefreshing(false);
    }
  }, [dispatch]);

  // filter per tab
  const data = useMemo(() => {
    // console.log(users)
    let arr = users.filter((u) => u.role === "client");
    if (tab === "active") arr = arr.filter((u) => !u.isSuspended);
    if (tab === "suspended") arr = arr.filter((u) => !!u.isSuspended);
    return arr;
  }, [users, tab]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="px-5 pt-6 pb-4">
        <View className="flex-row items-center justify-between gap-4">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full items-center justify-center"
          >
            <ArrowLeft size={24} color="#111827" />
          </Pressable>
          <Text className="text-3xl font-kumbh text-text">
            Hexavia Clients
          </Text>
          <View className="w-10"/>
        </View>

        {/* Add client (navigates to your create screen) */}
        <Pressable
          onPress={() => router.push("/(admin)/clients/create")}
          className="mt-6 self-center flex-row items-center gap-3 rounded-2xl bg-primary-50 px-6 py-4 border border-primary-100"
        >
          <View className="w-7 h-7 rounded-lg bg-white items-center justify-center">
            <Plus size={18} color="#111827" />
          </View>
          <Text className="text-base font-kumbh text-text">
            Add a new Client
          </Text>
        </Pressable>

        {/* Tabs: All / Active / Suspended */}
        <View className="mt-6 flex-row items-center gap-8 px-1">
          {(["all", "active", "suspended"] as const).map((t) => (
            <Pressable
              key={t}
              onPress={() => setTab(t)}
              className="items-center"
            >
              <Text
                className={`text-base font-kumbh ${
                  tab === t ? "text-blue-500 font-kumbhBold" : "text-gray-600"
                }`}
              >
                {labelForTab(t)}
              </Text>
              {tab === t ? (
                <View className="h-[3px] w-28 bg-blue-300 rounded-full mt-2" />
              ) : (
                <View className="h-[3px] w-28 mt-2" />
              )}
            </Pressable>
          ))}
        </View>
      </View>

      {/* Body */}
      {loading && users.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
          <Text className="mt-2 text-gray-500 font-kumbh">
            Loading clients…
          </Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item._id}
          contentContainerClassName="px-5 pb-10"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ItemSeparatorComponent={() => (
            <View className="h-[1px] bg-gray-200 my-4" />
          )}
          renderItem={({ item }) => (
            <ClientRow
              item={item}
              onPress={(id) =>
                router.push({
                  pathname: "/(admin)/clients/[id]",
                  params: { id },
                })
              }
            />
          )}
          ListEmptyComponent={
            <View className="px-5 py-12">
              <Text className="text-center text-gray-500 font-kumbh">
                {lastError ? `Error: ${lastError}` : "No clients in this tab."}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

function ClientRow({
  item,
  onPress,
}: {
  item: AdminUser;
  onPress: (id: string) => void;
}) {
  const name = getDisplayName(item);
  const joined = formatDate(item.createdAt);
  const badgeText = item.isSuspended ? "Suspended" : "Active";
  const badgeStyle = item.isSuspended
    ? "bg-red-100 text-red-700"
    : "bg-green-100 text-green-700";

  return (
    <Pressable onPress={() => onPress(item._id)} className="py-1">
      <Row label="Name" value={name} />
      <Row label="Email" value={item.email ?? "—"} />
      <Row label="Role" value={item.role} />
      <Row label="Joined" value={joined} />
      <View className="flex-row items-center justify-between py-2">
        <Text className="text-base text-gray-700 font-kumbh">Status</Text>
        <View className={`px-3 py-1 rounded-full ${badgeStyle}`}>
          <Text className="text-xs font-kumbhBold">{badgeText}</Text>
        </View>
      </View>
    </Pressable>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between py-2">
      <Text className="text-base text-gray-700 font-kumbh">{label}</Text>
      <Text className="text-base text-text font-kumbhBold">{value}</Text>
    </View>
  );
}
function getDisplayName(u: Partial<AdminUser>) {
  return (u.fullname || u.username || u.email || "Unknown").toString();
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
function labelForTab(t: TabKey) {
  if (t === "all") return "All";
  if (t === "active") return "Active";
  return "Suspended";
}
