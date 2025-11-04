// app/(admin)/channels/index.tsx  (or wherever this file lives)
import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Modal, // <- kept for commented block
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Plus,
  Search,
  /* MoreVertical, */ Copy,
} from "lucide-react-native";
import * as Clipboard from "expo-clipboard";

import ChannelCard from "@/components/admin/ChannelCard";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchChannels } from "@/redux/channels/channels.thunks";
import {
  selectAllChannels,
  selectChannelsState,
} from "@/redux/channels/channels.slice";
import { showSuccess } from "@/components/ui/toast";

const TINTS = [
  "#707fbc",
  "#60A5FA",
  "#14D699",
  "#F6A94A",
  "#9B7BF3",
  "#29C57A",
];

function hashToIndex(input: string, mod: number) {
  let h = 5381;
  for (let i = 0; i < input.length; i++) h = (h * 33) ^ input.charCodeAt(i);
  return Math.abs(h) % mod;
}
function getTint(item: { color?: string; _id?: string }, index: number) {
  if (item.color) return item.color;
  if (item._id) return TINTS[hashToIndex(item._id, TINTS.length)];
  return TINTS[index % TINTS.length];
}

export default function ChannelsIndex() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const channels = useAppSelector(selectAllChannels);
  console.log(channels.filter(ch => ch.name == "TEST")[0].members)
  const { status, error } = useAppSelector(selectChannelsState);

  const [query, setQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  /* ===== Channel Actions (commented out as requested) =====
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const openMenu = (id: string) => { setSelectedId(id); setMenuOpen(true); };
  const closeMenu = () => setMenuOpen(false);
  const onEdit = () => { if (selectedId) { closeMenu(); router.push({ pathname: "/(admin)/channels/[id]/edit", params: { id: selectedId } }); } };
  const onDelete = () => {
    closeMenu();
    if (!selectedId) return;
    Alert.alert("Delete Group", "Are you sure you want to delete this group? This action cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => { /* dispatch(deleteChannel(selectedId)) */ /* } },
    ]);
  };
  ========================================================= */

  useEffect(() => {
    dispatch(fetchChannels());
  }, [dispatch]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await dispatch(fetchChannels()).unwrap();
    } finally {
      setRefreshing(false);
    }
  }, [dispatch]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return channels;
    return channels.filter((c) => {
      const name = (c.name || "").toLowerCase();
      const code = (c.code || "").toLowerCase();
      const desc = (c.description || "").toLowerCase();
      return name.includes(q) || code.includes(q) || desc.includes(q);
    });
  }, [channels, query]);

  const initialLoading = status === "loading" && channels.length === 0;

  const copyCode = async (code?: string) => {
    if (!code) {
      Alert.alert("No code", "This group has no code to copy.");
      return;
    }
    try {
      await Clipboard.setStringAsync(code);
      // Alert.alert("Copied", "Group code copied to clipboard.");
      showSuccess("Group code copied to clipboard.")
    } catch (e) {
      Alert.alert("Error", "Failed to copy group code.");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="px-5 pt-6">
        <View className="flex-row items-center justify-between gap-4">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full items-center justify-center"
          >
            <ArrowLeft size={24} color="#111827" />
          </Pressable>
          <Text className="text-3xl font-kumbh text-text">Groups</Text>
          <View className="w-10" />
        </View>

        {/* Create CTA */}
        <Pressable
          onPress={() => router.push("/(admin)/channels/create")}
          className="mt-6 flex-row items-center justify-center gap-3 rounded-2xl bg-primary-50 px-6 py-4 border border-primary-100"
        >
          <View className="w-7 h-7 rounded-lg bg-white items-center justify-center">
            <Plus size={18} color="#111827" />
          </View>
          <Text className="text-base font-kumbh text-text">
            Create New Group
          </Text>
        </Pressable>

        {/* Search */}
        <View className="mt-4 flex-row items-center rounded-full bg-gray-200 py-2 px-4">
          <Search size={18} color="#6B7280" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search for groups"
            placeholderTextColor="#9CA3AF"
            className="flex-1 px-2 py-3 font-kumbh text-text"
            returnKeyType="search"
          />
        </View>

        <Text className="mt-6 mb-3 text-base font-kumbh text-text">Groups</Text>
      </View>

      {/* Content */}
      {initialLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
          <Text className="mt-2 text-gray-500 font-kumbh">
            Loading groups...
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item._id}
          numColumns={2}
          columnWrapperStyle={{ gap: 5, paddingHorizontal: 20 }}
          contentContainerStyle={{ paddingBottom: 24, gap: 5 }}
          refreshControl={
            <RefreshControl
              refreshing={status === "loading" && channels.length > 0}
              onRefresh={onRefresh}
            />
          }
          renderItem={({ item, index }) => (
            <View style={{ flex: 1, position: "relative" }}>
              <ChannelCard
                title={item.name ?? ""}
                code={item.code ?? ""}
                description={item.description ?? undefined}
                tint={getTint(item, index)}
                onPress={() => {
                  router.push({
                    pathname: "/(admin)/chats/[channelId]",
                    params: { channelId: item._id },
                  });
                }}
              />

              {/* Copy icon (replaces ellipsis). No background behind it. */}
              <Pressable
                onPress={() => copyCode(item.code)}
                style={{
                  position: "absolute",
                  top: 6,
                  right: 6,
                  width: 32,
                  height: 32,
                  alignItems: "center",
                  justifyContent: "center",
                }}
                hitSlop={8}
              >
                <Copy size={18} color="#ffffff" />
              </Pressable>

              {/* ===== Channel Actions button (commented out) =====
              <Pressable
                onPress={() => openMenu(item._id)}
                style={{
                  position: "absolute",
                  top: 6,
                  right: 6,
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "rgba(0,0,0,0.2)",
                }}
              >
                <MoreVertical size={18} color="#fff" />
              </Pressable>
              =================================================== */}
            </View>
          )}
          ListEmptyComponent={
            <View className="px-5 py-16">
              <Text className="text-center text-gray-500 font-kumbh">
                {status === "failed" && error
                  ? `Error: ${error}`
                  : "No groups found."}
              </Text>
            </View>
          }
        />
      )}

      {/* ===== Channel Actions modal (commented out) =====
      <Modal transparent visible={menuOpen} animationType="fade" onRequestClose={closeMenu}>
        <Pressable
          onPress={closeMenu}
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.3)", justifyContent: "flex-end" }}
        >
          <View
            style={{
              backgroundColor: "#fff",
              padding: 16,
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
            }}
          >
            <Text className="text-center font-kumbhBold text-base mb-3">Channel Actions</Text>
            <Pressable onPress={onEdit} className="py-3">
              <Text className="text-center font-kumbh text-blue-700">Edit channel</Text>
            </Pressable>
            <View className="h-[1px] bg-gray-200" />
            <Pressable onPress={onDelete} className="py-3">
              <Text className="text-center font-kumbh text-red-600">Delete channel</Text>
            </Pressable>
            <View className="h-[1px] bg-gray-200" />
            <Pressable onPress={closeMenu} className="py-3">
              <Text className="text-center font-kumbh text-gray-700">Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
      ================================================ */}
    </SafeAreaView>
  );
}
