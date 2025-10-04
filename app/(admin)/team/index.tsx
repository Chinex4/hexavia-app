// app/(admin)/team/index.tsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { View, Text, Pressable, FlatList, ActivityIndicator, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, ArrowRight, Plus } from "lucide-react-native";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

import { fetchAdminUsers } from "@/redux/admin/admin.thunks";
import { selectAdminUsers, selectAdminLoading, selectAdminErrors } from "@/redux/admin/admin.slice";

import { fetchSanctions } from "@/redux/sanctions/sanctions.thunks";
import { selectSanctions } from "@/redux/sanctions/sanctions.slice";

export default function TeamIndex() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const staff = useAppSelector(selectAdminUsers).filter((u) => u.role === "staff");
  const loading = useAppSelector(selectAdminLoading);
  const error = useAppSelector(selectAdminErrors);

  const sanctions = useAppSelector(selectSanctions);
  const totalSanctions = sanctions.length;

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    dispatch(fetchAdminUsers({ role: "staff" }));
    dispatch(fetchSanctions()); // load all so we can count
  }, [dispatch]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        dispatch(fetchAdminUsers({ role: "staff" })).unwrap(),
        dispatch(fetchSanctions()).unwrap(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [dispatch]);

  const data = useMemo(() => staff, [staff]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="px-5 pt-6 pb-4 flex-row items-center gap-4">
        <Pressable onPress={() => router.back()} className="w-10 h-10 items-center justify-center">
          <ArrowLeft size={24} color="#111827" />
        </Pressable>
        <Text className="text-3xl font-kumbhBold text-text">Team</Text>
      </View>

      {/* Sanction Grid Card */}
      <View className="mx-5 mt-2 rounded-2xl bg-primary-50 p-4 border border-primary-100">
        <Text className="text-2xl font-kumbhBold text-text">Sanction Grid</Text>
        <Text className="mt-1 text-gray-600 font-kumbh">Total : {totalSanctions}</Text>

        <View className="mt-4 flex-row gap-3">
          <Pressable
            onPress={() => router.push("/(admin)/team/sanctions")}
            className="flex-1 h-12 rounded-xl border border-primary-400 items-center justify-center"
          >
            <Text className="text-primary-600 font-kumbhBold">View</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push("/(admin)/team/sanctions/create")}
            className="flex-1 h-12 rounded-xl bg-primary-500 items-center justify-center active:opacity-90 flex-row gap-2"
          >
            <Plus size={18} color="#fff" />
            <Text className="text-white font-kumbhBold">Add New</Text>
          </Pressable>
        </View>
      </View>

      {/* Staff list */}
      {loading && data.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
          <Text className="mt-2 text-gray-500 font-kumbh">Loading staff…</Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(i) => i._id}
          contentContainerClassName="px-5 pt-6 pb-12"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ItemSeparatorComponent={() => <View className="h-[1px] bg-gray-200 my-4" />}
          renderItem={({ item }) => (
            <View>
              <Text className="text-lg font-kumbhBold text-text">{item.fullname || item.username || item.email}</Text>
              <Row label="Email" value={item.email ?? "—"} />
              <Row label="Username" value={item.username ?? "—"} />
              <Row label="Role" value={item.role} />
              <Row label="Status" value={item.suspended ? "Suspended" : "Active"} />
              <Row label="Joined" value={formatDate(item.createdAt)} />

              <Pressable
                onPress={() => router.push({ pathname: "/(admin)/team/[id]", params: { id: item._id } })}
                className="mt-2 flex-row items-center justify-between"
              >
                <Text className="text-base text-gray-700 font-kumbh">View details</Text>
                <ArrowRight size={20} color="#111827" />
              </Pressable>
            </View>
          )}
          ListEmptyComponent={
            <View className="px-5 py-16">
              <Text className="text-center text-gray-500 font-kumbh">
                {error ? `Error: ${error}` : "No staff found."}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between py-1">
      <Text className="text-base text-gray-700 font-kumbh">{label}</Text>
      <Text className="text-base text-text font-kumbhBold max-w-[60%] text-right">{value}</Text>
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
