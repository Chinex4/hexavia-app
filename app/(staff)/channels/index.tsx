import React, { useState, useMemo } from "react";
import { View, FlatList, Text, Platform } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import BackHeader from "@/components/BackHeader";
import SearchBar from "@/components/SearchBar";
import ChannelCard from "@/components/staff/channels/ChannelCard";
import FilterModal, { Filters } from "@/components/FIlterModal";
import useDebounced from "@/hooks/useDebounced";
import { CHANNELS } from "../../../constants/channelsData";
import { StatusBar } from "expo-status-bar";

const INACTIVE = "#9CA3AF";

export default function AllChannelsScreen() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounced(query, 250);

  const [filters, setFilters] = useState<Filters>({
    department: "All",
    unreadOnly: false,
    sortBy: "name",
  });
  const [filterOpen, setFilterOpen] = useState(false);

  const data = useMemo(() => {
    let list = CHANNELS.slice();
    const q = debouncedQuery.trim().toLowerCase();

    if (q) {
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.department.toLowerCase().includes(q)
      );
    }
    if (filters.department !== "All") {
      list = list.filter((c) => c.department === filters.department);
    }
    if (filters.unreadOnly) {
      list = list.filter((c) => c.unread);
    }
    if (filters.sortBy === "name") {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (filters.sortBy === "members") {
      list.sort((a, b) => b.membersCount - a.membersCount);
    }
    return list;
  }, [debouncedQuery, filters]);

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
          renderItem={({ item }) => <ChannelCard item={item} />}
          contentContainerStyle={{ paddingBottom: 24, paddingTop: 12 }}
          ListEmptyComponent={
            <View className="items-center mt-24">
              <Ionicons name="chatbubbles-outline" size={28} color={INACTIVE} />
              <Text className="mt-2 text-gray-500 font-kumbh">
                No channels found
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
