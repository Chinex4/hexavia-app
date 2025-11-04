// components/staff/tasks/TasksOverviewCard.tsx
import { router } from "expo-router";
import React, { useEffect, useMemo } from "react";
import { FlatList, Image, Pressable, Text, View } from "react-native";

import {
  makeSelectDefaultChannelId,
  selectStatus as selectChannelsStatus,
} from "@/redux/channels/channels.selectors";
import { selectChannelById } from "@/redux/channels/channels.slice";
import { fetchChannelById } from "@/redux/channels/channels.thunks";
import { selectUser } from "@/redux/user/user.slice";
import { fetchProfile } from "@/redux/user/user.thunks";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

// backend -> UI status mapping (same as used elsewhere)
const fromApiStatus = (s?: string | null) => {
  const v = (s ?? "").toLowerCase().replace(/_/g, "-");
  if (v === "in-progress") return "in-progress";
  if (v === "not-started" || v === "pending" || v === "todo")
    return "not-started";
  if (v === "completed" || v === "done") return "completed";
  if (v === "canceled" || v === "cancelled") return "canceled";
  return "in-progress";
};

type UiTask = {
  id: string;
  title: string;
  description?: string | null;
  status: "in-progress" | "completed" | "not-started" | "canceled";
  channelCode?: string | null;
  createdAt: number;
};

export default function TasksOverviewCard() {
  const dispatch = useAppDispatch();

  // ensure we have a user (to compute default channel)
  const user = useAppSelector(selectUser);
  useEffect(() => {
    if (!user?._id) dispatch(fetchProfile());
  }, [dispatch, user?._id]);

  const userId = user?._id ?? null;

  // pick default channel for this user (same selector you already use)
  const defaultChannelId = useAppSelector(
    makeSelectDefaultChannelId(userId, "recent")
  );

  // fetch that channel (to get tasks[])
  const channelsStatus = useAppSelector(selectChannelsStatus);
  useEffect(() => {
    if (defaultChannelId) dispatch(fetchChannelById(String(defaultChannelId)));
  }, [dispatch, defaultChannelId]);

  // read channel (and its tasks) from store
  const channel = useAppSelector(selectChannelById(defaultChannelId || "")) as
    | any
    | null;

  const rawTasks: any[] = Array.isArray(channel?.tasks) ? channel.tasks : [];

  const tasks: UiTask[] = useMemo(
    () =>
      rawTasks.map((t) => ({
        id: String(t?._id ?? t?.id),
        title: String(t?.name ?? t?.title ?? "Untitled task"),
        description: t?.description ?? null,
        status: fromApiStatus(t?.status) as UiTask["status"],
        channelCode: channel?.code ?? null,
        createdAt: (() => {
          const v = t?.createdAt;
          const n = typeof v === "string" ? Date.parse(v) : Number(v);
          return Number.isFinite(n) ? n : 0;
        })(),
      })),
    [rawTasks, channel?.code]
  );

  const latest = useMemo(
    () => [...tasks].sort((a, b) => b.createdAt - a.createdAt).slice(0, 3),
    [tasks]
  );

  const loading = channelsStatus === "loading" && !channel;
  const hydrated = !!channel && channelsStatus !== "loading";

  return (
    <View className="mt-6 rounded-2xl border border-gray-200 bg-white px-4 py-6">
      <Text className="text-3xl font-semibold text-black font-kumbh">
        Tasks
      </Text>

      {loading || latest.length === 0 ? (
        <View className="items-center justify-center py-6">
          <Image
            source={require("@/assets/images/task.png")}
            resizeMode="contain"
          />
          <Text className="mt-3 text-gray-500 font-kumbh">
            {loading
              ? "No tasks yet."
              : hydrated
                ? "No tasks yet."
                : "Loading tasks..."}
          </Text>
        </View>
      ) : (
        <FlatList
          className="mt-4"
          data={latest}
          keyExtractor={(i) => i.id}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          renderItem={({ item }) => (
            <View className="rounded-xl border border-gray-200 bg-white px-4 py-3">
              <Text className="font-kumbh text-[15px] text-[#111827]">
                {item.title}
              </Text>
              {!!item.description && (
                <Text
                  className="font-kumbh text-[13px] text-[#6B7280] mt-1"
                  numberOfLines={2}
                >
                  {item.description}
                </Text>
              )}
              <View className="flex-row mt-2" style={{ gap: 12 }}>
                <Text className="font-kumbh text-[12px] text-[#6B7280]">
                  Channel: {item.channelCode || "—"}
                </Text>
                <Text className="font-kumbh text-[12px] text-[#6B7280] capitalize">
                  {item.status.replace("_", " ")}
                </Text>
              </View>
            </View>
          )}
          ListFooterComponent={<View style={{ height: 6 }} />}
        />
      )}

      <Pressable
        className="mt-2 w-full rounded-xl py-4 items-center"
        style={{ backgroundColor: "#4C5FAB" }}
        onPress={() => router.push({ pathname: "/(staff)/(tabs)/tasks" })}
      >
        <Text className="text-white font-semibold font-kumbh">
          View All Tasks
        </Text>
      </Pressable>
    </View>
  );
}
