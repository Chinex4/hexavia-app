import Ionicons from "@expo/vector-icons/Ionicons";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import BoardCard from "@/components/client/tasks/BoardCard";
import FabCreate from "@/components/staff/tasks/FabCreate";
import CreateTaskModal from "@/components/staff/tasks/modals/CreateTaskModal";
import TaskDetailModal from "@/components/staff/tasks/modals/TaskDetailModal";
import { STATUS_META, StatusKey, Task } from "@/features/staff/types";

import { fromApiStatus } from "@/features/client/statusMap";
import {
  makeSelectDefaultChannelId,
  selectStatus as selectChannelsStatus,
} from "@/redux/channels/channels.selectors";
import { selectChannelById } from "@/redux/channels/channels.slice";
import {
  fetchChannelById,
  fetchChannels,
} from "@/redux/channels/channels.thunks";
import { selectUser } from "@/redux/user/user.slice";
import { fetchProfile } from "@/redux/user/user.thunks";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchPersonalTasks } from "@/redux/personalTasks/personalTasks.thunks";
import { selectAllPersonalTasks } from "@/redux/personalTasks/personalTasks.selectors";

const PRIMARY = "#4C5FAB";

export default function StatusScreen() {
  const params = useLocalSearchParams<{ status: StatusKey }>();
  const statusKey = (params.status || "in-progress") as StatusKey;

  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);

  useEffect(() => {
    if (!user?._id) dispatch(fetchProfile());
    dispatch(fetchPersonalTasks());
  }, [dispatch, user?._id]);

  const userId = user?._id ?? null;

  const defaultChannelId = useAppSelector(
    makeSelectDefaultChannelId(userId, "recent")
  );
  const channelsStatus = useAppSelector(selectChannelsStatus);

  useEffect(() => {
    if (defaultChannelId) dispatch(fetchChannelById(String(defaultChannelId)));
    else dispatch(fetchChannels());
  }, [dispatch, defaultChannelId]);

  const channel = useAppSelector(selectChannelById(defaultChannelId || "")) as
    | any
    | null;
  const rawTasks: any[] = Array.isArray(channel?.tasks) ? channel.tasks : [];

  const channelUITasks: Task[] = useMemo(
    () =>
      rawTasks.map((t) => ({
        id: String(t?._id ?? t?.id),
        title: String(t?.name ?? t?.title ?? "Untitled task"),
        description: t?.description ?? null,
        status: fromApiStatus(t?.status),
        channelCode: channel?.code ?? "",
        channelId: t?.channelId ? String(t.channelId) : undefined,
        createdAt:
          typeof t?.createdAt === "number"
            ? t.createdAt
            : t?.createdAt
              ? new Date(t.createdAt).getTime()
              : Date.now(),
      })),
    [rawTasks, channel?.code]
  );

  const personal = useAppSelector(selectAllPersonalTasks);
  const personalTasks: Task[] = useMemo(
    () =>
      personal
        .filter((p) => p.status === statusKey)
        .map((p) => ({
          id: p.id,
          title: p.title,
          description: p.description as any,
          status: p.status as StatusKey,
          channelCode: "personal",
          channelId: "personal",
          createdAt: p.createdAt,
        })),
    [personal, statusKey]
  );

  const list = useMemo(
    () =>
      [
        ...channelUITasks.filter((t) => t.status === statusKey),
        ...personalTasks,
      ].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)),
    [channelUITasks, personalTasks, statusKey]
  );

  const [showCreate, setShowCreate] = useState(false);
  const [edit, setEdit] = useState<Task | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      if (defaultChannelId) {
        await dispatch(fetchChannelById(String(defaultChannelId))).unwrap();
      } else {
        await dispatch(fetchChannels()).unwrap();
      }
      await dispatch(fetchPersonalTasks()).unwrap();
    } finally {
      setRefreshing(false);
    }
  }, [dispatch, defaultChannelId]);

  const isLoading = channelsStatus === "loading" && !channel;
  const role = (useAppSelector(selectUser)?.role ?? "staff") as
      | "staff"
      | "client";

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />

      <View className="flex-row items-center justify-between px-4 pt-2 pb-3 mt-5">
        <Pressable
          onPress={() => router.push(`/(${role})/(tabs)/tasks`)}
          className="h-9 w-9 rounded-full items-center justify-center"
        >
          <Ionicons name="chevron-back" size={22} color="#111827" />
        </Pressable>
        <Text className="font-kumbh text-3xl ml-3 text-[#111827]">
          Task Boards
        </Text>
        <View className="w-10" />
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="small" color={PRIMARY} />
          <Text className="mt-2 text-[#6B7280] font-kumbh">Loading tasks…</Text>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={{ paddingBottom: 120 }}
          data={list}
          keyExtractor={(i) => i.id}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          renderItem={({ item }) => (
            <Pressable onPress={() => setEdit(item)}>
              <BoardCard
                project={
                  item.channelCode === "personal"
                    ? "My Tasks"
                    : (channel?.name ?? "—")
                }
                title={item.title}
                description={item.description || ""}
                statusLabel={STATUS_META[item.status].title}
              />
            </Pressable>
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#4C5FAB"
              colors={["#4C5FAB"]}
            />
          }
          ListEmptyComponent={
            <View className="px-4 mt-4">
              <Text className="font-kumbh text-[#9CA3AF] text-center">
                No tasks in this category yet.
              </Text>
            </View>
          }
        />
      )}

      <FabCreate onPress={() => setShowCreate(true)} />
      <CreateTaskModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
      />
      {edit && (
        <TaskDetailModal
          visible={!!edit}
          onClose={() => setEdit(null)}
          task={edit}
        />
      )}
    </SafeAreaView>
  );
}
