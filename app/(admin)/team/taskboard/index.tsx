import React, { useEffect, useMemo } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectAdminUsers } from "@/redux/admin/admin.slice";
import { fetchChannels } from "@/redux/channels/channels.thunks";
import { selectChannelsForUser } from "@/redux/channels/channels.slice";

type ApiTask = {
  _id: string;
  name?: string;
  description?: string;
  status?: string;
};

export default function TaskBoard() {
  const router = useRouter();
  const { staffId } = useLocalSearchParams<{ staffId?: string }>();
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(fetchChannels());
  }, [dispatch]);

  const users = useAppSelector(selectAdminUsers);
  const staff = users.find((u) => u._id === staffId);
  const staffName =
    staff?.fullname || staff?.username || staff?.email || "Staff";

  const channelsForUser = useAppSelector(
    selectChannelsForUser(String(staffId ?? ""))
  );

  const { todo, doing, done, canceled } = useMemo(() => {
    const all: ApiTask[] = [];
    for (const ch of channelsForUser) {
      const list = Array.isArray((ch as any)?.tasks) ? (ch as any).tasks : [];
      for (const t of list) {
        all.push({
          _id: String(t._id ?? t.id),
          name: t.name ?? t.title ?? "(Untitled Task)",
          description: t.description ?? "",
          status: (t.status ?? t.state ?? "").toString().toLowerCase(),
        });
      }
    }

    const bucket = {
      todo: [] as ApiTask[],
      doing: [] as ApiTask[],
      done: [] as ApiTask[],
      canceled: [] as ApiTask[],
    };

    for (const t of all) {
      const s = t.status || "";
      if (["done", "completed", "resolved"].includes(s)) bucket.done.push(t);
      else if (["canceled", "cancelled", "archived"].includes(s))
        bucket.canceled.push(t);
      else if (
        [
          "doing",
          "in_progress",
          "in-progress",
          "progress",
          "active",
          "working",
        ].includes(s)
      )
        bucket.doing.push(t);
      else bucket.todo.push(t); // default/fallback (todo, pending, new, etc)
    }

    return bucket;
  }, [channelsForUser]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-5 pt-6 pb-4 flex-row items-center justify-between gap-4">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center"
        >
          <ArrowLeft size={24} color="#111827" />
        </Pressable>
        <Text className="text-2xl font-kumbh text-text">
          {staffName}: Task Board
        </Text>
        <View className="w-10" />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
      >
        <Column title="Not Started" items={todo} />
        <Column title="In Progress" items={doing} />
        <Column title="Completed" items={done} />
        <Column title="Canceled" items={canceled} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Column({ title, items }: { title: string; items: ApiTask[] }) {
  return (
    <View className="w-72 bg-white rounded-2xl p-4">
      <Text className="text-base font-kumbhBold text-text mb-3">{title}</Text>
      {items.map((t) => (
        <View key={t._id} className="mb-3 rounded-xl bg-gray-100 p-3">
          <Text className="font-kumbh text-text">
            {t.name || "(Untitled Task)"}
          </Text>
          {t.description ? (
            <Text className="mt-1 text-xs text-gray-600 font-kumbh">
              {t.description}
            </Text>
          ) : null}
        </View>
      ))}
      {items.length === 0 && (
        <Text className="text-gray-500 font-kumbh">No tasks</Text>
      )}
    </View>
  );
}
