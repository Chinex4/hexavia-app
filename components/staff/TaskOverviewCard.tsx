import { router } from "expo-router";
import React, { useEffect, useMemo } from "react";
import { FlatList, Image, Pressable, Text, View } from "react-native";

import { selectAllPersonalTasks, selectPersonalTasksStatus } from "@/redux/personalTasks/personalTasks.selectors";
import { fetchPersonalTasks } from "@/redux/personalTasks/personalTasks.thunks";
import { selectUser } from "@/redux/user/user.slice";
import { fetchProfile } from "@/redux/user/user.thunks";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

type UiTask = {
  id: string;
  title: string;
  description?: string | null;
  status: "in-progress" | "not-started" | "completed" | "canceled";
  channelCode?: string | null;
  createdAt: number;
};

const fromApiStatus = (s?: string | null) => {
  const v = (s ?? "").toLowerCase().replace(/_/g, "-");
  if (v === "in-progress") return "in-progress";
  if (v === "not-started" || v === "pending" || v === "todo")
    return "not-started";
  if (v === "completed" || v === "done") return "completed";
  if (v === "canceled" || v === "cancelled") return "canceled";
  return "in-progress";
};

export default function TasksOverviewCard() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const personalTasks = useAppSelector(selectAllPersonalTasks);
  const personalStatus = useAppSelector(selectPersonalTasksStatus);

  useEffect(() => {
    dispatch(fetchProfile());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchPersonalTasks());
  }, [dispatch]);

  const tasks: UiTask[] = useMemo(
    () =>
      personalTasks
        .map((t) => ({
          id: t.id,
          title: t.title,
          description: t.description ?? null,
          status: fromApiStatus(t.status) as UiTask["status"],
          channelCode: "personal",
          createdAt:
            typeof t.createdAt === "number"
              ? t.createdAt
              : t.createdAt
                ? new Date(t.createdAt).getTime()
                : 0,
        }))
        .sort((a, b) => b.createdAt - a.createdAt),
    [personalTasks]
  );

  const latest = tasks.slice(0, 3);
  const loading = personalStatus === "loading" && latest.length === 0;

  const viewAllTasksPath =
    user?.role === "staff" ? "/(staff)/(tabs)/tasks" : "/(client)/(tabs)/tasks";

  return (
    <View className="mt-6 rounded-2xl border border-gray-200 bg-white px-4 py-6">
      <Text className="text-3xl font-semibold text-black font-kumbh">Tasks</Text>

      {loading ? (
        <View className="items-center justify-center py-6">
          <Image
            source={require("@/assets/images/task.png")}
            resizeMode="contain"
          />
          <Text className="mt-3 text-gray-500 font-kumbh">Loading personal tasks…</Text>
        </View>
      ) : latest.length === 0 ? (
        <View className="items-center justify-center py-6">
          <Image
            source={require("@/assets/images/task.png")}
            resizeMode="contain"
          />
          <Text className="mt-3 text-gray-500 font-kumbh">No personal tasks yet.</Text>
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
                  Type: Personal
                </Text>
                <Text className="font-kumbh text-[12px] text-[#6B7280]">
                  Status: {item.status.replace("_", " ")}
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
        onPress={() => router.push({ pathname: viewAllTasksPath })}
      >
        <Text className="text-white font-semibold font-kumbh">View All Tasks</Text>
      </Pressable>
    </View>
  );
}
