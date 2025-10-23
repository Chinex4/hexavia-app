// app/(admin)/finance/index.tsx
import clsx from "clsx";
import { useRouter } from "expo-router";
import { ArrowDown, ArrowLeft, ArrowUp, Eye, Plus } from "lucide-react-native";
import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  Pressable,
  SectionList,
  Text,
  View,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchFinance,
} from "@/redux/finance/finance.thunks";
import {
  selectFinanceRecords,
  selectFinancePagination,
  selectFinanceSummary,
  selectFinanceListLoading,
  selectFinanceFilters,
} from "@/redux/finance/finance.selectors";
import { setFinanceFilters, setFinancePage } from "@/redux/finance/finance.slice";

type Flow = "Receivables" | "Expenses";

type Txn = {
  id: string;
  title: "Withdrawal" | "Deposit";
  amount: number;
  time: string; // "3:15 PM"
  status: "Successful" | "Pending";
  dir: "up" | "down";
  dateKey: string; // bucket
};

const NGN = (n: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(n);

function formatTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  } catch {
    return "";
  }
}
function isSameYMD(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function dateBucket(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yday = new Date(today);
  yday.setDate(today.getDate() - 1);
  if (isSameYMD(d, today)) return "Today";
  if (isSameYMD(d, yday)) return "Yesterday";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function FinanceIndex() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const records = useAppSelector(selectFinanceRecords);
  const pagination = useAppSelector(selectFinancePagination);
  const summary = useAppSelector(selectFinanceSummary);
  const loading = useAppSelector(selectFinanceListLoading);
  const filters = useAppSelector(selectFinanceFilters);

  const [tab, setTab] = useState<Flow>("Receivables");
  const [hidden, setHidden] = useState(false);

  // Derived totals from API summary
  const total = useMemo(() => {
    if (!summary) return 0;
    return tab === "Receivables" ? (summary.totalReceivables || 0) : (summary.totalExpenses || 0);
  }, [summary, tab]);

  // Map server records -> UI Txn and section them
  const sections = useMemo(() => {
    // server `FinanceRecord`: { _id, type, amount, description, date }
    const txns: Txn[] = (records || [])
      .filter(r => (tab === "Receivables" ? r.type === "receivable" : r.type === "expense"))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .map(r => {
        const isReceivable = r.type === "receivable";
        return {
          id: r._id,
          title: isReceivable ? "Deposit" : "Withdrawal",
          amount: r.amount,
          time: formatTime(r.date),
          status: "Successful",
          dir: isReceivable ? "down" : "up",
          dateKey: dateBucket(r.date),
        } as Txn;
      });

    const map = new Map<string, Txn[]>();
    txns.forEach(t => {
      if (!map.has(t.dateKey)) map.set(t.dateKey, []);
      map.get(t.dateKey)!.push(t);
    });

    return Array.from(map.entries()).map(([title, data]) => ({ title, data }));
  }, [records, tab]);

  // Fetch on mount & whenever tab changes
  useEffect(() => {
    // reset to first page and set type filter
    dispatch(setFinanceFilters({
      type: tab === "Receivables" ? "receivable" : "expense",
      page: 1,
      limit: 20,
    }));
    dispatch(fetchFinance({
      type: tab === "Receivables" ? "receivable" : "expense",
      page: 1,
      limit: 20,
    }));
  }, [tab]);

  // Pull-to-refresh
  const onRefresh = useCallback(() => {
    if (loading) return;
    dispatch(setFinancePage(1));
    dispatch(fetchFinance({
      ...filters,
      type: tab === "Receivables" ? "receivable" : "expense",
      page: 1,
    }));
  }, [loading, filters, tab]);

  // Infinite scroll – load older pages (DESC)
  const loadMore = useCallback(() => {
    if (loading || !pagination) return;
    const { currentPage, totalPages } = pagination;
    if (currentPage >= totalPages) return;
    const next = currentPage + 1;
    dispatch(setFinancePage(next));
    dispatch(fetchFinance({
      ...filters,
      type: tab === "Receivables" ? "receivable" : "expense",
      page: next,
    }));
  }, [loading, pagination, filters, tab]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="px-5 pt-6 pb-3">
        <View className="flex-row items-center justify-between gap-4">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center"
          >
            <ArrowLeft size={24} color="#111827" />
          </Pressable>
        <Text className="text-3xl font-kumbh text-text">Finance</Text>
          <View className="w-10" />
        </View>

        {/* Tabs */}
        <View className="mt-5 flex-row items-end justify-between">
          <TabButton label="Receivables" active={tab === "Receivables"} onPress={() => setTab("Receivables")} />
          <TabButton label="Expenses" active={tab === "Expenses"} onPress={() => setTab("Expenses")} />
        </View>
      </View>

      {/* Total card */}
      <View className="px-5 mt-2">
        <View className="rounded-[28px] bg-primary-500 px-6 py-7">
          <View className="flex-row items-center justify-center gap-2">
            <Text className="text-white/90 font-kumbh">Total Amount</Text>
            <Pressable onPress={() => setHidden(s => !s)} className="opacity-90">
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
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={
          <RefreshControl refreshing={loading && (filters.page === 1)} onRefresh={onRefresh} />
        }
        onEndReachedThreshold={0.2}
        onEndReached={loadMore}
        renderSectionHeader={({ section: { title } }) => (
          <Text className="px-5 py-3 text-gray-500 font-kumbh">{title}</Text>
        )}
        ItemSeparatorComponent={() => <View className="h-[1px] bg-gray-200 ml-[76px]" />}
        renderItem={({ item }) => <TxnRow item={item} />}
        ListFooterComponent={
          pagination && pagination.currentPage < pagination.totalPages ? (
            <Text className="text-center text-gray-400 font-kumbh my-3">Loading more…</Text>
          ) : null
        }
        stickySectionHeadersEnabled
      />

      {/* Floating button */}
      <Pressable
        onPress={() => router.push("/(admin)/finance/form")}
        className="absolute right-5 bottom-10 px-4 h-12 rounded-2xl bg-[#4C5FAB] flex-row items-center"
        style={{ paddingHorizontal: 16 }}
      >
        <View className="w-6 h-6 rounded-full bg-white/15 items-center justify-center mr-2">
          <Plus size={16} color="#fff" />
        </View>
        <Text className="text-white font-kumbhBold">
          {tab === "Expenses" ? "Record Expense" : "Record Receivable"}
        </Text>
      </Pressable>
    </SafeAreaView>
  );
}

function TabButton({
  label,
  active,
  onPress,
}: {
  label: "Receivables" | "Expenses";
  active: boolean;
  onPress: () => void;
}) {
  return (
    <View className="flex-1 items-center">
      <Pressable onPress={onPress}>
        <Text
          className={clsx(
            "font-kumbh text-base",
            active ? "text-blue-500 font-kumbhBold" : "text-text"
          )}
        >
          {label}
        </Text>
      </Pressable>
      <View
        className={clsx(
          "h-[3px] w-40 rounded-full mt-2",
          active ? "bg-blue-300" : "bg-transparent"
        )}
      />
    </View>
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
