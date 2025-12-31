// app/(app)/tasks/StatusScreen.tsx
import Ionicons from "@expo/vector-icons/Ionicons";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import BoardCard from "@/components/client/tasks/BoardCard";
import FabCreate from "@/components/staff/tasks/FabCreate";
import CreateTaskModal from "@/components/staff/tasks/modals/CreateTaskModal";
import TaskDetailModal from "@/components/staff/tasks/modals/TaskDetailModal";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

import { makeSelectDefaultChannelId, selectStatus as selectChannelsStatus } from "@/redux/channels/channels.selectors";
import { fetchChannelById } from "@/redux/channels/channels.thunks";
import { selectUser } from "@/redux/user/user.slice";
import { fetchProfile } from "@/redux/user/user.thunks";

// NEW: our task selectors
import {
  ChannelStatusKey,
  makeSelectChannelTasksByChannelId,
  makeSelectChannelTasksByStatus,
} from "@/redux/channels/channels.selectors";

import { STATUS_META } from "@/features/staff/types";

const PRIMARY = "#4C5FAB";

// Tabs you want to show
const TABS: { key: ChannelStatusKey; label: string }[] = [
  { key: "not-started", label: "Not started" },
  { key: "in-progress", label: "In progress" },
  { key: "completed", label: "Completed" },
  { key: "canceled", label: "Canceled" },
];

export default function StatusScreen() {
  const params = useLocalSearchParams<{
    status?: ChannelStatusKey;
    channelId?: string;
  }>();
  const statusKey: ChannelStatusKey =
    (params.status as ChannelStatusKey) || "in-progress";
  const paramChannelId = (params.channelId as string) || null;

  const dispatch = useAppDispatch();

  // ensure we have user (for default channel calculation)
  const user = useAppSelector(selectUser);
  useEffect(() => {
    if (!user?._id) dispatch(fetchProfile());
  }, [dispatch, user?._id]);

  const defaultChannelId = useAppSelector(
    makeSelectDefaultChannelId(user?._id ?? null, "recent")
  );
  const channelId = paramChannelId || defaultChannelId || null;

  // fetch the chosen channel when id becomes known
  useEffect(() => {
    if (channelId) dispatch(fetchChannelById(String(channelId)));
  }, [dispatch, channelId]);

  const channelsStatus = useAppSelector(selectChannelsStatus);

  // derive tasks
  const selectAllChannelTasks = useMemo(
    () => makeSelectChannelTasksByChannelId(channelId),
    [channelId]
  );
  const selectChannelTasksByStatus = useMemo(
    () => makeSelectChannelTasksByStatus(channelId, statusKey),
    [channelId, statusKey]
  );

  const allChannelTasks = useAppSelector(selectAllChannelTasks);
  // console.log("All channel tasks:", allChannelTasks);
  const list = useAppSelector(selectChannelTasksByStatus);

  // modals
  const [showCreate, setShowCreate] = useState(false);
  const [edit, setEdit] = useState(null);

  const isLoading = channelsStatus === "loading" && !allChannelTasks.length;

  const goTab = (key: ChannelStatusKey) => {
    router.setParams({ status: key, channelId: channelId ?? undefined });
  };

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    if (!channelId) return;
    try {
      setRefreshing(true);
      await dispatch(fetchChannelById(String(channelId))).unwrap();
    } catch (e) {
    } finally {
      setRefreshing(false);
    }
  }, [dispatch, channelId]);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />

      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-2 pb-3 mt-5">
        <Pressable
          onPress={() => router.back()}
          className="h-9 w-9 rounded-full items-center justify-center"
        >
          <Ionicons name="chevron-back" size={22} color="#111827" />
        </Pressable>
        <Text className="font-kumbh text-3xl ml-3 text-[#111827]">
          Task Boards
        </Text>
        <View className="w-10" />
      </View>

      {/* Tabs */}
      <View className="flex-row px-4 gap-1">
        {TABS.map((t) => {
          const active = t.key === statusKey;
          return (
            <Pressable
              key={t.key}
              onPress={() => goTab(t.key)}
              className={`px-3 py-1.5 rounded-full border ${
                active ? "bg-[#4C5FAB] border-[#4C5FAB]" : "border-[#E5E7EB]"
              }`}
            >
              <Text
                className={`font-kumbh text-sm ${active ? "text-white" : "text-[#374151]"}`}
              >
                {t.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* List */}
      {isLoading ? (
        // ...spinner...
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="small" color={PRIMARY} />
          <Text className="mt-2 text-[#6B7280] font-kumbh">Loading tasks…</Text>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={{
            paddingBottom: 120,
            paddingTop: 12,
          }}
          data={list}
          keyExtractor={(i) => i.id}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          renderItem={({ item }) => (
            <Pressable onPress={() => setEdit(item as any)}>
              <BoardCard
                project={item.channelCode || "—"}
                title={item.title}
                description={item.description || ""}
                statusLabel={
                  TABS.find((t) => t.key === item.status)?.label ?? item.status
                }
                cardBg={STATUS_META[item.status].bgColor}
                pillBg={STATUS_META[item.status].arrowBg}
              />
            </Pressable>
          )}
          ListEmptyComponent={
            <View className="px-4 mt-4">
              <Text className="font-kumbh text-[#9CA3AF] text-center">
                No tasks in this category yet.
              </Text>
            </View>
          }
          refreshing={
            refreshing ||
            (channelsStatus === "loading" && !!allChannelTasks.length)
          }
          onRefresh={onRefresh}
        />
      )}

      <FabCreate onPress={() => setShowCreate(true)} />

      {/* Modals */}
      <CreateTaskModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
      />
      {edit && (
        <TaskDetailModal
          visible={!!edit}
          onClose={() => setEdit(null)}
          task={edit as any}
        />
      )}
    </SafeAreaView>
  );
}
