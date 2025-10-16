// app/(staff)/(tabs)/tasks/index.tsx
import FabCreate from "@/components/staff/tasks/FabCreate";
import SearchBar from "@/components/staff/tasks/SearchBar";
import StatusCard from "@/components/staff/tasks/StatusCard";
import StatusTabs from "@/components/staff/tasks/StatusTabs";
import TaskCard from "@/components/staff/tasks/TaskCard";
import CreateTaskModal from "@/components/staff/tasks/modals/CreateTaskModal";
import FilterModal, { FilterState } from "@/components/staff/tasks/modals/FIlterModal";
import { useTasks } from "@/features/staff/tasksStore";
import { STATUS_META, StatusKey } from "@/features/staff/types";
import { StatusBar } from "expo-status-bar";
import React, { useMemo, useState } from "react";
import { FlatList, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TaskScreen() {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<StatusKey>("in-progress");
  const [showCreate, setShowCreate] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState<FilterState>({ channelCode: "", statuses: [] });

  const { tasks } = useTasks();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tasks
      .filter((t) => (filters.statuses.length ? filters.statuses.includes(t.status) : true))
      .filter((t) => (filters.channelCode ? t.channelCode === filters.channelCode : true))
      .filter((t) =>
        q ? t.title.toLowerCase().includes(q) || (t.description || "").toLowerCase().includes(q) : true
      )
      .filter((t) => t.status === active);
  }, [tasks, active, query, filters]);

  const Header = (
    <>
      <SearchBar value={query} onChangeText={setQuery} onFilterPress={() => setShowFilter(true)} />

      {/* Status cards grid */}
      <View className="px-4 mt-6">
        <View className="flex-row" style={{ gap: 8 }}>
          <View style={{ flex: 1, gap: 8 }}>
            <StatusCard status="in-progress" />
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
            Showing tasks: <Text className="text-[#111827]">{STATUS_META[active].title}</Text>
          </Text>
        </View>
      </View>
    </>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <FlatList
        contentContainerStyle={{ paddingBottom: 140 }}
        data={filtered}
        keyExtractor={(i) => i.id}
        ListHeaderComponent={Header}
        renderItem={({ item }) => (
          <View className="px-5 mt-3">
            <TaskCard task={item} />
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={
          <View className="px-5 mt-3">
            <Text className="font-kumbh text-[#9CA3AF]">No tasks yet in this category.</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />

      <FabCreate onPress={() => setShowCreate(true)} />

      {/* Modals */}
      <CreateTaskModal visible={showCreate} onClose={() => setShowCreate(false)} />
      <FilterModal
        visible={showFilter}
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
