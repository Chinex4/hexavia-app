import React, { useEffect, useMemo, useState, useCallback } from "react";
import { View, FlatList, Text, Platform, RefreshControl } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useDispatch, useSelector } from "react-redux";

import BackHeader from "@/components/BackHeader";
import SearchBar from "@/components/SearchBar";
import ChannelCard from "@/components/staff/channels/ChannelCard";
import JoinableChannelCard from "@/components/staff/channels/JoinableChannelCard"; // NEW
import FilterModal, { Filters } from "@/components/FIlterModal";
import useDebounced from "@/hooks/useDebounced";
import { StatusBar } from "expo-status-bar";

import type { RootState, AppDispatch } from "@/store";
import { fetchChannels } from "@/redux/channels/channels.thunks";
import {
  selectMyChannelsByUserId,
  selectAllChannels,
} from "@/redux/channels/channels.selectors"; // NOTE: bring selectAllChannels
import { useAppSelector } from "@/store/hooks";
import { selectUser } from "@/redux/user/user.slice";
import { fetchProfile } from "@/redux/user/user.thunks";

const PALETTE = [
  // "#37CC86",
  // "#48A7FF",
  // "#F6A94A",
  // "#29C57A",
  // "#4C5FAB",
  // "#9B7BF3",
  "#4c5fab"
];
const colorFor = (key: string) => {
  let hash = 0;
  for (let i = 0; i < key.length; i++)
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
};
const INACTIVE = "#9CA3AF";
const makeKey = (c: any) => String(c?.id ?? c?._id ?? c?.code ?? c?.name ?? "");

// --- helpers to normalize “codes” (accept #, spaces, dashes, case-insensitive)
const normalizeCodeLoose = (s: string) =>
  s
    .trim()
    .replace(/^#/, "")
    .replace(/[\s-]+/g, "")
    .toLowerCase();

export default function AllChannelsScreen() {
  const dispatch = useDispatch<AppDispatch>();

  const status = useSelector((s: RootState) => s.channels.status);
  const user = useAppSelector(selectUser);

  useEffect(() => {
    dispatch(fetchProfile());
  }, [dispatch]);

  const userId = user?._id ?? null;

  // My channels (existing list)
  const myChannels = useAppSelector((s) => selectMyChannelsByUserId(s, userId));

  // All channels (for the code-based search)
  const allChannels = useAppSelector(selectAllChannels);
  // console.log(allChannels)

  useEffect(() => {
    if (status === "idle") dispatch(fetchChannels());
  }, [status, dispatch]);

  const onRefresh = useCallback(() => {
    dispatch(fetchChannels());
  }, [dispatch]);

  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounced(query, 250);

  const [filters, setFilters] = useState<Filters>({
    department: "All",
    unreadOnly: false,
    sortBy: "name",
  });
  const [filterOpen, setFilterOpen] = useState(false);

  // ----- code lookup across ALL channels (not just mine)
  const codeMatch = useMemo(() => {
    const q = normalizeCodeLoose(debouncedQuery);
    if (!q) return null;

    // Find by any plausible code field
    const found = allChannels.find((c: any) => {
      const codeCandidates = [c?.code].filter(Boolean) as string[];
      return codeCandidates.some((cc) => normalizeCodeLoose(cc) === q);
    });

    return found ?? null;
  }, [allChannels, debouncedQuery]);

  const alreadyMember = useMemo(() => {
    if (!codeMatch || !userId) return false;
    const myIds = new Set(myChannels.map((c: any) => String(c?._id ?? c?.id)));
    const targetId = String((codeMatch as any)?._id ?? (codeMatch as any)?.id);
    return myIds.has(targetId);
  }, [codeMatch, myChannels, userId]);

  // ------- existing data list (for MY channels), still searchable by name
  const data = useMemo(() => {
    const keyed = myChannels
      .filter(Boolean)
      .map((c) => ({ ...c, __key: makeKey(c) }))
      .filter((c) => c.__key.length > 0);

    const seen = new Set<string>();
    const deduped: any[] = [];
    for (const c of keyed) {
      if (!seen.has(c.__key)) {
        seen.add(c.__key);
        deduped.push(c);
      }
    }

    let list = deduped.slice();
    const q = debouncedQuery.trim().toLowerCase();

    // keep existing behavior: name/desc/department search for MY list
    if (q) {
      list = list.filter((c) =>
        [c?.name ?? "", c?.description ?? "", (c as any)?.department ?? ""]
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
  }, [myChannels, debouncedQuery, filters]);

  const viewStyle = {
    flex: 1,
    marginTop: Platform.select({ ios: 60, android: 40 }),
  };

  // click handler for the join button (temporary: just log)
  const handleJoin = useCallback((channel: any) => {
    console.log("[join-request] channel:", {
      id: channel?._id ?? channel?.id,
      name: channel?.name,
      code: channel?.code,
    });
    // TODO: dispatch a thunk here when the backend endpoint is available
  }, []);

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

        {/* --- CODE MATCH AREA: shows when user typed a code that matches any channel --- */}
        {!!debouncedQuery && (
          <View>
            {codeMatch ? (
              <JoinableChannelCard
                item={{
                  id: String((codeMatch as any)?._id ?? (codeMatch as any)?.id),
                  name: (codeMatch as any)?.name,
                  description: (codeMatch as any)?.description,
                  code: (codeMatch as any)?.code,
                }}
                onJoin={handleJoin}
                disabled={alreadyMember}
              />
            ) : (
              <View className="mx-4 mt-4 px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200">
                <Text className="text-gray-700 font-kumbh">
                  No channel found with that code.
                </Text>
                <Text className="text-gray-500 mt-1 text-[12px] font-kumbh">
                  Tip: Try pasting the exact code (with or without “#”, any
                  case).
                </Text>
              </View>
            )}
          </View>
        )}

        {/* --- EXISTING LIST: my channels --- */}
        <FlatList
          data={data}
          keyExtractor={(item: any) => item.__key}
          renderItem={({ item }) => (
            <ChannelCard
              item={item}
              colorOverride={(item as any)?.color || colorFor(item.__key)}
            />
          )}
          contentContainerStyle={{ paddingBottom: 24, paddingTop: 0 }}
          refreshControl={
            <RefreshControl
              refreshing={status === "loading"}
              onRefresh={onRefresh}
            />
          }
          ListEmptyComponent={
            <View className="items-center mt-24">
              <Ionicons name="chatbubbles-outline" size={28} color={INACTIVE} />
              <Text className="mt-2 text-gray-500 font-kumbh">
                {status === "loading"
                  ? "Loading channels…"
                  : "No channels found"}
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
