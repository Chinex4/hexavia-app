import React, { useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Plus,
  Search,
  SlidersHorizontal,
} from "lucide-react-native";
import ChannelCard from "@/components/admin/ChannelCard";

type Channel = {
  id: string;
  name: string;
  code: string;
  description?: string;
  color?: string; // optional accent
};

const DUMMY_CHANNELS: Channel[] = Array.from({ length: 8 }, (_, i) => ({
  id: `ch_${i + 1}`,
  name: "FinTeam",
  description: "Finance Team",
  code: "#12398",
  color: i % 3 === 0 ? "#707fbc" : "#60A5FA", // last one slightly different tint
}));

export default function ChannelsIndex() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return DUMMY_CHANNELS;
    return DUMMY_CHANNELS.filter(
      (c) =>
        c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="px-5 pt-6">
        <View className="flex-row items-center gap-4">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full items-center justify-center"
          >
            <ArrowLeft size={24} color="#111827" />
          </Pressable>
          <Text className="text-3xl font-kumbhBold text-text">Channels</Text>
        </View>

        {/* Create CTA */}
        <Pressable
          onPress={() => router.push("/(admin)/channels/create")}
          className="mt-6 flex-row items-center justify-center gap-3 rounded-2xl bg-primary-50 px-6 py-4 border border-primary-100"
        >
          <View className="w-7 h-7 rounded-lg bg-white items-center justify-center">
            <Plus size={18} color="#111827" />
          </View>
          <Text className="text-base font-kumbhBold text-text">
            Create New Channels
          </Text>
        </Pressable>

        {/* Search */}
        <View className="mt-4 flex-row items-center rounded-full bg-gray-200 py-2 px-4">
          <Search size={18} color="#6B7280" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search for channels"
            placeholderTextColor="#9CA3AF"
            className="flex-1 px-2 py-3 font-kumbh text-text"
            returnKeyType="search"
          />
        </View>

        <Text className="mt-6 mb-3 text-base font-kumbh text-text">
          Channels
        </Text>
      </View>

      {/* Grid */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 5, paddingHorizontal: 20 }}
        contentContainerStyle={{ paddingBottom: 24, gap: 5 }}
        renderItem={({ item }) => (
          <ChannelCard
            title={item.name}
            code={item.code}
            description={item.description}
            tint={item.color}
            onPress={() => {
              // later: push to channel detail if needed
            }}
          />
        )}
        ListEmptyComponent={
          <View className="px-5 py-16">
            <Text className="text-center text-gray-500 font-kumbh">
              No channels found.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
