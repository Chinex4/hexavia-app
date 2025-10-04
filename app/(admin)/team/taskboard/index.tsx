// app/(admin)/team/taskboard/index.tsx
import React, { useMemo } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useAppSelector } from "@/store/hooks";
import { selectAllChannels } from "@/redux/channels/channels.slice";
import { selectAdminUsers } from "@/redux/admin/admin.slice";

type TaskLike = any; // from server

export default function TaskBoard() {
  const router = useRouter();
  const { staffId } = useLocalSearchParams<{ staffId?: string }>();

  const channels = useAppSelector(selectAllChannels);
  const users = useAppSelector(selectAdminUsers);
  const staff = users.find((u) => u._id === staffId);

  const { todo, doing, done } = useMemo(() => {
    const tasks: TaskLike[] = [];
    for (const ch of channels) {
      const list = Array.isArray(ch?.tasks) ? ch.tasks : [];
      for (const t of list) {
        if (isAssignedTo(t, staffId)) tasks.push(t);
      }
    }
    // naive status grouping
    const bucket = {
      todo: [] as TaskLike[],
      doing: [] as TaskLike[],
      done: [] as TaskLike[],
    };
    for (const t of tasks) {
      const s = (t.status || t.state || "").toString().toLowerCase();
      if (["todo", "backlog", "pending"].includes(s)) bucket.todo.push(t);
      else if (["doing", "in_progress", "in-progress", "progress"].includes(s))
        bucket.doing.push(t);
      else if (["done", "completed", "resolved"].includes(s))
        bucket.done.push(t);
      else bucket.todo.push(t);
    }
    return bucket;
  }, [channels, staffId]);

  const staffName =
    staff?.fullname || staff?.username || staff?.email || "Staff";

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-5 pt-6 pb-4 flex-row items-center gap-4">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center"
        >
          <ArrowLeft size={24} color="#111827" />
        </Pressable>
        <Text className="text-3xl font-kumbhBold text-text">
          {staffName} — Task Board
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
      >
        <Column title="To Do" items={todo} />
        <Column title="In Progress" items={doing} />
        <Column title="Done" items={done} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Column({ title, items }: { title: string; items: any[] }) {
  return (
    <View className="w-72 bg-white rounded-2xl p-4">
      <Text className="text-base font-kumbhBold text-text mb-3">{title}</Text>
      {items.map((t, i) => (
        <View key={t._id ?? i} className="mb-3 rounded-xl bg-gray-100 p-3">
          <Text className="font-kumbh text-text">
            {t.title || t.name || "(Untitled Task)"}
          </Text>
        </View>
      ))}
      {items.length === 0 && (
        <Text className="text-gray-500 font-kumbh">No tasks</Text>
      )}
    </View>
  );
}
function isAssignedTo(task: any, staffId?: string) {
  if (!staffId) return false;
  if (task?.assigneeId === staffId) return true;
  if (task?.assignee?._id === staffId) return true;
  if (
    Array.isArray(task?.assignees) &&
    task.assignees.some((x: any) => x === staffId || x?._id === staffId)
  )
    return true;
  return false;
}
