import React, { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  Text,
  View,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router, Stack, useLocalSearchParams } from "expo-router";

import BoardCard from "@/components/client/tasks/BoardCard";
import FabCreate from "@/components/staff/tasks/FabCreate";
import CreateTaskModal from "@/components/staff/tasks/modals/CreateTaskModal";
import TaskDetailModal from "@/components/staff/tasks/modals/TaskDetailModal";
import { STATUS_META, StatusKey, Task } from "@/features/staff/types";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectUser } from "@/redux/user/user.slice";
import { fetchProfile } from "@/redux/user/user.thunks";
import { fetchChannelById } from "@/redux/channels/channels.thunks";
import {
  makeSelectDefaultChannelId,
  selectStatus as selectChannelsStatus,
} from "@/redux/channels/channels.selectors";
import { selectChannelById } from "@/redux/channels/channels.slice";
import { fromApiStatus } from "@/features/client/statusMap";

const PRIMARY = "#4C5FAB";

export default function StatusScreen() {
  const params = useLocalSearchParams<{ status: StatusKey }>();
  const statusKey = (params.status || "in_progress") as StatusKey;

  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  useEffect(() => {
    if (!user?._id) dispatch(fetchProfile());
  }, [dispatch, user?._id]);

  const userId = user?._id ?? null;

  // pick default channel id for user
  const defaultChannelId = useAppSelector(
    makeSelectDefaultChannelId(userId, "recent")
  );

  // fetch that channel
  const channelsStatus = useAppSelector(selectChannelsStatus);
  useEffect(() => {
    if (defaultChannelId) dispatch(fetchChannelById(String(defaultChannelId)));
  }, [dispatch, defaultChannelId]);

  // read the channel + tasks
  const channel = useAppSelector(selectChannelById(defaultChannelId || "")) as
    | any
    | null;
  const rawTasks: any[] = Array.isArray(channel?.tasks) ? channel.tasks : [];

  const uiTasks: Task[] = useMemo(
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

  const list = useMemo(
    () => uiTasks.filter((t) => t.status === statusKey),
    [uiTasks, statusKey]
  );

  // modals
  const [showCreate, setShowCreate] = useState(false);
  const [edit, setEdit] = useState<Task | null>(null);

  const isLoading = channelsStatus === "loading" && !channel;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />

      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-2 pb-3 mt-5">
        <Pressable
          onPress={() => router.push("/(staff)/(tabs)/tasks")}
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
                project={channel?.name ?? "—"}
                title={item.title}
                description={item.description || ""}
                statusLabel={STATUS_META[item.status].title}
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
          task={edit}
        />
      )}
    </SafeAreaView>
  );
}
