import React, { useMemo } from "react";
import { View, Text, ScrollView, Image } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Bell,
  Users,
  UserPlus,
  FolderKanban,
  BarChart3,
  ChevronRight,
} from "lucide-react-native";
import AdminHeader from "@/components/admin/AdminHeader";
import Tile from "@/components/admin/Tile";
import SectionCard from "@/components/admin/SectionCard";
import StatPill from "@/components/admin/StatPiill";
import FilterChip from "@/components/admin/FilterChip";
import ProgressRow from "@/components/admin/ProgressRow";

type FinanceSummary = { receivables: number; outflow: number };

const N = (v: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(v);

export default function AdminDashboard() {
  const router = useRouter();

  const finance: FinanceSummary = { receivables: 240573.04, outflow: 200570.0 };
  const perf = useMemo(
    () => ({ completed: 78, inProgress: 56, pending: 22 }),
    []
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1 bg-background"
        contentContainerClassName="pb-8"
      >
        {/* Top bar */}
        <AdminHeader
          title="Hi Hexavia!"
          subtitleBadge="Admin"
          rightIcon={<Bell size={20} color="#111827" />}
          onRightPress={() => {}}
        />

        {/* Big tiles */}
        <View className="px-5 gap-2">
          <View className="flex-row gap-2">
            <Tile
              title="Clients"
              icon={<Users size={22} color="white" />}
              onPress={() => router.push("/(admin)/clients")}
            />
            <Tile
              title="Channels"
              icon={<UserPlus size={22} color="white" />}
              onPress={() => router.push("/(admin)/channels")}
            />
          </View>
          <View className="flex-row gap-2">
            <Tile
              title="Team"
              icon={<FolderKanban size={22} color="white" />}
              onPress={() => router.push("/(admin)/team")}
            />
            <Tile
              title="Finance"
              icon={<BarChart3 size={22} color="white" />}
              onPress={() => router.push("/(admin)/finance")}
            />
          </View>
        </View>

        {/* Create report card */}
        <SectionCard className="mx-5 mt-5" noTitle>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <View className="w-12 h-12 rounded-2xl bg-primary-100 items-center justify-center">
                <BarChart3 size={22} color="#4c5fab" />
              </View>
              <View>
                <Text className="text-[20px] font-kumbhBold text-text">
                  Create report
                </Text>
                <Text className="text-sm text-gray-500 mt-1 max-w-[200px] font-kumbh">
                  Generate detailed reports to track performance and make
                  informed decisions
                </Text>
              </View>
            </View>
            <ChevronRight size={22} color="#111827" />
          </View>
        </SectionCard>

        {/* Finance summary */}
        <SectionCard title="Finance Summary" className="mx-5 mt-6">
          <View className="rounded-2xl bg-primary-50 p-4">
            <View className="flex-row gap-4">
              <StatPill label="Receivables" value={N(finance.receivables)} />
              <StatPill label="Outflow" value={N(finance.outflow)} />
            </View>

            <View className="mt-4 flex-row gap-3">
              <FilterChip label="Today" />
              <FilterChip label="Oct 2025" />
            </View>
          </View>
        </SectionCard>

        {/* Team performance */}
        <SectionCard title="Team Performance" className="mx-5 mt-6">
          <View className="flex-row gap-4 items-center">
            <View className="w-24 h-24 rounded-2xl items-center justify-center">
              <Image
                source={require("@/assets/images/team-performance.png")}
                className="w-24 h-24"
              />
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
