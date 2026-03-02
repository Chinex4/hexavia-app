import { useRouter } from "expo-router";
import {
  BarChart3,
  Bell,
  ChevronRight,
  FolderKanban,
  UserPlus,
  Users,
} from "lucide-react-native";
import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AdminHeader from "@/components/admin/AdminHeader";
import BotpressFab from "@/components/common/BotpressFab";
import SectionCard from "@/components/admin/SectionCard";
import Tile from "@/components/admin/Tile";

export default function AdminDashboard() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1 bg-background" contentContainerClassName="pb-8">
        <AdminHeader
          title="Hi Hexavia!"
          subtitleBadge="Admin"
          rightIcon={<Bell size={20} color="#111827" />}
          onRightPress={() => router.push("/(admin)/notifications")}
        />

        <View className="px-5 gap-2">
          <View className="flex-row gap-2">
            <Tile
              title="Clients"
              icon={<Users size={22} color="white" />}
              onPress={() => router.push("/(admin)/(tabs)/client")}
            />
            <Tile
              title="Projects"
              icon={<UserPlus size={22} color="white" />}
              onPress={() => router.push("/(admin)/(tabs)/project")}
            />
          </View>
          <View className="flex-row gap-2">
            <Tile
              title="Team"
              icon={<FolderKanban size={22} color="white" />}
              onPress={() => router.push("/(admin)/(tabs)/team")}
            />
            <Tile
              title="Finance"
              icon={<BarChart3 size={22} color="white" />}
              onPress={() => router.push("/(admin)/finance")}
            />
          </View>
          <View className="flex-row gap-2">
            <Tile
              title="Prospects"
              icon={<FolderKanban size={22} color="white" />}
              onPress={() => router.push("/(admin)/prospects")}
            />
          </View>
        </View>

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

        <SectionCard
          title="Deleted Clients"
          className="mx-5 mt-6"
          onPress={() => router.push("/(admin)/clients/deleted")}
        >
          <View className="flex-row items-center gap-3">
            <View className="flex-1">
              <Text className="text-sm text-gray-600 font-kumbh">
                Review clients that were removed from the system.
              </Text>
              <Text className="text-sm text-gray-500 mt-1 font-kumbh">
                Tap to open the deleted client log.
              </Text>
            </View>
            <ChevronRight size={20} color="#111827" />
          </View>
        </SectionCard>

        <SectionCard
          title="Deleted Projects"
          className="mx-5 mt-4"
          onPress={() => router.push("/(admin)/channels/deleted")}
        >
          <View className="flex-row items-center gap-3">
            <View className="flex-1">
              <Text className="text-sm text-gray-600 font-kumbh">
                Review channels/projects that were removed from the workspace.
              </Text>
              <Text className="text-sm text-gray-500 mt-1 font-kumbh">
                Tap to open the deleted project log.
              </Text>
            </View>
            <ChevronRight size={20} color="#111827" />
          </View>
        </SectionCard>
      </ScrollView>
      <BotpressFab title="Hexavia Assistant" />
    </SafeAreaView>
  );
}
