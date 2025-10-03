import React, { useMemo } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";

type Task = { id: string; title: string };

export default function TaskBoard() {
  const router = useRouter();
  const { staffId } = useLocalSearchParams<{ staffId?: string }>();

  // dummy tasks
  const todo: Task[] = useMemo(
    () => [
      { id: "t1", title: "Draft proposal" },
      { id: "t2", title: "Prepare brief" },
    ],
    []
  );
  const doing: Task[] = useMemo(
    () => [
      { id: "t3", title: "UI Screens" },
      { id: "t4", title: "Client follow-up" },
    ],
    []
  );
  const done: Task[] = useMemo(() => [{ id: "t5", title: "Onboarding" }], []);

  const staffName =
    staffId === "s2" ? "Staff II" : staffId === "s3" ? "Staff III" : "Staff I";

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

      {/* Simple horizontal columns */}
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

function Column({
  title,
  items,
}: {
  title: string;
  items: { id: string; title: string }[];
}) {
  return (
    <View className="w-72 bg-white rounded-2xl p-4">
      <Text className="text-base font-kumbhBold text-text mb-3">{title}</Text>
      {items.map((t) => (
        <View key={t.id} className="mb-3 rounded-xl bg-gray-100 p-3">
          <Text className="font-kumbh text-text">{t.title}</Text>
        </View>
      ))}
      {items.length === 0 && (
        <Text className="text-gray-500 font-kumbh">No tasks</Text>
      )}
    </View>
  );
}
