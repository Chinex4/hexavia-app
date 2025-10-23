// app/(admin)/index.tsx (AdminDashboard)
import React, { useMemo, useEffect } from "react";
import { View, Text, ScrollView, Image, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Bell, Users, UserPlus, FolderKanban, BarChart3, ChevronRight } from "lucide-react-native";

import AdminHeader from "@/components/admin/AdminHeader";
import Tile from "@/components/admin/Tile";
import SectionCard from "@/components/admin/SectionCard";
import StatPill from "@/components/admin/StatPiill";
import ProgressRow from "@/components/admin/ProgressRow";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchFinance } from "@/redux/finance/finance.thunks";
import {
  selectFinanceSummary,
  selectFinanceListLoading,
} from "@/redux/finance/finance.selectors";

const N = (v: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(v);

export default function AdminDashboard() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  // pull summary only
  const summary = useAppSelector(selectFinanceSummary);
  const loadingSummary = useAppSelector(selectFinanceListLoading);

  useEffect(() => {
    // no filters -> backend should return overall summary
    dispatch(fetchFinance());
  }, [dispatch]);

  // fake team perf (unchanged)
  const perf = useMemo(
    () => ({ completed: 78, inProgress: 56, pending: 22 }),
    []
  );

  // console.log(summary)

  const receivables = summary?.totalReceivables ?? 0;
  const expenses = summary?.totalExpenses ?? 0;
  const net = (summary?.netBalance ?? (receivables - expenses)) || 0;

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1 bg-background" contentContainerClassName="pb-8">
        {/* Top bar */}
        <AdminHeader
          title="Hi Hexavia!"
          subtitleBadge="Admin"
          rightIcon={<Bell size={20} color="#111827" />}
          onRightPress={() => router.push("/(admin)/notifications")}
        />

        {/* Big tiles */}
        <View className="px-5 gap-2">
          <View className="flex-row gap-2">
            <Tile title="Clients" icon={<Users size={22} color="white" />} onPress={() => router.push("/(admin)/clients")} />
            <Tile title="Groups" icon={<UserPlus size={22} color="white" />} onPress={() => router.push("/(admin)/channels")} />
          </View>
          <View className="flex-row gap-2">
            <Tile title="Team" icon={<FolderKanban size={22} color="white" />} onPress={() => router.push("/(admin)/team")} />
            <Tile title="Finance" icon={<BarChart3 size={22} color="white" />} onPress={() => router.push("/(admin)/finance")} />
          </View>
          <View className="flex-row gap-2">
            <Tile title="Prospects" icon={<FolderKanban size={22} color="white" />} onPress={() => router.push("/(admin)/prospects")} />
          </View>
        </View>

        {/* Create report card */}
        <SectionCard className="mx-5 mt-5" noTitle>
          <Pressable onPress={() => router.push("/(admin)/report")} className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <View className="w-12 h-12 rounded-2xl bg-primary-100 items-center justify-center">
                <BarChart3 size={22} color="#4c5fab" />
              </View>
              <View>
                <Text className="text-[20px] font-kumbh text-text">Create report</Text>
                <Text className="text-sm text-gray-500 mt-1 max-w-[200px] font-kumbh">
                  Generate detailed reports to track performance and make informed decisions
                </Text>
              </View>
            </View>
            <ChevronRight size={22} color="#111827" />
          </Pressable>
        </SectionCard>

        {/* Finance summary — no filters */}
        <SectionCard title="Finance Summary" className="mx-5 mt-6">
          <View className="rounded-2xl bg-primary-50 p-4">
            {loadingSummary ? (
              <Text className="text-[#4c5fab] font-kumbh mb-3">Loading summary…</Text>
            ) : null}

            <View className="flex-row gap-4">
              <StatPill label="Receivables" value={N(receivables)} />
              <StatPill label="Expenses" value={N(expenses)} />
            </View>

            {/* Optional Net pill */}
            <View className="mt-3">
              <StatPill label="Net" value={N(net)} />
            </View>
          </View>
        </SectionCard>

        {/* Team performance (unchanged) */}
        <SectionCard title="Team Performance" className="mx-5 mt-6">
          <View className="flex-row gap-4 items-center">
            <View className="w-24 h-24 rounded-2xl items-center justify-center">
              <Image source={require("@/assets/images/team-performance.png")} className="w-24 h-24" />
            </View>
            <View className="flex-1 gap-3">
              <ProgressRow label="Completed Task" percent={perf.completed} />
              <ProgressRow label="InProgress Task" percent={perf.inProgress} />
              <ProgressRow label="Pending Task" percent={perf.pending} />
            </View>
          </View>
        </SectionCard>
      </ScrollView>
    </SafeAreaView>
  );
}
