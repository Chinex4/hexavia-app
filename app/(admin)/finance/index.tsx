import React, { useMemo, useState } from "react";
import { View, Text, Pressable, SectionList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Eye, ArrowUp, ArrowDown } from "lucide-react-native";
import clsx from "clsx";

type Flow = "inflow" | "outflow";
type Txn = {
  id: string;
  title: "Withdrawal" | "Deposit";
  amount: number;
  time: string; // "3:15pm"
  status: "Successful" | "Pending";
  dir: "up" | "down";
};

const NGN = (n: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(n);

const SECTIONS: { title: string; data: Txn[] }[] = [
  {
    title: "Today",
    data: [
      {
        id: "t1",
        title: "Withdrawal",
        amount: 2861384.05,
        time: "3:15pm",
        status: "Successful",
        dir: "up",
      },
      {
        id: "t2",
        title: "Deposit",
        amount: 2861384.05,
        time: "3:15pm",
        status: "Successful",
        dir: "down",
      },
    ],
  },
  {
    title: "Yesterday",
    data: [
      {
        id: "y1",
        title: "Withdrawal",
        amount: 2861384.05,
        time: "3:15pm",
        status: "Successful",
        dir: "up",
      },
      {
        id: "y2",
        title: "Withdrawal",
        amount: 2861384.05,
        time: "3:15pm",
        status: "Pending",
        dir: "up",
      },
    ],
  },
  {
    title: "Dec 19th, 2024",
    data: [
      {
        id: "d1",
        title: "Withdrawal",
        amount: 2861384.05,
        time: "3:15pm",
        status: "Successful",
        dir: "up",
      },
      {
        id: "d2",
        title: "Deposit",
        amount: 2861384.05,
        time: "3:15pm",
        status: "Successful",
        dir: "down",
      },
    ],
  },
];

export default function FinanceIndex() {
  const router = useRouter();
  const [tab, setTab] = useState<Flow>("inflow");
  const [hidden, setHidden] = useState(false);

  const total = useMemo(
    () => (tab === "inflow" ? 240573.04 : 2000570.0),
    [tab]
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="px-5 pt-6 pb-3">
        <View className="flex-row items-center gap-4">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center"
          >
            <ArrowLeft size={24} color="#111827" />
          </Pressable>
          <Text className="text-3xl font-kumbhBold text-text">Finance</Text>
        </View>

        {/* Tabs */}
        <View className="mt-5 flex-row items-end justify-between">
          <View className="flex-1 items-center">
            <Pressable onPress={() => setTab("inflow")}>
              <Text
                className={clsx(
                  "font-kumbh text-base",
                  tab === "inflow"
                    ? "text-blue-500 font-kumbhBold"
                    : "text-text"
                )}
              >
                Inflow
              </Text>
            </Pressable>
            <View
              className={clsx(
                "h-[3px] w-40 rounded-full mt-2",
                tab === "inflow" ? "bg-blue-300" : "bg-transparent"
              )}
            />
          </View>
          <View className="flex-1 items-center">
            <Pressable onPress={() => setTab("outflow")}>
              <Text
                className={clsx(
                  "font-kumbh text-base",
                  tab === "outflow"
                    ? "text-blue-500 font-kumbhBold"
                    : "text-text"
                )}
              >
                Outflow
              </Text>
            </Pressable>
            <View
              className={clsx(
                "h-[3px] w-40 rounded-full mt-2",
                tab === "outflow" ? "bg-blue-300" : "bg-transparent"
              )}
            />
          </View>
        </View>
      </View>

      {/* Total card */}
      <View className="px-5 mt-2">
        <View className="rounded-[28px] bg-primary-500 px-6 py-7">
          <View className="flex-row items-center justify-center gap-2">
            <Text className="text-white/90 font-kumbh">Total Amount</Text>
            <Pressable
              onPress={() => setHidden((s) => !s)}
              className="opacity-90"
            >
              <Eye size={18} color="white" />
            </Pressable>
          </View>
          <Text className="mt-3 text-white text-4xl font-kumbhBold text-center tracking-wide">
            {hidden ? "••••••••" : NGN(total).replace("NGN", "₦")}
          </Text>
          <Text className="mt-2 text-white/90 font-kumbh text-center">
            {tab.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Sectioned list */}
      <SectionList
        className="mt-5"
        sections={SECTIONS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 24 }}
        renderSectionHeader={({ section: { title } }) => (
          <Text className="px-5 py-3 text-gray-500 font-kumbh">{title}</Text>
        )}
        ItemSeparatorComponent={() => (
          <View className="h-[1px] bg-gray-200 ml-[76px]" />
        )}
        renderItem={({ item }) => <TxnRow item={item} />}
      />
    </SafeAreaView>
  );
}

function TxnRow({ item }: { item: Txn }) {
  const iconBg = "bg-blue-500";
  const isPending = item.status === "Pending";
  return (
    <View className="px-5 py-3 flex-row items-center">
      <View
        className={clsx(
          "w-11 h-11 rounded-full items-center justify-center mr-4",
          iconBg
        )}
      >
        {item.dir === "up" ? (
          <ArrowUp size={18} color="#fff" />
        ) : (
          <ArrowDown size={18} color="#fff" />
        )}
      </View>

      <View className="flex-1">
        <Text className="text-base font-kumbhBold text-text">{item.title}</Text>
        <Text
          className={clsx(
            "mt-1 text-sm font-kumbh",
            isPending ? "text-yellow-600" : "text-green-600"
          )}
        >
          {item.status}
        </Text>
      </View>

      <View className="items-end">
        <Text className="text-base font-kumbhBold text-text">
          {NGN(item.amount)}
        </Text>
        <Text className="text-sm text-gray-500 font-kumbh mt-1">
          {item.time}
        </Text>
      </View>
    </View>
  );
}
