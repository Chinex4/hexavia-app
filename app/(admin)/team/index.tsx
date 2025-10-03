import React from "react";
import { View, Text, Pressable, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, ArrowRight, Plus } from "lucide-react-native";

const STAFF = [
  { id: "s1", name: "Staff I" },
  { id: "s2", name: "Staff II" },
  { id: "s3", name: "Staff III" },
];

export default function TeamIndex() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="px-5 pt-6 pb-4 flex-row items-center gap-4">
        <Pressable onPress={() => router.back()} className="w-10 h-10 items-center justify-center">
          <ArrowLeft size={24} color="#111827" />
        </Pressable>
        <Text className="text-3xl font-kumbhBold text-text">Team</Text>
      </View>

      {/* Sanction Grid Card */}
      <View className="mx-5 mt-2 rounded-2xl bg-primary-50 p-4 border border-primary-100">
        <Text className="text-2xl font-kumbhBold text-text">Sanction Grid</Text>
        <Text className="mt-1 text-gray-600 font-kumbh">Queries : 10</Text>

        <View className="mt-4 flex-row gap-3">
          <Pressable
            onPress={() => router.push("/(admin)/team/sanctions")}
            className="flex-1 h-12 rounded-xl border border-primary-400 items-center justify-center"
          >
            <Text className="text-primary-600 font-kumbhBold">View</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push("/(admin)/team/sanctions/create")}
            className="flex-1 h-12 rounded-xl bg-primary-500 items-center justify-center active:opacity-90 flex-row gap-2"
          >
            <Plus size={18} color="#fff" />
            <Text className="text-white font-kumbhBold">Add New</Text>
          </Pressable>
        </View>
      </View>

      {/* Staff list */}
      <FlatList
        data={STAFF}
        keyExtractor={(i) => i.id}
        contentContainerClassName="px-5 pt-6 pb-12"
        ItemSeparatorComponent={() => <View className="h-[1px] bg-gray-200 my-4" />}
        renderItem={({ item }) => (
          <View>
            <Text className="text-lg font-kumbhBold text-text">{item.name}</Text>
            <Pressable
              onPress={() =>
                router.push({ pathname: "/(admin)/team/taskboard", params: { staffId: item.id } })
              }
              className="mt-2 flex-row items-center justify-between"
            >
              <Text className="text-base text-gray-700 font-kumbh">View task board</Text>
              <ArrowRight size={20} color="#111827" />
            </Pressable>
          </View>
        )}
      />
    </SafeAreaView>
  );
}
