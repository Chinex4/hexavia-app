// app/(staff)/(tabs)/channels/index.tsx (or your path)
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { View, FlatList, Text, Platform, RefreshControl } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useDispatch, useSelector } from "react-redux";

import BackHeader from "@/components/BackHeader";
import SearchBar from "@/components/SearchBar";
import ChannelCard from "@/components/staff/channels/ChannelCard";
import FilterModal, { Filters } from "@/components/FIlterModal";
import useDebounced from "@/hooks/useDebounced";
import { StatusBar } from "expo-status-bar";

import type { RootState, AppDispatch } from "@/store";
import { fetchChannels } from "@/redux/channels/channels.thunks";

// ---- stable “random” color picker (same channel => same color) ----
const PALETTE = ["#37CC86", "#48A7FF", "#F6A94A", "#29C57A", "#4C5FAB", "#9B7BF3"];
const colorFor = (key: string) => {
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
};

const INACTIVE = "#9CA3AF";

export default function AllChannelsScreen() {
  const dispatch = useDispatch<AppDispatch>();

  // ---- fetch on mount / pull-to-refresh ----
  const status = useSelector((s: RootState) => s.channels.status);
  const allIds = useSelector((s: RootState) => s.channels.allIds);
  const byId = useSelector((s: RootState) => s.channels.byId);
  const channels = useMemo(() => allIds.map((id) => byId[id]), [allIds, byId]);

  useEffect(() => {
    if (status === "idle") dispatch(fetchChannels());
  }, [status, dispatch]);

  const onRefresh = useCallback(() => {
    dispatch(fetchChannels());
  }, [dispatch]);

  // ---- search + filters (works on server data) ----
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounced(query, 250);

  const [filters, setFilters] = useState<Filters>({
    department: "All",
    unreadOnly: false,
    sortBy: "name",
  });
  const [filterOpen, setFilterOpen] = useState(false);

  const data = useMemo(() => {
    let list = channels.slice();
    const q = debouncedQuery.trim().toLowerCase();

    if (q) {
      list = list.filter((c) =>
        [
          c?.name ?? "",
          c?.description ?? "",
          (c as any)?.department ?? "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    }

    if (filters.department !== "All") {
      list = list.filter((c: any) => c?.department === filters.department);
    }

    if (filters.unreadOnly) {
      list = list.filter((c: any) => !!c?.unread);
    }

    if (filters.sortBy === "name") {
      list.sort((a, b) => (a?.name ?? "").localeCompare(b?.name ?? ""));
    } else if (filters.sortBy === "members") {
      list.sort(
        (a: any, b: any) => (b?.membersCount ?? 0) - (a?.membersCount ?? 0)
      );
    }

    return list;
  }, [channels, debouncedQuery, filters]);

  const viewStyle = {
    flex: 1,
    marginTop: Platform.select({ ios: 60, android: 40 }),
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />
      <View style={viewStyle}>
        <BackHeader title="All Channels" />
        <SearchBar
          value={query}
          onChange={setQuery}
          onOpenFilter={() => setFilterOpen(true)}
        />

        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ChannelCard
              item={item}
              // prefer backend color if present, else stable-picked color
              colorOverride={(item as any)?.color || colorFor(item.id || item.code || item.name)}
            />
          )}
          contentContainerStyle={{ paddingBottom: 24, paddingTop: 12 }}
          refreshControl={
            <RefreshControl refreshing={status === "loading"} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View className="items-center mt-24">
              <Ionicons name="chatbubbles-outline" size={28} color={INACTIVE} />
              <Text className="mt-2 text-gray-500 font-kumbh">
                {status === "loading" ? "Loading channels…" : "No channels found"}
              </Text>
            </View>
          }
        />

        <FilterModal
          visible={filterOpen}
          onClose={() => setFilterOpen(false)}
          value={filters}
          onChange={setFilters}
        />
      </View>
    </View>
  );
}
