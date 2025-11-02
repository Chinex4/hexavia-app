import { selectAdminUsers } from "@/redux/admin/admin.slice";
import { selectChannelsForUser } from "@/redux/channels/channels.slice";
import { fetchChannels, fetchChannelById } from "@/redux/channels/channels.thunks";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import TaskDetailModal from "@/components/staff/tasks/modals/TaskDetailModal";
import CreateTaskModal from "@/components/staff/tasks/modals/CreateTaskModal";
import type { Task } from "@/features/staff/types";
import { fromApiStatus } from "@/features/client/statusMap";

type ApiTask = {
  _id: string;
  name?: string;
  description?: string;
  status?: string;
  channelId?: string;
  channelCode?: string;
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
  const staffName = staff?.fullname || staff?.username || staff?.email || "Staff";

  // Channels this staff is in
  const channelsForUser = useAppSelector(selectChannelsForUser(String(staffId ?? "")));

  // Ensure each channel is hydrated with tasks (like your other screens)
  useEffect(() => {
    if (!channelsForUser?.length) return;
    channelsForUser.forEach((c: any) => {
      if (!Array.isArray(c?.tasks) || c.tasks.length === 0) {
        dispatch(fetchChannelById(String(c?._id ?? c?.id)));
      }
    });
  }, [dispatch, channelsForUser]);

  // Build UI task objects (with channelId + channelCode)
  const { todo, doing, done, canceled } = useMemo(() => {
    const all: (ApiTask & { ui: Task })[] = [];

    for (const ch of channelsForUser) {
      const chId = String(ch?._id ?? "");
      const chCode = String(ch?.code ?? ch?.name ?? "");
      const list = Array.isArray((ch as any)?.tasks) ? (ch as any).tasks : [];

      for (const t of list) {
        const rawStatus = (t.status ?? t.state ?? "").toString().toLowerCase();
        const uiStatus = fromApiStatus(rawStatus);

        const api: ApiTask = {
          _id: String(t._id ?? t.id),
          name: t.name ?? t.title ?? "(Untitled Task)",
          description: t.description ?? "",
          status: rawStatus,
          channelId: chId,
          channelCode: chCode,
        };

        const ui: Task = {
          id: api._id,
          title: api.name || "(Untitled Task)",
          description: api.description || "",
          status: uiStatus,
          channelCode: chCode,
          channelId: chId,
          createdAt:
            typeof t?.createdAt === "number"
              ? t.createdAt
              : t?.createdAt
              ? new Date(t.createdAt).getTime()
              : Date.now(),
        };

        all.push({ ...api, ui });
      }
    }

    const bucket = {
      todo: [] as (ApiTask & { ui: Task })[],
      doing: [] as (ApiTask & { ui: Task })[],
      done: [] as (ApiTask & { ui: Task })[],
      canceled: [] as (ApiTask & { ui: Task })[],
    };

    for (const t of all) {
      const s = (t.status || "").toLowerCase();
      if (["done", "completed", "resolved"].includes(s)) bucket.done.push(t);
      else if (["canceled", "cancelled", "archived"].includes(s)) bucket.canceled.push(t);
      else if (["doing", "in-progress", "progress", "active", "working"].includes(s)) bucket.doing.push(t);
      else bucket.todo.push(t);
    }

    return bucket;
  }, [channelsForUser]);

  // Edit modal state
  const [edit, setEdit] = useState<Task | null>(null);

  // Create-personal-for-this-staff modal
  const [showCreate, setShowCreate] = useState(false);

  const openEdit = useCallback((t: ApiTask & { ui: Task }) => setEdit(t.ui), []);
  const closeEdit = useCallback(() => setEdit(null), []);

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="px-5 pt-6 pb-4 flex-row items-center justify-between gap-4">
        <Pressable onPress={() => router.back()} className="w-10 h-10 items-center justify-center">
          <ArrowLeft size={24} color="#111827" />
        </Pressable>
        <Text className="text-2xl font-kumbh text-[#111827]">{staffName}: Task Board</Text>
        <View className="w-10" />
      </View>

      {/* Board */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 12, paddingBottom: 24 }}
      >
        <Column title="Not Started" items={todo} onOpen={openEdit} />
        <Column title="In Progress" items={doing} onOpen={openEdit} />
        <Column title="Completed" items={done} onOpen={openEdit} />
        <Column title="Canceled" items={canceled} onOpen={openEdit} />
      </ScrollView>

      {/* Floating Create button (admin -> personal task for this staff) */}
      <Pressable
        onPress={() => setShowCreate(true)}
        className="absolute right-5 bottom-6 rounded-full"
        style={{ backgroundColor: "#4C5FAB", paddingHorizontal: 18, paddingVertical: 12, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 5 }}
      >
        <Text className="text-white font-kumbhBold">New Personal Task</Text>
      </Pressable>

      {/* Modals */}
      {edit && (
        <TaskDetailModal visible={!!edit} onClose={closeEdit} task={edit} />
      )}

      <CreateTaskModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        forcePersonalForUserId={String(staffId)} // lock to this staff's personal tasks
        hideModeToggle
      />
    </SafeAreaView>
  );
}

function Column({
  title,
  items,
  onOpen,
}: {
  title: string;
  items: (ApiTask & { ui: Task })[];
  onOpen: (t: ApiTask & { ui: Task }) => void;
}) {
  return (
    <View className="w-72 rounded-2xl p-4" style={{ backgroundColor: "#FFFFFF", shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 3 }}>
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-base font-kumbhBold text-[#111827]">{title}</Text>
        <View className="px-2 py-[2px] rounded-full" style={{ backgroundColor: "#EEF2FF" }}>
          <Text className="text-[11px] font-kumbh" style={{ color: "#3730A3" }}>{items.length}</Text>
        </View>
      </View>

      {items.map((t) => (
        <Pressable
          key={t._id}
          onPress={() => onOpen(t)}
          className="mb-3 rounded-xl"
          style={{ backgroundColor: "#F8FAFC", padding: 12 }}
        >
          <View className="flex-row items-center justify-between">
            <Text className="font-kumbh text-[#111827]" numberOfLines={1}>
              {t.name || "(Untitled Task)"}
            </Text>
            <Text
              className="font-kumbh text-[10px] px-2 py-[2px] rounded-full"
              style={{
                backgroundColor: chipBg(t.status),
                color: chipFg(t.status),
              }}
            >
              {humanStatus(t.status)}
            </Text>
          </View>

          {t.description ? (
            <Text className="mt-1 text-xs text-gray-600 font-kumbh" numberOfLines={2}>
              {t.description}
            </Text>
          ) : null}

          {t.channelCode ? (
            <Text className="mt-2 text-[11px] font-kumbh" style={{ color: "#6B7280" }}>
              {t.channelCode}
            </Text>
          ) : null}
        </Pressable>
      ))}

      {items.length === 0 && (
        <Text className="text-gray-500 font-kumbh">No tasks</Text>
      )}
    </View>
  );
}

function humanStatus(s?: string) {
  const v = (s || "").toLowerCase();
  if (["done", "completed", "resolved"].includes(v)) return "Completed";
  if (["canceled", "cancelled", "archived"].includes(v)) return "Canceled";
  if (["doing", "in-progress", "progress", "active", "working"].includes(v)) return "In progress";
  return "Not started";
}

function chipBg(s?: string) {
  const v = (s || "").toLowerCase();
  if (["done", "completed", "resolved"].includes(v)) return "#ECFDF5";
  if (["canceled", "cancelled", "archived"].includes(v)) return "#FEF2F2";
  if (["doing", "in-progress", "progress", "active", "working"].includes(v)) return "#EFF6FF";
  return "#F3F4F6";
}

function chipFg(s?: string) {
  const v = (s || "").toLowerCase();
  if (["done", "completed", "resolved"].includes(v)) return "#065F46";
  if (["canceled", "cancelled", "archived"].includes(v)) return "#991B1B";
  if (["doing", "in-progress", "progress", "active", "working"].includes(v)) return "#1E40AF";
  return "#374151";
}
