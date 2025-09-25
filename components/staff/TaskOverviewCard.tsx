import React, { useMemo } from "react";
import { Image, Pressable, Text, View, FlatList } from "react-native";
import { router } from "expo-router";
import { useTasks } from "@/features/staff/tasksStore";

export default function TasksOverviewCard() {
  const { tasks, hydrated } = useTasks();

  // show latest 3
  const latest = useMemo(
    () => [...tasks].sort((a, b) => b.createdAt - a.createdAt).slice(0, 3),
    [tasks]
  );

  return (
    <View className="mt-6 rounded-2xl border border-gray-200 bg-white px-4 py-6">
      <Text className="text-3xl font-semibold text-black font-kumbh">Tasks</Text>

      {(!hydrated || latest.length === 0) ? (
        <View className="items-center justify-center py-6">
          <Image
            source={require("@/assets/images/task.png")}
            resizeMode="contain"
          />
          <Text className="mt-3 text-gray-500 font-kumbh">
            {hydrated ? "No tasks yet." : "Loading tasks..."}
          </Text>
        </View>
      ) : (
        <FlatList
          className="mt-4"
          data={latest}
          keyExtractor={(i) => i.id}
          scrollEnabled={false}           // safe inside parent ScrollView
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          renderItem={({ item }) => (
            <View className="rounded-xl border border-gray-200 bg-white px-4 py-3">
              <Text className="font-kumbh text-[15px] text-[#111827]">{item.title}</Text>
              {!!item.description && (
                <Text className="font-kumbh text-[13px] text-[#6B7280] mt-1" numberOfLines={2}>
                  {item.description}
                </Text>
              )}
              <View className="flex-row mt-2" style={{ gap: 12 }}>
                <Text className="font-kumbh text-[12px] text-[#6B7280]">
                  Channel: {item.channelCode}
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
        onPress={() =>
          router.push({ pathname: "/(staff)/(tabs)/tasks" })
        }
      >
        <Text className="text-white font-semibold font-kumbh">View All Tasks</Text>
      </Pressable>
    </View>
  );
}
