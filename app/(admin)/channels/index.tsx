// app/(admin)/channels/index.tsx  (or wherever this file lives)
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
    /* MoreVertical, */ Copy,
  Plus,
  Search,
} from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator, // <- kept for commented block
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  View,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import ChannelCard from "@/components/admin/ChannelCard";
import EditChannelModal from "@/components/admin/EditChannelModal";
import { showSuccess } from "@/components/ui/toast";
import {
  selectAllChannels,
  selectChannelsState,
} from "@/redux/channels/channels.slice";
import { deleteChannelById, fetchChannels } from "@/redux/channels/channels.thunks";
import type { Channel } from "@/redux/channels/channels.types";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

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
  // console.log(channels.filter(ch => ch.name == "TEST")[0].members)
  const { status, error } = useAppSelector(selectChannelsState);

  const [query, setQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [actionTarget, setActionTarget] = useState<Channel | null>(null);
  const [editChannel, setEditChannel] = useState<Channel | null>(null);
  const [editOpen, setEditOpen] = useState(false);

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
      Alert.alert("No code", "This Project has no code to copy.");
      return;
    }
    try {
      await Clipboard.setStringAsync(code);
      // Alert.alert("Copied", "Project code copied to clipboard.");
      showSuccess("Project code copied to clipboard.")
    } catch (e) {
      Alert.alert("Error", "Failed to copy Project code.");
    }
  };

  const openActions = (channel: Channel) => {
    setActionTarget(channel);
    setSheetOpen(true);
  };

  const closeActions = () => setSheetOpen(false);

  const confirmDelete = (channelId: string, name?: string) => {
    closeActions();
    if (!channelId) return;
    Alert.alert(
      "Delete Project",
      `Are you sure you want to delete "${name || "this project"}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setDeletingId(channelId);
            try {
              await dispatch(deleteChannelById({ channelId })).unwrap();
              // showSuccess("Project deleted");
            } catch (err) {
              // errors already toasted in thunk
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
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
          <Text className="text-3xl font-kumbh text-text">Projects</Text>
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
            Create New Project
          </Text>
        </Pressable>

        {/* Search */}
        <View className="mt-4 flex-row items-center rounded-full bg-gray-200 py-2 px-4">
          <Search size={18} color="#6B7280" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search for Projects"
            placeholderTextColor="#9CA3AF"
            className="flex-1 px-2 py-3 font-kumbh text-text"
            returnKeyType="search"
          />
        </View>

        <Text className="mt-6 mb-3 text-base font-kumbh text-text">Projects</Text>
      </View>

      {/* Content */}
      {initialLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
          <Text className="mt-2 text-gray-500 font-kumbh">
            Loading Projects...
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
                onLongPress={() => openActions(item)}
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
                <Copy size={12} color="#ffffff" />
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
                  : "No Projects found."}
              </Text>
            </View>
          }
        />
      )}

      <Modal
        transparent
        visible={sheetOpen}
        animationType="fade"
        onRequestClose={closeActions}
      >
        <Pressable
          onPress={closeActions}
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.3)",
            justifyContent: "flex-end",
          }}
        >
          <View
            style={{
              backgroundColor: "#fff",
              padding: 16,
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
            }}
          >
            <Text className="text-center font-kumbhBold text-base mb-3">
              Channel Actions
            </Text>
            <Pressable
              onPress={() => {
                if (!actionTarget) return;
                setEditChannel(actionTarget);
                setEditOpen(true);
                closeActions();
              }}
              disabled={!actionTarget}
              className="py-3"
            >
              <Text className="text-center font-kumbh text-gray-700">
                Edit channel
              </Text>
            </Pressable>
            <View className="h-[1px] bg-gray-200" />
            <Pressable
              onPress={() =>
                actionTarget &&
                confirmDelete(actionTarget._id, actionTarget.name)
              }
              disabled={!actionTarget || deletingId === actionTarget?._id}
              className="py-3"
            >
              <Text className="text-center font-kumbh text-red-600">
                {deletingId === actionTarget?._id ? "Deleting..." : "Delete channel"}
              </Text>
            </Pressable>
            <View className="h-[1px] bg-gray-200" />
            <Pressable onPress={closeActions} className="py-3">
              <Text className="text-center font-kumbh text-gray-700">
                Cancel
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
      <EditChannelModal
        visible={editOpen}
        channel={editChannel}
        onClose={() => {
          setEditOpen(false);
          setEditChannel(null);
        }}
      />
    </SafeAreaView>
  );
}
