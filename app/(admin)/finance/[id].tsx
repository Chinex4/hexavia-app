import React from "react";
import { View, Text, Pressable, SafeAreaView, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Plus } from "lucide-react-native";

const NGN = (n: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
  }).format(n);

const dmy = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "2-digit",
    year: "numeric",
  });

const loadExpense = (id: string) => ({
  id,
  amount: 2861384.05,
  date: new Date().toISOString(),
  description: "Jonathan Payment",
});

export default function FinanceDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const row = loadExpense(id || "x");

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="px-5 pt-16 pb-3 flex-row items-center gap-4">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center"
        >
          <ArrowLeft size={24} color="#111827" />
        </Pressable>
        <Text className="text-3xl font-kumbhBold text-[#111827]">Details</Text>
      </View>

      <ScrollView className="flex-1" contentContainerClassName="px-5 pb-10">
        {/* Top card */}
        <View className="rounded-2xl bg-gray-100 border border-[#4C5FAB]/30 px-4 py-10 items-center my-4">
          <Text className="text-[26px] font-kumbhBold text-[#111827]">
            {NGN(row.amount)}
          </Text>
          <Text className="mt-1 text-[12px] tracking-widest text-gray-600 font-kumbhBold">
            EXPENSE
          </Text>
        </View>

        {/* Details panel */}
        <View className="rounded-2xl bg-gray-100 px-5 py-6">
          <View className="flex-row items-center justify-between py-2">
            <Text className="text-[15px] text-gray-500 font-kumbh">Amount</Text>
            <Text className="text-[15px] font-kumbhBold text-[#111827]">
              {NGN(row.amount)}
            </Text>
          </View>

          <View className="flex-row items-center justify-between py-2">
            <Text className="text-[15px] text-gray-500 font-kumbh">Date</Text>
            <Text className="text-[15px] font-kumbhBold text-[#111827]">
              {dmy(row.date)}
            </Text>
          </View>

          <View className="flex-row items-center justify-between py-2">
            <Text className="text-[15px] text-gray-500 font-kumbh">
              Descriptions
            </Text>
            <Text className="text-[15px] font-kumbhBold text-[#111827]">
              {row.description}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom buttons */}
      <View className="px-5 pb-6 flex-row items-center justify-between gap-3">
        <Pressable
          onPress={() => router.push("/(admin)/finance/form")}
          className="flex-1 h-12 rounded-2xl border border-[#4C5FAB] items-center justify-center flex-row"
        >
          <View className="w-6 h-6 rounded-full bg-[#4C5FAB]/10 items-center justify-center mr-2">
            <Plus size={16} color="#4C5FAB" />
          </View>
          <Text className="text-[#4C5FAB] font-kumbhBold">Record Expenses</Text>
        </Pressable>

        <Pressable
          onPress={() => router.replace("/(admin)")}
          className="flex-1 h-12 rounded-2xl bg-[#4C5FAB] items-center justify-center"
        >
          <Text className="text-white font-kumbhBold">Back to Home</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
