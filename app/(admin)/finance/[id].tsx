// app/(admin)/finance/[id].tsx
import React, { useEffect, useMemo } from "react";
import { View, Text, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Plus } from "lucide-react-native";
import { StatusBar } from "expo-status-bar";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  selectFinanceRecords,
  selectFinanceListLoading,
  selectFinanceFilters,
} from "@/redux/finance/finance.selectors";
import { fetchFinance } from "@/redux/finance/finance.thunks";

const NGN = (n: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(n);

const dmy = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "2-digit",
        year: "numeric",
      })
    : "—";

export default function FinanceDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const dispatch = useAppDispatch();
  const loading = useAppSelector(selectFinanceListLoading);
  const filters = useAppSelector(selectFinanceFilters);
  const records = useAppSelector(selectFinanceRecords);

  // Find the expense by id
  const row = useMemo(
    () => records.find((r) => r._id === id && r.type === "expense"),
    [records, id]
  );

  // If record not present, fetch the list with current filters (scoped to expenses if possible)
  useEffect(() => {
    if (!row && !loading) {
      const params = { ...filters, type: "expense", page: filters.page ?? 1, limit: filters.limit ?? 50 };
      dispatch(fetchFinance(params as any) as any);
    }
  }, [row, loading, filters, dispatch]);

  const amountStr = NGN(row?.amount ?? 0);
  const dateStr = dmy(row?.date);
  const descStr = String(row?.description ?? "");

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />

      {/* Header */}
      <View className="px-5 pt-5 pb-3 flex-row items-center justify-between gap-4">
        <Pressable onPress={() => router.back()} className="w-10 h-10 items-center justify-center">
          <ArrowLeft size={24} color="#111827" />
        </Pressable>
        <Text className="text-3xl font-kumbhBold text-[#111827]">Details</Text>
        <View className="w-10" />
      </View>

      {loading && !row ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
          <Text className="mt-2 text-gray-500 font-kumbh">Loading expense…</Text>
        </View>
      ) : !row ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center text-gray-500 font-kumbh">
            Expense not found.
          </Text>
        </View>
      ) : (
        <ScrollView className="flex-1" contentContainerClassName="px-5 pb-10">
          {/* Top card */}
          <View className="rounded-2xl bg-gray-100 border border-[#4C5FAB]/30 px-4 py-10 items-center my-4">
            <Text className="text-[26px] font-kumbhBold text-[#111827]">{amountStr}</Text>
            <Text className="mt-1 text-[12px] tracking-widest text-gray-600 font-kumbhBold">
              EXPENSE
            </Text>
          </View>

          {/* Details panel */}
          <View className="rounded-2xl bg-gray-100 px-5 py-6">
            <KV label="Amount" value={amountStr} />
            <KV label="Date" value={dateStr} />
            <KV label="Descriptions" value={descStr} />
          </View>
        </ScrollView>
      )}

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

function KV({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between py-2">
      <Text className="text-[15px] text-gray-500 font-kumbh">{label}</Text>
      <Text className="text-[15px] font-kumbhBold text-[#111827]">{value}</Text>
    </View>
  );
}
