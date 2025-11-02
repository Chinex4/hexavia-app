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

/* ───────── Expenses (existing) ───────── */
import { fetchFinance } from "@/redux/finance/finance.thunks";
import {
  selectFinanceRecords,
  selectFinancePagination,
  selectFinanceSummary,
  selectFinanceListLoading,
  selectFinanceFilters,
} from "@/redux/finance/finance.selectors";
import {
  setFinanceFilters,
  setFinancePage,
} from "@/redux/finance/finance.slice";

/* ───────── Clients (for Receivables) ───────── */
import { fetchClients } from "@/redux/client/client.thunks";
import {
  selectAllClients,
  selectClientPagination,
  selectClientFilters,
  selectClientsLoading,
} from "@/redux/client/client.selectors";

type Flow = "Receivables" | "Expenses";

type Txn = {
  id: string;
  title: "Expense" | "Receive";
  amount: number;
  time: string;
  status: "Successful" | "Pending";
  description: string;
  dir: "up" | "down";
  dateKey: string;
  kind: "expense" | "receivable";
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
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
function dateBucket(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const today = new Date();
  const yday = new Date(today);
  yday.setDate(today.getDate() - 1);
  if (isSameYMD(d, today)) return "Today";
  if (isSameYMD(d, yday)) return "Yesterday";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function FinanceIndex() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  /* Expenses state (existing) */
  const records = useAppSelector(selectFinanceRecords);
  const financePagination = useAppSelector(selectFinancePagination);
  const summary = useAppSelector(selectFinanceSummary);
  const financeLoading = useAppSelector(selectFinanceListLoading);
  const financeFilters = useAppSelector(selectFinanceFilters);

  /* Clients for Receivables */
  const clients = useAppSelector(selectAllClients);
  const clientsPagination = useAppSelector(selectClientPagination);
  const clientsLoading = useAppSelector(selectClientsLoading);
  const clientFilters = useAppSelector(selectClientFilters);

  const [tab, setTab] = useState<Flow>("Receivables");
  const [hidden, setHidden] = useState(false);

  /* Totals */
  const total = useMemo(() => {
    if (tab === "Receivables") {
      const sum = (clients || []).reduce(
        (acc, c: any) => acc + Number(c?.payableAmount || 0),
        0
      );
      return sum;
    }
    // Expenses: keep your existing summary behavior
    return summary?.totalExpenses || 0;
  }, [summary, tab, clients]);

  /* Section builder */
  const sections = useMemo(() => {
    if (tab === "Receivables") {
      const txns: Txn[] = (clients || [])
        .filter((c: any) => Number(c?.payableAmount || 0) > 0)
        .sort(
          (a: any, b: any) =>
            new Date(b?.createdAt || 0).getTime() -
            new Date(a?.createdAt || 0).getTime()
        )
        .map((c: any) => ({
          id: c._id,
          title: "Receive",
          amount: Number(c?.payableAmount || 0),
          time: formatTime(c?.createdAt || ""),
          description: String(c?.name || "Unnamed client"),
          status: "Pending",
          dir: "down",
          dateKey: dateBucket(c?.createdAt || ""),
          kind: "receivable", // <- new
        }));

      const map = new Map<string, Txn[]>();
      txns.forEach((t) => {
        const key = t.dateKey || "—";
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(t);
      });

      return Array.from(map.entries()).map(([title, data]) => ({
        title,
        data,
      }));
    }

    // Expenses
    const txns: Txn[] = (records || [])
      .filter((r) => r.type === "expense")
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .map((r) => ({
        id: r._id,
        title: "Expense",
        amount: r.amount,
        time: formatTime(r.date),
        description: String(r.description ?? ""), // <- force string
        status: "Successful",
        dir: "up",
        dateKey: dateBucket(r.date),
        kind: "expense", // <- new
      }));

    const map = new Map<string, Txn[]>();
    txns.forEach((t) => {
      if (!map.has(t.dateKey)) map.set(t.dateKey, []);
      map.get(t.dateKey)!.push(t);
    });

    return Array.from(map.entries()).map(([title, data]) => ({ title, data }));
  }, [tab, clients, records]);

  /* First load + tab switching */
  useEffect(() => {
    if (tab === "Receivables") {
      // fetch clients list (first page)
      dispatch(
        fetchClients({
          page: clientFilters?.page ?? 1,
          limit: clientFilters?.limit ?? 20,
          sortOrder: clientFilters?.sortOrder ?? "desc",
        }) as any
      );
    } else {
      // fetch expenses (first page)
      dispatch(
        setFinanceFilters({
          type: "expense",
          page: 1,
          limit: 20,
        })
      );
      dispatch(
        fetchFinance({
          type: "expense",
          page: 1,
          limit: 20,
        }) as any
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, dispatch]);

  /* Refresh */
  const onRefresh = useCallback(() => {
    if (tab === "Receivables") {
      if (clientsLoading) return;
      dispatch(
        fetchClients({
          page: 1,
          limit: clientFilters?.limit ?? 20,
          sortOrder: clientFilters?.sortOrder ?? "desc",
        }) as any
      );
    } else {
      if (financeLoading) return;
      dispatch(setFinancePage(1));
      dispatch(
        fetchFinance({
          ...financeFilters,
          type: "expense",
          page: 1,
        }) as any
      );
    }
  }, [
    tab,
    clientsLoading,
    clientFilters,
    financeLoading,
    financeFilters,
    dispatch,
  ]);

  /* Infinite load */
  const loadMore = useCallback(() => {
    if (tab === "Receivables") {
      if (clientsLoading || !clientsPagination) return;
      const { currentPage, totalPages } = clientsPagination;
      if (currentPage >= totalPages) return;
      const next = currentPage + 1;
      dispatch(
        fetchClients({
          page: next,
          limit: clientFilters?.limit ?? 20,
          sortOrder: clientFilters?.sortOrder ?? "desc",
        }) as any
      );
      return;
    }

    // Expenses load more
    if (financeLoading || !financePagination) return;
    const { currentPage, totalPages } = financePagination;
    if (currentPage >= totalPages) return;
    const next = currentPage + 1;
    dispatch(setFinancePage(next));
    dispatch(
      fetchFinance({
        ...financeFilters,
        type: "expense",
        page: next,
      }) as any
    );
  }, [
    tab,
    clientsLoading,
    clientsPagination,
    clientFilters,
    financeLoading,
    financePagination,
    financeFilters,
    dispatch,
  ]);

  const refreshing =
    tab === "Receivables"
      ? clientsLoading && (clientFilters?.page ?? 1) === 1
      : financeLoading && financeFilters.page === 1;

  const canLoadMore =
    tab === "Receivables"
      ? !!clientsPagination &&
        clientsPagination.currentPage < clientsPagination.totalPages
      : !!financePagination &&
        financePagination.currentPage < financePagination.totalPages;

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
          <TabButton
            label="Receivables"
            active={tab === "Receivables"}
            onPress={() => setTab("Receivables")}
          />
          <TabButton
            label="Expenses"
            active={tab === "Expenses"}
            onPress={() => setTab("Expenses")}
          />
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
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReachedThreshold={0.2}
        onEndReached={loadMore}
        renderSectionHeader={({ section: { title } }) => (
          <Text className="px-5 py-3 text-gray-500 font-kumbh">{title}</Text>
        )}
        ItemSeparatorComponent={() => (
          <View className="h-[1px] bg-gray-200 ml-[76px]" />
        )}
        renderItem={({ item }) => (
          <TxnRow
            item={item}
            onPress={() =>
              item.kind === "expense"
                ? router.push(`/(admin)/finance/${item.id}`)
                : router.push(`/(admin)/finance/receivables/${item.id}`)
            }
          />
        )}
        ListFooterComponent={
          canLoadMore ? (
            <Text className="text-center text-gray-400 font-kumbh my-3">
              Loading more…
            </Text>
          ) : null
        }
        stickySectionHeadersEnabled
      />

      {/* Floating button */}
      <Pressable
        onPress={() =>
          tab === "Receivables"
            ? router.push("/(admin)/clients/installments")
            : router.push("/(admin)/finance/form")
        }
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

/* ───────── UI bits ───────── */

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

function TxnRow({
  item,
  onPress,
}: {
  item: Txn;
  onPress: () => void; // <- new
}) {
  const iconBg = "bg-blue-500";
  const isPending = item.status === "Pending";
  return (
    <Pressable onPress={onPress} className="px-5 py-3 flex-row items-center">
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
          numberOfLines={1}
        >
          {item.description}
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
    </Pressable>
  );
}
