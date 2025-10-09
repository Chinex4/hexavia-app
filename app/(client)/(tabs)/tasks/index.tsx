import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectUser } from "@/redux/user/user.slice";
import { fetchProfile } from "@/redux/user/user.thunks";

import { fetchChannelById } from "@/redux/channels/channels.thunks";
import { makeSelectChannelById, selectStatus as selectChannelsStatus } from "@/redux/channels/channels.selectors";
import { makeSelectDefaultChannelId } from "@/redux/channels/channels.selectors";

import { STATUS_META, StatusKey } from "@/features/staff/types";
// UI
import FabCreate from "@/components/staff/tasks/FabCreate";
import SearchBar from "@/components/staff/tasks/SearchBar";
import StatusCard from "@/components/client/tasks/StatusCard";
import StatusTabs from "@/components/staff/tasks/StatusTabs";
import TaskCard from "@/components/staff/tasks/TaskCard";
import CreateTaskModal from "@/components/staff/tasks/modals/CreateTaskModal";
import FilterModal, { FilterState } from "@/components/staff/tasks/modals/FIlterModal";

const PRIMARY = "#4C5FAB";

/** Normalize backend → UI statuses */
function fromApiStatus(s: string | null | undefined): StatusKey {
  const v = (s ?? "").toLowerCase().replace(/_/g, "-");
  if (v === "in-progress") return "in_progress";
  if (v === "not-started" || v === "pending" || v === "todo") return "not_started";
  if (v === "completed" || v === "done") return "completed";
  if (v === "canceled" || v === "cancelled") return "canceled";
  // sensible fallback
  return "in_progress";
}

type UiTask = {
  id: string;
  title: string;
  description?: string | null;
  status: StatusKey;
  channelCode?: string | null;
  assigneeName?: string | null;
  dueDate?: string | null;
};

export default function TaskScreen() {
  const dispatch = useAppDispatch();

  // Ensure we have the user -> we need their id to pick a default channel
  const user = useAppSelector(selectUser);
  useEffect(() => {
    if (!user?._id) dispatch(fetchProfile());
  }, [dispatch, user?._id]);

  const userId = user?._id ?? null;

  // Choose a default channel for this user (strategy: most recent)
  const defaultChannelId = useAppSelector(
    makeSelectDefaultChannelId(userId, "recent")
  );

  // Fetch that channel (to get tasks array)
  const channelsStatus = useAppSelector(selectChannelsStatus);
  useEffect(() => {
    if (defaultChannelId) {
      dispatch(fetchChannelById(String(defaultChannelId)));
    }
  }, [dispatch, defaultChannelId]);

  // Read the channel (and its tasks) from the store
  const selectThisChannel = useMemo(
    () => (id?: string | null) => (id ? makeSelectChannelById(id) : () => null),
    []
  );
  const channel = useAppSelector(
    selectThisChannel(defaultChannelId)
  ) as any | null;

  const channelCode: string | undefined = channel?.code;
  const rawTasks: any[] = Array.isArray(channel?.tasks) ? channel.tasks : [];

  // Local UI state (search, filters, active tab)
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<StatusKey>("in_progress");
  const [showCreate, setShowCreate] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    channelCode: "", // we’ll prefill it to the default channel once we know it
    statuses: [],
  });

  // Prefill filter.channelCode with the default channel code (once available)
  useEffect(() => {
    if (channelCode && !filters.channelCode) {
      setFilters((f) => ({ ...f, channelCode }));
    }
  }, [channelCode]);

  // Adapt backend task objects → UI Task shape
  const allUiTasks: UiTask[] = useMemo(() => {
    return rawTasks.map((t) => ({
      id: String(t?._id ?? t?.id ?? crypto.randomUUID()),
      title: String(t?.name ?? t?.title ?? "Untitled task"),
      description: t?.description ?? null,
      status: fromApiStatus(t?.status),
      channelCode: channelCode ?? null,
      assigneeName:
        t?.assignee?.fullname ??
        t?.assignee?.name ??
        t?.assigneeName ??
        null,
      dueDate: t?.dueDate ?? null,
    }));
  }, [rawTasks, channelCode]);

  // Filter + tab
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allUiTasks
      .filter((t) =>
        filters.statuses.length ? filters.statuses.includes(t.status) : true
      )
      .filter((t) =>
        filters.channelCode ? t.channelCode === filters.channelCode : true
      )
      .filter((t) =>
        q
          ? t.title.toLowerCase().includes(q) ||
            (t.description || "").toLowerCase().includes(q)
          : true
      )
      .filter((t) => t.status === active);
  }, [allUiTasks, active, query, filters]);

  const Header = (
    <>
      <SearchBar
        value={query}
        onChangeText={setQuery}
        onFilterPress={() => setShowFilter(true)}
      />

      {/* Status cards grid */}
      <View className="px-4 mt-6">
        <View className="flex-row" style={{ gap: 8 }}>
          <View style={{ flex: 1, gap: 8 }}>
            <StatusCard status="in_progress" />
            <StatusCard status="completed" />
          </View>
          <View style={{ flex: 1, gap: 8 }}>
            <StatusCard status="not_started" />
            <StatusCard status="canceled" />
          </View>
        </View>
      </View>

      <StatusTabs active={active} onChange={setActive} />

      <View className="px-5 mt-6">
        <View className="rounded-2xl border border-[#E5E7EB] p-5">
          <Text className="font-kumbh text-[#6B7280]">
            Channel:{" "}
            <Text className="text-[#111827]">
              {channel?.name ?? "—"} {channelCode ? `(${channelCode.toUpperCase()})` : ""}
            </Text>
          </Text>
          <Text className="font-kumbh text-[#6B7280] mt-1">
            Showing tasks:{" "}
            <Text className="text-[#111827]">
              {STATUS_META[active].title}
            </Text>
          </Text>
        </View>
      </View>
    </>
  );

  const isLoadingChannel =
    channelsStatus === "loading" && !channel; // first load

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />

      {isLoadingChannel ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="small" color={PRIMARY} />
          <Text className="mt-2 text-[#6B7280] font-kumbh">
            Loading channel tasks…
          </Text>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={{ paddingBottom: 140 }}
          data={filtered}
          keyExtractor={(i) => i.id}
          ListHeaderComponent={Header}
          renderItem={({ item }) => (
            <View className="px-5 mt-3">
              <TaskCard task={item as any} />
            </View>
          )}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          ListEmptyComponent={
            <View className="px-5 mt-3">
              <Text className="font-kumbh text-[#9CA3AF]">
                No tasks yet in this category.
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      <FabCreate onPress={() => {/* optional: open create modal scoped to this channel */}} />

      {/* Modals */}
      <CreateTaskModal
        visible={false /* hook up when ready */}
        onClose={() => {}}
      />
      <FilterModal
        visible={false /* showFilter */}
        initial={filters}
        onClose={() => setShowFilter(false)}
        onApply={(f) => {
          setFilters(f);
          setShowFilter(false);
        }}
      />
    </SafeAreaView>
  );
}
