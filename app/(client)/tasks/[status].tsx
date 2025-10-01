import { useTasks } from "@/features/staff/tasksStore";
import { STATUS_META, StatusKey } from "@/features/staff/types";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router, Stack, useLocalSearchParams } from "expo-router";
import React, { useMemo } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import TaskCard from "../../../components/staff/tasks/TaskCard";
import { StatusBar } from "expo-status-bar";

export default function StatusScreen() {
  const params = useLocalSearchParams<{ status: StatusKey }>();
  const status = (params.status || "in_progress") as StatusKey;
  const { tasks } = useTasks();
  const list = useMemo(
    () => tasks.filter((t) => t.status === status),
    [tasks, status]
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />

      {/* Custom header */}
      <View className="flex-row items-center px-4 pt-2 pb-3 mt-5">
        <Pressable
          onPress={() => router.push('/(staff)/(tabs)/tasks')}
          className="h-9 w-9 rounded-full items-center justify-center"
        >
          <Ionicons name="chevron-back" size={22} color="#111827" />
          
        </Pressable>
        <Text className="font-kumbhBold text-[22px] ml-3 text-[#111827]">
          {STATUS_META[status].title} Tasks
        </Text>
      </View>

      <FlatList
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        data={list}
        keyExtractor={(i) => i.id}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item }) => <TaskCard task={item} openDetail />}
        ListEmptyComponent={
          <View className="px-4">
            <Text className="font-kumbh text-[#9CA3AF]">
              No tasks in this category yet.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
