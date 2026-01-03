import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";

import { useAppDispatch } from "@/store/hooks";
import { fetchDeletedClients } from "@/redux/client/client.thunks";
import type { Client } from "@/redux/client/client.types";

type DeletedClient = Client & {
  deletedAt?: string;
};

const formatMoney = (value?: number) => {
  if (typeof value !== "number" || !isFinite(value)) return "₦ 0.00";
  try {
    return (
      "₦ " +
      new Intl.NumberFormat("en-NG", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value)
    );
  } catch {
    return `₦ ${value.toFixed(2)}`;
  }
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

export default function DeletedClientsScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [clients, setClients] = useState<DeletedClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    dispatch(fetchDeletedClients())
      .unwrap()
      .then((data) => {
        setClients(data.clients ?? []);
        setError(null);
      })
      .catch((err: any) => {
        const message =
          err?.message || err?.payload?.message || "Could not load clients";
        setError(message);
      })
      .finally(() => setLoading(false));
  }, [dispatch]);

  const renderClient = useCallback(
    ({ item }: { item: DeletedClient }) => {
      const subtitleParts = [
        item.projectName,
        item.industry,
        item.engagement,
      ].filter(Boolean);
      return (
        <Pressable
          onPress={() =>
            router.push(
              `/(admin)/clients/deleted/${item._id}?data=${encodeURIComponent(
                JSON.stringify(item)
              )}`
            )
          }
          className="bg-white rounded-3xl px-5 py-4 mb-4 border border-gray-100 shadow-[0_10px_20px_rgba(15,23,42,0.08)]"
        >
          <Text className="text-lg font-semibold text-gray-900 font-kumbh">
            {item.name ?? "Client"}
          </Text>
          {subtitleParts.length > 0 ? (
            <Text className="text-sm text-gray-500 mt-1 font-kumbh">
              {subtitleParts.join(" • ")}
            </Text>
          ) : null}
          <View className="flex-row items-center justify-between gap-3 mt-3">
            <Text className="text-xs uppercase tracking-wide text-gray-400 font-semibold font-kumbh">
              Status: {item.status ?? "deleted"}
            </Text>
            {item.payableAmount != null ? (
              <Text className="text-sm font-semibold text-primary font-kumbh">
                {formatMoney(item.payableAmount)}
              </Text>
            ) : null}
          </View>
          <Text className="text-xs text-gray-400 mt-2 font-kumbh">
            Deleted {formatDate(item.deletedAt ?? item.updatedAt)}
          </Text>
          {item.email ? (
            <Text className="text-xs text-gray-500 mt-1 font-kumbh">
              {item.email}
            </Text>
          ) : null}
        </Pressable>
      );
    },
    [router]
  );

  const emptyComponent = useMemo(() => {
    if (loading) return null;
    return (
      <View className="px-5 mt-10">
        <Text className="text-center text-gray-500 font-kumbh">
          No deleted clients available right now.
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
            Deleted Clients
          </Text>
          <Text className="text-sm text-gray-500 mt-1 font-kumbh">
            Tap a card to view data for a removed client.
          </Text>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#4c5fab" />
        </View>
      ) : (
        <FlatList
          data={clients}
          keyExtractor={(item) => item._id}
          renderItem={renderClient}
          className="flex-1 px-5 mt-5"
          contentContainerStyle={{ paddingBottom: 24 }}
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
