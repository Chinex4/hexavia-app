import React, { useMemo, useState } from "react";
import { View, Text, Pressable, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Plus } from "lucide-react-native";

type Client = {
  id: string;
  name: string;
  business: string;
  engagement: string;
  date: string; // ISO or display string
  status: "pending" | "current" | "past";
};

const DUMMY: Client[] = [
  {
    id: "cl_001",
    name: "Adebayo Moda Ibrahim",
    business: "Project HomeLet",
    engagement: "Project HomeLet",
    date: "20/01/2034",
    status: "pending",
  },
  {
    id: "cl_002",
    name: "Chiamaka O. Benson",
    business: "Nexa Retail",
    engagement: "Marketing Landing",
    date: "18/02/2034",
    status: "current",
  },
  {
    id: "cl_003",
    name: "Ola Peters",
    business: "ByteFoods",
    engagement: "POS Revamp",
    date: "10/11/2033",
    status: "past",
  },
  {
    id: "cl_004",
    name: "Adebayo Moda Ibrahim",
    business: "Project HomeLet",
    engagement: "Project HomeLet",
    date: "20/01/2034",
    status: "pending",
  },
];

export default function ClientsIndex() {
  const router = useRouter();
  const [tab, setTab] = useState<"pending" | "current" | "past">("pending");

  const data = useMemo(() => DUMMY.filter((c) => c.status === tab), [tab]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="px-5 pt-6 pb-4">
        <View className="flex-row items-center gap-4">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full items-center justify-center"
          >
            <ArrowLeft size={24} color="#111827" />
          </Pressable>
          <Text className="text-3xl font-kumbhBold text-text">Hexavia Client</Text>
        </View>

        {/* Add client */}
        <Pressable
          onPress={() => router.push("/(admin)/clients/create")}
          className="mt-6 self-center flex-row items-center gap-3 rounded-2xl bg-primary-50 px-6 py-4 border border-primary-100"
        >
          <View className="w-7 h-7 rounded-lg bg-white items-center justify-center">
            <Plus size={18} color="#111827" />
          </View>
          <Text className="text-base font-kumbhBold text-text">Add a new Client</Text>
        </Pressable>

        {/* Tabs */}
        <View className="mt-6 flex-row items-center gap-8 px-1">
          {(["pending", "current", "past"] as const).map((t) => (
            <Pressable key={t} onPress={() => setTab(t)} className="items-center">
              <Text
                className={`text-base font-kumbh ${
                  tab === t ? "text-blue-500 font-kumbhBold" : "text-gray-600"
                }`}
              >
                {t[0].toUpperCase() + t.slice(1)}
              </Text>
              {tab === t ? <View className="h-[3px] w-28 bg-blue-300 rounded-full mt-2" /> : <View className="h-[3px] w-28 mt-2" />}
            </Pressable>
          ))}
        </View>
      </View>

      {/* List */}
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-5 pb-10"
        ItemSeparatorComponent={() => <View className="h-[1px] bg-gray-200 my-4" />}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push({ pathname: "/(admin)/clients/[id]", params: { id: item.id } })}
            className="py-1"
          >
            <Row label="Name:" value={item.name} />
            <Row label="Business" value={item.business} />
            <Row label="Engagement" value={item.engagement} />
            <Row label="Date" value={item.date} />
          </Pressable>
        )}
        ListEmptyComponent={
          <View className="px-5 py-12">
            <Text className="text-center text-gray-500 font-kumbh">No clients in this tab.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between py-2">
      <Text className="text-base text-gray-700 font-kumbh">{label}</Text>
      <Text className="text-base text-text font-kumbhBold">{value}</Text>
    </View>
  );
}
