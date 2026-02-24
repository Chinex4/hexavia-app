import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";

import { showSuccess } from "@/components/ui/toast";
import {
  fetchDeletedChannels,
  restoreChannelById,
} from "@/redux/channels/channels.thunks";
import type { Channel } from "@/redux/channels/channels.types";
import { useAppDispatch } from "@/store/hooks";

type DeletedChannel = Channel & {
  deletedAt?: string;
};

const formatDate = (value?: string) => {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return value;
  }
};

export default function DeletedChannelsScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [channels, setChannels] = useState<DeletedChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadDeletedChannels = useCallback(async () => {
    const data = await dispatch(fetchDeletedChannels()).unwrap();
    setChannels(data as DeletedChannel[]);
    setError(null);
  }, [dispatch]);

  useEffect(() => {
    setLoading(true);
    loadDeletedChannels()
      .catch((err: any) => {
        const message = err?.message || err?.payload || "Could not load projects";
        setError(message);
      })
      .finally(() => setLoading(false));
  }, [loadDeletedChannels]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadDeletedChannels();
    } catch (err: any) {
      const message = err?.message || err?.payload || "Could not refresh projects";
      setError(message);
    } finally {
      setRefreshing(false);
    }
  }, [loadDeletedChannels]);

  const handleRestore = useCallback(
    (item: DeletedChannel) => {
      const projectName = item.name?.trim() || "this project";
      Alert.alert("Restore project", `Restore ${projectName}?`, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Restore",
          onPress: async () => {
            setRestoringId(item._id);
            try {
              const res = await dispatch(
                restoreChannelById({ channelId: item._id })
              ).unwrap();
              setChannels((prev) => prev.filter((c) => c._id !== item._id));
              setError(null);
              showSuccess(res?.message || "Project restored successfully");
            } catch (err: any) {
              const message =
                err?.message || err?.payload || "Could not restore project";
              setError(message);
            } finally {
              setRestoringId((current) =>
                current === item._id ? null : current
              );
            }
          },
        },
      ]);
    },
    [dispatch]
  );

  const renderProject = useCallback(
    ({ item }: { item: DeletedChannel }) => {
      const isRestoring = restoringId === item._id;
      return (
        <View className="bg-white rounded-3xl px-5 py-4 mb-4 border border-gray-100 shadow-[0_10px_20px_rgba(15,23,42,0.08)]">
          <Text className="text-lg font-semibold text-gray-900 font-kumbh">
            {item.name ?? "Project"}
          </Text>
          {item.code ? (
            <Text className="text-sm text-gray-500 mt-1 font-kumbh">
              Code: {item.code}
            </Text>
          ) : null}
          {item.description ? (
            <Text className="text-sm text-gray-500 mt-1 font-kumbh">
              {item.description}
            </Text>
          ) : null}
          <Text className="text-xs text-gray-400 mt-2 font-kumbh">
            Deleted {formatDate(item.deletedAt ?? item.updatedAt)}
          </Text>
          <View className="mt-4 flex-row items-center justify-end">
            <Pressable
              disabled={isRestoring}
              onPress={() => handleRestore(item)}
              className="bg-[#4c5fab] rounded-full px-4 py-2 min-w-[88px] items-center"
              style={{ opacity: isRestoring ? 0.7 : 1 }}
            >
              {isRestoring ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text className="text-white text-sm font-semibold font-kumbh">
                  Restore
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      );
    },
    [handleRestore, restoringId]
  );

  const emptyComponent = useMemo(() => {
    if (loading) return null;
    return (
      <View className="px-5 mt-10">
        <Text className="text-center text-gray-500 font-kumbh">
          No deleted projects available right now.
        </Text>
      </View>
    );
  }, [loading]);

  return (
    <SafeAreaView className="flex-1 bg-[#f4f5fb]">
      <View className="px-5 pt-5 pb-4 bg-white border-b border-gray-200 flex-row items-center gap-3">
        <Pressable
          onPress={() => router.back()}
          className="h-10 w-10 rounded-full bg-gray-100 items-center justify-center"
        >
          <ArrowLeft size={20} color="#111827" />
        </Pressable>
        <View className="flex-1">
          <Text className="text-2xl font-semibold text-gray-900 font-kumbh">
            Deleted Projects
          </Text>
          <Text className="text-sm text-gray-500 mt-1 font-kumbh">
            Review deleted projects and restore when needed.
          </Text>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#4c5fab" />
        </View>
      ) : (
        <FlatList
          data={channels}
          keyExtractor={(item) => item._id}
          renderItem={renderProject}
          className="flex-1 px-5 mt-5"
          contentContainerStyle={{ paddingBottom: 24 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={emptyComponent}
        />
      )}

      {error ? (
        <View className="px-5 py-3">
          <Text className="text-sm text-red-500 font-kumbh">{error}</Text>
        </View>
      ) : null}
    </SafeAreaView>
  );
}
