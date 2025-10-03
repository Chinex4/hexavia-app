import React, { useMemo } from "react";
import { View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, CalendarCheck2 } from "lucide-react-native";

const DUMMY = {
  cl_001: {
    name: "Adebayo Moda Ibrahim",
    business: "Project HomeLet",
    engagement: "Project HomeLet",
    amountPaid: "₦ 0.00",
    description: "Project HomeLet",
    date: "20/01/2034",
  },
  cl_002: {
    name: "Chiamaka O. Benson",
    business: "Nexa Retail",
    engagement: "Marketing Landing",
    amountPaid: "₦ 250,000.00",
    description: "Landing page & analytics",
    date: "18/02/2034",
  },
} as const;

export default function ClientDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const data = useMemo(
    () => DUMMY[id as keyof typeof DUMMY] ?? DUMMY["cl_001"],
    [id]
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="px-5 pt-6 pb-4 flex-row items-center gap-4">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full items-center justify-center"
        >
          <ArrowLeft size={24} color="#111827" />
        </Pressable>
        <Text className="text-3xl font-kumbhBold text-text">
          Client Details
        </Text>
      </View>

      {/* Details grid */}
      <View className="px-6 mt-4">
        <DetailRow label="Name:" value={data.name} />
        <DetailRow label="Business" value={data.business} />
        <DetailRow label="Engagement" value={data.engagement} />
        <DetailRow label="Amount Paid" value={data.amountPaid} />
        <DetailRow label="Description" value={data.description} />
        <DetailRow label="Date" value={data.date} />
      </View>

      {/* Action */}
      <View className="px-6 mt-8">
        <Pressable onPress={() => router.push('/(admin)/clients/installments')} className="flex-row items-center justify-center gap-3 bg-primary-50 border border-primary-200 rounded-2xl py-4">
          <View className="w-6 h-6 rounded-md bg-white items-center justify-center">
            <CalendarCheck2 size={16} color="#4c5fab" />
          </View>
          <Text className="text-base font-kumbhBold text-text">
            Client Installment Payment
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between py-4">
      <Text className="text-base text-gray-700 font-kumbh">{label}</Text>
      <Text className="text-base text-text font-kumbhBold">{value}</Text>
    </View>
  );
}
