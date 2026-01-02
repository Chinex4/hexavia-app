// app/(admin)/team/sanctions/[staffId].tsx
import clsx from "clsx";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
    ArrowLeft,
    Calendar,
    Pencil,
    ShieldAlert,
} from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Modal,
    Pressable,
    RefreshControl,
    Switch,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
    selectSanctions,
    selectSanctionsError,
    selectSanctionsLoading,
    selectSanctionsUpdating,
} from "@/redux/sanctions/sanctions.slice";
import {
    fetchSanctions,
    updateSanction,
} from "@/redux/sanctions/sanctions.thunks";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

type RowStatus = "Active" | "Resolved";

export default function StaffSanctions() {
  const router = useRouter();
  const { staffId, name } = useLocalSearchParams();
  const dispatch = useAppDispatch();

  const rawRows = useAppSelector(selectSanctions);
  const rows = Array.isArray(rawRows) ? rawRows : [];
  const loading = useAppSelector(selectSanctionsLoading);
  const updating = useAppSelector(selectSanctionsUpdating);
  const error = useAppSelector(selectSanctionsError) ?? null;

  const [filter, setFilter] = useState<RowStatus | "All">("All");
  const [refreshing, setRefreshing] = useState(false);

  // modal state
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editReason, setEditReason] = useState<string>("");
  const [editActive, setEditActive] = useState<boolean>(true);

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

  const userSanctions = useMemo(() => {
    return rows.filter((r: any) => {
      const uid = r?.sanctionUser?._id || r?.user?._id;
      return uid === staffId;
    });
  }, [rows, staffId]);

  const data = useMemo(() => {
    return userSanctions
      .map((r: any) => {
        const dateStr = r?.date || r?.createdAt || "";
        const status: RowStatus = r?.isActive ? "Active" : "Resolved";
        return {
          id: r._id,
          date: dateStr,
          reason: r?.reason ?? "—",
          status,
          raw: r,
        };
      })
      .filter((r) => (filter === "All" ? true : r.status === filter));
  }, [userSanctions, filter]);

  const openEdit = useCallback((item: any) => {
    setEditId(item.id);
    setEditReason(item.raw?.reason ?? "");
    setEditActive(!!item.raw?.isActive);
    setEditOpen(true);
  }, []);

  const closeEdit = useCallback(() => {
    setEditOpen(false);
    setEditId(null);
  }, []);

  const handleSave = useCallback(async () => {
    if (!editId) return;
    await dispatch(
      updateSanction({
        sanctionId: editId,
        reason: editReason?.trim() || undefined,
        isActive: editActive,
      }) as any
    ).unwrap();
    setEditOpen(false);
  }, [dispatch, editId, editReason, editActive]);

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
        <Text className="text-2xl font-kumbhBold text-gray-900">{name ? `${name}'s Sanctions` : 'Sanctions'}</Text>
        <View className="w-10" />
      </View>

      {/* Pills */}
      <View className="px-5 flex-row gap-2">
        {(["All", "Active", "Resolved"] as const).map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setFilter(tab)}
            className={clsx(
              "px-4 py-2 rounded-full border",
              filter === tab
                ? "bg-primary border-primary"
                : "bg-white border-gray-200"
            )}
          >
            <Text
              className={clsx(
                "text-sm font-kumbhBold",
                filter === tab ? "text-white" : "text-gray-700"
              )}
            >
              {tab}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* List */}
      {loading && userSanctions.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#7C3AED" />
          <Text className="mt-2 text-gray-500 font-kumbh">
            Loading sanctions…
          </Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(i) => i.id}
          contentContainerClassName="px-5 pt-4 pb-10"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ItemSeparatorComponent={() => <View className="h-3" />}
          renderItem={({ item }) => (
            <Card>
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <ShieldBadge status={item.status} />
                </View>
                <Pressable
                  onPress={() => openEdit(item)}
                  className="px-3 py-2 rounded-xl bg-gray-100 active:bg-gray-200"
                >
                  <View className="flex-row items-center gap-1">
                    <Pencil size={16} color="#374151" />
                    <Text className="text-gray-800 font-kumbhBold text-xs">
                      Edit
                    </Text>
                  </View>
                </Pressable>
              </View>

              <Divider />

              <Row icon={<Calendar size={16} color="#6366F1" />}>
                <Label>Date</Label>
                <Value>{formatDate(item.date)}</Value>
              </Row>

              <Row icon={<ShieldAlert size={16} color="#6366F1" />}>
                <Label>Reason</Label>
                <Value>{item.reason}</Value>
              </Row>
            </Card>
          )}
          ListEmptyComponent={
            <View className="px-5 py-12">
              <Text className="text-center text-gray-500 font-kumbh">
                {error ? `Error: ${error}` : "No sanctions found for this staff."}
              </Text>
            </View>
          }
        />
      )}

      {/* Edit Modal */}
      <Modal
        transparent
        visible={editOpen}
        animationType="slide"
        onRequestClose={closeEdit}
      >
        <View className="flex-1 bg-black/40 items-center justify-end">
          <View className="w-full rounded-t-3xl bg-white p-5">
            <View className="items-center mb-3">
              <View className="w-12 h-1.5 rounded-full bg-gray-300" />
            </View>

            <Text className="text-gray-900 font-kumbhBold text-lg mb-3">
              Update Sanction
            </Text>

            <Text className="text-gray-700 font-kumbh mb-2">Reason</Text>
            <TextInput
              placeholder="Enter reason"
              placeholderTextColor="#9CA3AF"
              value={editReason}
              onChangeText={setEditReason}
              className="bg-gray-50 text-gray-900 rounded-xl px-4 py-3 font-kumbh mb-4 border border-gray-200"
              multiline
            />

            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-gray-700 font-kumbh">Active</Text>
              <Switch
                value={editActive}
                onValueChange={setEditActive}
                trackColor={{ true: "#7C3AED", false: "#D1D5DB" }}
              />
            </View>

            <View className="flex-row gap-3">
              <Pressable
                onPress={closeEdit}
                className="flex-1 rounded-2xl bg-gray-100 py-3 items-center"
              >
                <Text className="text-gray-800 font-kumbhBold">Cancel</Text>
              </Pressable>
              <Pressable
                disabled={updating}
                onPress={handleSave}
                className={clsx(
                  "flex-1 rounded-2xl py-3 items-center",
                  updating ? "bg-[#7C3AED]/60" : "bg-[#7C3AED]"
                )}
              >
                <Text className="text-white font-kumbhBold">
                  {updating ? "Saving…" : "Save"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* ───────── light-themed building blocks ───────── */

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