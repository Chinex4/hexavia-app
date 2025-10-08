import React, { useMemo } from "react";
import {
  View,
  Text,
  SectionList,
  Pressable,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, ArrowUp, Plus } from "lucide-react-native";

type FinanceRecord = {
  id: string;
  amount: number;
  date: string; // ISO
  description: string;
  status: "successful" | "failed";
  kind: "expense" | "income";
};

// ---- Mock data (swap to API later) ----
const MOCK: FinanceRecord[] = [
  // Today
  {
    id: "t1",
    amount: 2861384.05,
    date: new Date().toISOString(),
    description: "Jonathan Payment",
    status: "successful",
    kind: "expense",
  },
  {
    id: "t2",
    amount: 2861384.05,
    date: new Date().toISOString(),
    description: "Ops",
    status: "successful",
    kind: "expense",
  },
  // Yesterday
  {
    id: "y1",
    amount: 2861384.05,
    date: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    description: "Stationery",
    status: "successful",
    kind: "expense",
  },
  // Dec 19, 2024 (two rows)
  {
    id: "d1",
    amount: 2861384.05,
    date: new Date("2024-12-19T10:00:00Z").toISOString(),
    description: "Fuel",
    status: "successful",
    kind: "expense",
  },
  {
    id: "d2",
    amount: 2861384.05,
    date: new Date("2024-01-01T10:00:00Z").toISOString(),
    description: "Software",
    status: "successful",
    kind: "expense",
  },
];

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

// Today / Yesterday / Dec 19th, 2024
const sectionTitle = (d: Date) => {
  const today = new Date();
  const yd = new Date();
  yd.setDate(today.getDate() - 1);

  const same = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (same(d, today)) return "Today";
  if (same(d, yd)) return "Yesterday";

  const day = d.getDate();
  const suffix =
    day % 10 === 1 && day !== 11
      ? "st"
      : day % 10 === 2 && day !== 12
      ? "nd"
      : day % 10 === 3 && day !== 13
      ? "rd"
      : "th";
  const month = d.toLocaleString("en-US", { month: "short" });
  return `${month} ${day}${suffix}, ${d.getFullYear()}`;
};

export default function FinanceIndex() {
  const router = useRouter();

  const sections = useMemo(() => {
    // group by title
    const buckets = new Map<string, FinanceRecord[]>();
    for (const r of MOCK) {
      const key = sectionTitle(new Date(r.date));
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key)!.push(r);
    }
    // ensure Today, Yesterday first
    const order = ["Today", "Yesterday"];
    const namedFirst = order
      .filter((k) => buckets.has(k))
      .map((k) => ({ title: k, data: buckets.get(k)! }));
    const others = [...buckets.entries()]
      .filter(([k]) => !order.includes(k))
      .sort(([a], [b]) => (new Date(b) as any) - (new Date(a) as any)) // loose
      .map(([title, data]) => ({ title, data }));
    return [...namedFirst, ...others];
  }, []);

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
        <Text className="text-3xl font-kumbhBold text-[#111827]">
          Recorded Expenses
        </Text>
      </View>

      {/* List */}
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderSectionHeader={({ section }) => (
          <Text className="px-5 pt-3 pb-2 text-[14px] text-gray-500 font-kumbh">
            {section.title}
          </Text>
        )}
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              router.push(`/(admin)/finance/${encodeURIComponent(item.id)}`)
            }
            className="px-5 py-3"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-12">
                <View className="w-9 h-9 rounded-full bg-[#6676BE] items-center justify-center">
                  <ArrowUp size={18} color="#fff" />
                </View>
                <View>
                  <Text className="text-[16px] font-kumbhBold text-[#111827]">
                    Expense
                  </Text>
                  <Text className="text-[13px] text-green-600 font-kumbh">
                    Successful
                  </Text>
                </View>
              </View>

              <View className="items-end">
                <Text className="text-[15px] font-kumbhBold text-[#111827]">
                  {NGN(item.amount)}
                </Text>
                <Text className="text-[12px] text-gray-500 font-kumbh">
                  {dmy(item.date)}
                </Text>
              </View>
            </View>
            <View className="h-[1px] bg-gray-200 mt-6" />
          </Pressable>
        )}
        contentContainerStyle={{ paddingBottom: 120 }}
      />

      {/* Floating button */}
      <Pressable
        onPress={() => router.push("/(admin)/finance/form")}
        className="absolute right-5 bottom-6 px-4 h-12 rounded-2xl bg-[#4C5FAB] flex-row items-center"
        style={{ paddingHorizontal: 16 }}
      >
        <View className="w-6 h-6 rounded-full bg-white/15 items-center justify-center mr-2">
          <Plus size={16} color="#fff" />
        </View>
        <Text className="text-white font-kumbhBold">Record Expenses</Text>
      </Pressable>
    </SafeAreaView>
  );
}
