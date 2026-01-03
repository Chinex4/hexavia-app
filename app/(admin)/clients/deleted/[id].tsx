import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo } from "react";
import { Platform, Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";
import { ArrowLeft } from "lucide-react-native";

import type { Client } from "@/redux/client/client.types";

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

export default function DeletedClientDetail() {
  const { data } = useLocalSearchParams<{
    id: string;
    data?: string;
  }>();
  const router = useRouter();

  const client = useMemo<Client | null>(() => {
    if (!data) return null;
    try {
      return JSON.parse(decodeURIComponent(data));
    } catch {
      return null;
    }
  }, [data]);

  const infoRows = useMemo(() => {
    if (!client) return [];
    return [
      { label: "Project", value: client.projectName },
      { label: "Industry", value: client.industry },
      { label: "Engagement", value: client.engagement },
      { label: "Status", value: client.status },
      { label: "Payable amount", value: client.payableAmount },
      { label: "Staff size", value: client.staffSize },
      { label: "Phone", value: client.phone },
      { label: "Email", value: client.email },
      { label: "Deleted on", value: formatDate(client.deletedAt ?? client.updatedAt) },
    ].filter((row) => row.value !== undefined && row.value !== null);
  }, [client]);

  return (
    <SafeAreaView className="flex-1 bg-[#f4f5fb]">
      <View style={{
        paddingTop: Platform.OS === "android" ? 50 : 20,
      }} className="px-5 pb-3 bg-white border-b border-gray-200 flex-row items-center gap-3">
        <Pressable
          onPress={() => router.back()}
          className="h-10 w-10 rounded-full bg-gray-100 items-center justify-center"
        >
          <ArrowLeft size={20} color="#111827" />
        </Pressable>
        <View className="flex-1">
          <Text className="text-2xl font-semibold text-gray-900 font-kumbh">
            Deleted client
          </Text>
          <Text className="text-sm text-gray-500 mt-1 font-kumbh">
            Review info about the removed account.
          </Text>
        </View>
      </View>

      <ScrollView className="mt-4 px-5" contentContainerStyle={{ paddingBottom: 40 }}>
        {client ? (
          <View className="bg-white rounded-3xl p-5 shadow-[0_10px_25px_rgba(15,23,42,0.08)] border border-gray-100">
            <Text className="text-2xl font-semibold text-gray-900 font-kumbh">
              {client.name ?? "Client"}
            </Text>
            {client.description ? (
              <Text className="text-sm text-gray-500 mt-2 font-kumbh">
                {client.description}
              </Text>
            ) : null}
            <View className="mt-4 space-y-3">
              {infoRows.map((row) => (
                <View key={row.label} className="flex-row justify-between">
                  <Text className="text-xs text-gray-500 font-semibold font-kumbh">
                    {row.label}
                  </Text>
                  <Text className="text-xs text-gray-800 font-kumbh">
                    {row.label === "Payable amount"
                      ? formatMoney(row.value as number)
                      : String(row.value)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <View className="bg-white rounded-3xl p-5 border border-gray-100">
            <Text className="text-base font-semibold text-gray-900 font-kumbh">
              No client data available
            </Text>
            <Text className="text-sm text-gray-500 mt-2 font-kumbh">
              The deleted client data could not be parsed. Refresh the list and try
              again.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
