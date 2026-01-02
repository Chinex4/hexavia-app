// app/(admin)/team/sanctions/index.tsx
import clsx from "clsx";
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  selectSanctions,
  selectSanctionsError,
  selectSanctionsLoading,
  selectSanctionsUpdating,
} from "@/redux/sanctions/sanctions.slice";
import { fetchSanctions } from "@/redux/sanctions/sanctions.thunks";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

type RowStatus = "Active" | "Resolved";

export default function SanctionsView() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const rawRows = useAppSelector(selectSanctions);
  const rows = Array.isArray(rawRows) ? rawRows : [];
  const loading = useAppSelector(selectSanctionsLoading);
  const updating = useAppSelector(selectSanctionsUpdating);
  const error = useAppSelector(selectSanctionsError) ?? null;

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    dispatch(fetchSanctions() as any);
  }, [dispatch]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await dispatch(fetchSanctions() as any).unwrap();
    } finally {
      setRefreshing(false);
    }
  }, [dispatch]);

  const staffs = useMemo(() => {
    const map = new Map();
    rows.forEach((r: any) => {
      const user = r?.sanctionUser || r?.user;
      if (!user || !user._id) return;
      const id = user._id;
      if (!map.has(id)) {
        map.set(id, {
          id,
          name: user.username || user.email || user.fullname || "Unknown",
          sanctions: [],
        });
      }
      map.get(id).sanctions.push(r);
    });
    return Array.from(map.values()).map((staff) => ({
      ...staff,
      activeCount: staff.sanctions.filter((s: any) => s.isActive).length,
      totalCount: staff.sanctions.length,
    }));
  }, [rows]);

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]">
      {/* Header */}
      <View className="px-5 pt-6 pb-3 flex-row items-center justify-between gap-4">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center rounded-full bg-gray-100"
        >
          <ArrowLeft size={22} color="#1F2937" />
        </Pressable>
        <Text className="text-2xl font-kumbhBold text-gray-900">Sanctions</Text>
        <View className="w-10" />
      </View>

      {/* List */}
      {loading && rows.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#7C3AED" />
          <Text className="mt-2 text-gray-500 font-kumbh">
            Loading sanctions…
          </Text>
        </View>
      ) : (
        <FlatList
          data={staffs}
          keyExtractor={(i) => i.id}
          contentContainerClassName="px-5 pt-4 pb-10"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ItemSeparatorComponent={() => <View className="h-3" />}
          renderItem={({ item }) => <StaffCard item={item} />}
          ListEmptyComponent={
            <View className="px-5 py-12">
              <Text className="text-center text-gray-500 font-kumbh">
                {error ? `Error: ${error}` : "No staffs with sanctions found."}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

/* ───────── light-themed building blocks ───────── */

function StaffCard({ item }: { item: any }) {
  const router = useRouter();
  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: "/(admin)/team/sanctions/[staffId]",
          params: { staffId: item.id, name: item.name },
        } as any)
      }
    >
      <Card>
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-gray-900 font-kumbhBold text-base">
              {item.name}
            </Text>
            <Text className="text-gray-600 font-kumbh text-sm">
              {item.totalCount} sanctions ({item.activeCount} active)
            </Text>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <View className="rounded-2xl bg-white border border-gray-200 p-4 shadow-sm">
      {children}
    </View>
  );
}
function Divider() {
  return <View className="h-px bg-gray-100 my-3" />;
}
function Row({
  children,
  icon,
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <View className="flex-row items-center justify-between py-1">
      <View className="flex-row items-center gap-2 flex-1">
        {icon}
        <View className="flex-row items-center flex-1">{children}</View>
      </View>
    </View>
  );
}
function Label({ children }: { children: React.ReactNode }) {
  return <Text className="text-gray-600 font-kumbh">{children}</Text>;
}
function Value({
  children,
  numberOfLines,
}: {
  children: React.ReactNode;
  numberOfLines?: number;
}) {
  return (
    <Text
      numberOfLines={numberOfLines}
      className="text-gray-900 font-kumbhBold ml-auto max-w-[60%] text-right"
    >
      {children}
    </Text>
  );
}

function ShieldBadge({ status }: { status: RowStatus }) {
  const map = {
    Active: { bg: "bg-red-50", dot: "bg-red-500", text: "text-red-700" },
    Resolved: {
      bg: "bg-green-50",
      dot: "bg-green-600",
      text: "text-green-700",
    },
  } as const;
  const s = map[status];
  return (
    <View
      className={clsx("px-2 py-1 rounded-lg flex-row items-center gap-1", s.bg)}
    >
      <View className={clsx("w-2 h-2 rounded-full", s.dot)} />
      <Text className={clsx("text-xs font-kumbhBold", s.text)}>{status}</Text>
    </View>
  );
}

function formatDate(d?: string) {
  if (!d) return "—";
  try {
    const dt = new Date(d);
    return dt.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return d;
  }
}
