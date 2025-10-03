import React, { useMemo, useState } from "react";
import { View, Text, Pressable, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import clsx from "clsx";

type RowStatus = "Active" | "Resolved" | "Pending";
type Sanction = {
  id: string;
  date: string;
  recipient: string;
  reason: string;
  status: RowStatus;
};

const DUMMY: Sanction[] = [
  {
    id: "1",
    date: "2025-09-12",
    recipient: "Adebayo Moda",
    reason: "Late delivery",
    status: "Active",
  },
  {
    id: "2",
    date: "2025-09-05",
    recipient: "Chidi Okafor",
    reason: "Missed standup",
    status: "Resolved",
  },
  {
    id: "3",
    date: "2025-08-28",
    recipient: "Amaka Benson",
    reason: "Unapproved leave",
    status: "Pending",
  },
];

export default function SanctionsView() {
  const router = useRouter();
  const [filter, setFilter] = useState<RowStatus | "All">("All");

  const data = useMemo(
    () => (filter === "All" ? DUMMY : DUMMY.filter((s) => s.status === filter)),
    [filter]
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="px-5 pt-6 pb-3 flex-row items-center gap-4">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center"
        >
          <ArrowLeft size={24} color="#111827" />
        </Pressable>
        <Text className="text-3xl font-kumbhBold text-text">Sanctions</Text>
      </View>

      {/* Filters */}
      <View className="px-5 flex-row gap-2">
        {(["All", "Active", "Resolved", "Pending"] as const).map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setFilter(tab)}
            className={clsx(
              "px-4 py-2 rounded-full border",
              filter === tab
                ? "bg-primary-500 border-primary-500"
                : "bg-white border-gray-200"
            )}
          >
            <Text
              className={clsx(
                "text-sm font-kumbhBold",
                filter === tab ? "text-white" : "text-text"
              )}
            >
              {tab}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* List */}
      <FlatList
        data={data}
        keyExtractor={(i) => i.id}
        contentContainerClassName="px-5 pt-4 pb-10"
        ItemSeparatorComponent={() => (
          <View className="h-[1px] bg-gray-200 my-4" />
        )}
        renderItem={({ item }) => (
          <View>
            <Row label="Date" value={formatDate(item.date)} />
            <Row label="Recipient" value={item.recipient} />
            <Row label="Reason" value={item.reason} />
            <View className="flex-row items-center justify-between py-1">
              <Text className="text-base text-gray-700 font-kumbh">Status</Text>
              <StatusPill status={item.status} />
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between py-1">
      <Text className="text-base text-gray-700 font-kumbh">{label}</Text>
      <Text className="text-base text-text font-kumbhBold max-w-[60%] text-right">
        {value}
      </Text>
    </View>
  );
}
function StatusPill({ status }: { status: "Active" | "Resolved" | "Pending" }) {
  const map = {
    Active: { bg: "bg-red-100", text: "text-red-700" },
    Resolved: { bg: "bg-green-100", text: "text-green-700" },
    Pending: { bg: "bg-yellow-100", text: "text-yellow-700" },
  } as const;
  const s = map[status];
  return (
    <View className={`px-3 py-1 rounded-full ${s.bg}`}>
      <Text className={`text-sm font-kumbhBold ${s.text}`}>{status}</Text>
    </View>
  );
}
function formatDate(d: string) {
  const dt = new Date(d);
  return dt.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
