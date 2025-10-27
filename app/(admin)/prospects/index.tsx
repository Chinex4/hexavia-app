// app/(admin)/prospects/index.tsx
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Filter as FilterIcon,
  Plus,
  Search,
} from "lucide-react-native";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  selectAllClients,
  selectClientsLoading,
  selectClientPagination,
  selectClientFilters,
} from "@/redux/client/client.selectors";
import { fetchClients } from "@/redux/client/client.thunks";
import { setClientFilters } from "@/redux/client/client.slice";
import type { Client, ClientFilters } from "@/redux/client/client.types";

const ENGAGEMENT_OPTS = ["Full-time", "Part-time", "Contract"] as const;
const SORTBY_OPTS = ["createdAt", "payableAmount"] as const;
const ORDER_OPTS = ["desc", "asc"] as const;
const LIMIT_OPTS = [10, 20, 50, 100] as const;

function useDebounced<T>(value: T, ms: number) {
  const [deb, setDeb] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDeb(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return deb;
}

export default function ProspectsIndex() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const clients = useAppSelector(selectAllClients);
  const loading = useAppSelector(selectClientsLoading);
  const pagination = useAppSelector(selectClientPagination);
  const filters = useAppSelector(selectClientFilters);

  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [query, setQuery] = useState("");

  const [form, setForm] = useState<ClientFilters>({
    status: "pending",
    industry: undefined,
    engagement: undefined,
    sortBy: "createdAt",
    sortOrder: "desc",
    limit: 10,
    page: 1,
  });

  useEffect(() => {
    const enforced: ClientFilters = {
      ...filters,
      status: "pending",
      sortBy: (filters.sortBy as any) ?? "createdAt",
      sortOrder: filters.sortOrder ?? "desc",
      limit: filters.limit ?? 10,
      page: filters.page ?? 1,
    };

    setForm(enforced);

    if (filters.status !== "pending") {
      dispatch(setClientFilters({ ...enforced, page: 1 }));
    }
  }, [dispatch]);

  const fetchKey = JSON.stringify({
    status: "pending",
    industry: filters.industry,
    engagement: filters.engagement,
    page: filters.page,
    limit: filters.limit,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
  });
  const debouncedKey = useDebounced(fetchKey, 300);
  const lastKeyRef = useRef<string>("");

  useEffect(() => {
    if (debouncedKey && debouncedKey !== lastKeyRef.current) {
      lastKeyRef.current = debouncedKey;
      dispatch(fetchClients({ ...filters, status: "pending" }));
    }
  }, [debouncedKey, dispatch]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await dispatch(fetchClients({ ...filters, status: "pending" })).unwrap();
      lastKeyRef.current = fetchKey;
    } finally {
      setRefreshing(false);
    }
  }, [dispatch, filters, fetchKey]);

  const list = useMemo(() => {
    const base = clients;
    if (!query.trim()) return base;
    const q = query.trim().toLowerCase();
    return base.filter((c: any) =>
      [
        c.name,
        c.projectName,
        c.industry,
        c.status,
        String(c.payableAmount ?? ""),
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [clients, query]);

  const canPrev = (pagination?.currentPage ?? 1) > 1;
  const canNext =
    (pagination?.currentPage ?? 1) < (pagination?.totalPages ?? 1);

  const gotoPage = (page: number) => {
    const next = { ...filters, page, status: "pending" as const };
    if (page !== (filters.page ?? 1)) dispatch(setClientFilters(next));
  };

  const dynamicIndustryOpts = useMemo(() => {
    const set = new Set<string>();
    clients.forEach((c: any) => c.industry && set.add(c.industry));
    const arr = Array.from(set);
    if (arr.length === 0)
      return ["Technology", "Finance", "Health", "Education", "Other"];
    return arr;
  }, [clients]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="px-5 pt-6 pb-4">
        <View className="flex-row items-center justify-between gap-4">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full items-center justify-center"
          >
            <ArrowLeft size={24} color="#111827" />
          </Pressable>

          <Text className="text-3xl font-kumbh text-text">
            Hexavia Prospects
          </Text>

          <Pressable
            onPress={() => setShowFilters(true)}
            className="w-10 h-10 rounded-full items-center justify-center"
          >
            <FilterIcon size={22} color="#111827" />
          </Pressable>
        </View>

        {/* Search + Add */}
        <View className="mt-5 flex-row items-center gap-3">
          <View className="flex-1 flex-row items-center gap-2 bg-white border border-gray-200 rounded-2xl px-3 h-12">
            <Search size={18} color="#6B7280" />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search name, project, industry"
              className="flex-1 text-[15px] font-kumbh text-gray-800"
              returnKeyType="search"
            />
          </View>

          <Pressable
            onPress={() => router.push("/(admin)/prospects/create" as any)}
            className="flex-row items-center gap-2 bg-primary-50 border border-primary-100 rounded-2xl px-4 h-12"
          >
            <Plus size={18} color="#111827" />
            <Text className="text-sm font-kumbh text-text">Add</Text>
          </Pressable>
        </View>

        {/* Tabs removed — status is locked to "pending" */}
      </View>

      {loading && clients.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
          <Text className="mt-2 text-gray-500 font-kumbh">
            Loading prospects…
          </Text>
        </View>
      ) : (
        <>
          <FlatList
            data={list}
            keyExtractor={(item) => item._id}
            contentContainerClassName="px-5 pb-24"
            keyboardShouldPersistTaps="handled"
            removeClippedSubviews
            initialNumToRender={10}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ItemSeparatorComponent={() => (
              <View className="h-[1px] bg-gray-200 my-4" />
            )}
            renderItem={({ item }) => (
              <ClientRow
                item={item}
                onPress={(id) =>
                  router.push({
                    pathname: "/(admin)/clients/[id]",
                    params: { id },
                  })
                }
              />
            )}
            ListEmptyComponent={
              <View className="px-5 py-16">
                <Text className="text-center text-gray-500 font-kumbh">
                  No prospects found.
                </Text>
              </View>
            }
          />

          {pagination && pagination.totalPages > 1 && (
            <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-5 py-3">
              <View className="flex-row items-center justify-between">
                <Pressable
                  disabled={!canPrev}
                  onPress={() => gotoPage((pagination.currentPage ?? 1) - 1)}
                  className={`px-4 py-2 rounded-xl border ${canPrev ? "bg-white" : "bg-gray-100"}`}
                >
                  <Text
                    className={`font-kumbh ${canPrev ? "text-gray-800" : "text-gray-400"}`}
                  >
                    Prev
                  </Text>
                </Pressable>

                <Text className="font-kumbh text-gray-700">
                  Page {pagination.currentPage} / {pagination.totalPages} •{" "}
                  {pagination.totalClients} prospects
                </Text>

                <Pressable
                  disabled={!canNext}
                  onPress={() => gotoPage((pagination.currentPage ?? 1) + 1)}
                  className={`px-4 py-2 rounded-xl border ${canNext ? "bg-white" : "bg-gray-100"}`}
                >
                  <Text
                    className={`font-kumbh ${canNext ? "text-gray-800" : "text-gray-400"}`}
                  >
                    Next
                  </Text>
                </Pressable>
              </View>
            </View>
          )}
        </>
      )}

      <FilterModalProspects
        open={showFilters}
        form={form}
        industryOptions={dynamicIndustryOpts}
        onClose={() => setShowFilters(false)}
        onChange={(patch) =>
          setForm((f) => ({ ...f, ...patch, status: "pending" }))
        }
        onApply={() => {
          const next: ClientFilters = {
            ...filters,
            ...form,
            status: "pending",
            page: 1,
          };
          if (JSON.stringify(next) !== JSON.stringify(filters)) {
            dispatch(setClientFilters(next));
          }
          setShowFilters(false);
        }}
        onClear={() => {
          const cleared: ClientFilters = {
            page: 1,
            limit: 10,
            sortOrder: "desc",
            sortBy: "createdAt",
            status: "pending",
            industry: undefined,
            engagement: undefined,
          };
          if (JSON.stringify(cleared) !== JSON.stringify(filters)) {
            dispatch(setClientFilters(cleared));
          }
          setShowFilters(false);
        }}
      />
    </SafeAreaView>
  );
}

function ClientRow({
  item,
  onPress,
}: {
  item: Client;
  onPress: (id: string) => void;
}) {
  const name = item.name || "Unknown";
  const badgeText = item.status ? capitalize(item.status) : "—";
  const badgeStyle =
    item.status === "completed"
      ? "bg-green-100 text-green-700"
      : item.status === "pending"
        ? "bg-yellow-100 text-yellow-700"
        : item.status === "current"
          ? "bg-blue-100 text-blue-700"
          : "bg-gray-100 text-gray-700";

  return (
    <Pressable onPress={() => onPress(item._id)} className="py-1">
      <Row label="Name" value={name} />
      <Row label="Project" value={item.projectName ?? "—"} />
      <Row label="Industry" value={item.industry ?? "—"} />
      <Row label="Engagement" value={item.engagement ?? "—"} />
      <Row label="Payable" value={formatMoney(item.payableAmount)} />
      <View className="flex-row items-center justify-between py-2">
        <Text className="text-base text-gray-700 font-kumbh">Status</Text>
        <View className={`px-3 py-1 rounded-full ${badgeStyle}`}>
          <Text className="text-xs font-kumbhBold">{badgeText}</Text>
        </View>
      </View>
    </Pressable>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between py-2">
      <Text className="text-base text-gray-700 font-kumbh">{label}</Text>
      <Text className="text-base text-text font-kumbhBold">{value}</Text>
    </View>
  );
}

function FilterModalProspects({
  open,
  form,
  industryOptions,
  onClose,
  onChange,
  onApply,
  onClear,
}: {
  open: boolean;
  form: ClientFilters;
  industryOptions: string[];
  onClose: () => void;
  onChange: (patch: Partial<ClientFilters>) => void;
  onApply: () => void;
  onClear: () => void;
}) {
  return (
    <Modal
      visible={open}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/30">
        <View className="mt-auto bg-white rounded-t-3xl p-5">
          <View className="items-center mb-4">
            <View className="w-12 h-1.5 bg-gray-300 rounded-full" />
          </View>
          <Text className="text-xl font-kumbhBold text-gray-900 mb-3">
            Filter Prospects
          </Text>

          {/* Status intentionally omitted (always pending) */}

          <Field label="Industry">
            <PillGroup
              options={["Any", ...industryOptions]}
              value={form.industry ?? "Any"}
              onChange={(v) =>
                onChange({ industry: v === "Any" ? undefined : v })
              }
              scrollable
            />
          </Field>

          <Field label="Engagement">
            <PillGroup
              options={["Any", ...ENGAGEMENT_OPTS]}
              value={form.engagement ?? "Any"}
              onChange={(v) =>
                onChange({ engagement: v === "Any" ? undefined : v })
              }
            />
          </Field>

          <Field label="Sort by">
            <PillGroup
              options={[...SORTBY_OPTS]}
              value={(form.sortBy as any) ?? "createdAt"}
              onChange={(v) => onChange({ sortBy: v as any })}
            />
          </Field>

          <Field label="Order">
            <PillGroup
              options={[...ORDER_OPTS]}
              value={form.sortOrder ?? "desc"}
              onChange={(v) => onChange({ sortOrder: v as "asc" | "desc" })}
            />
          </Field>

          <Field label="Limit">
            <PillGroup
              options={LIMIT_OPTS.map(String)}
              value={String(form.limit ?? 10)}
              onChange={(v) => onChange({ limit: parseInt(v, 10) })}
            />
          </Field>

          {/* Actions */}
          <View className="flex-row items-center justify-between mt-5">
            <Pressable
              onPress={onClear}
              className="px-4 py-3 rounded-2xl border border-gray-300"
            >
              <Text className="font-kumbh text-gray-700">Clear</Text>
            </Pressable>
            <View className="flex-row gap-3">
              <Pressable
                onPress={onClose}
                className="px-4 py-3 rounded-2xl border border-gray-300"
              >
                <Text className="font-kumbh text-gray-700">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={onApply}
                className="px-5 py-3 rounded-2xl bg-blue-600"
              >
                <Text className="font-kumbh text-white">Apply</Text>
              </Pressable>
            </View>
          </View>

          <View className="h-3" />
        </View>
      </View>
    </Modal>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View className="mb-3">
      <Text className="text-[13px] font-kumbh text-gray-600 mb-1">{label}</Text>
      {children}
    </View>
  );
}

function PillGroup({
  options,
  value,
  onChange,
  scrollable,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  scrollable?: boolean;
}) {
  const content = (
    <View className="flex-row flex-wrap gap-2">
      {options.map((opt) => {
        const active = opt === value;
        return (
          <Pressable
            key={opt}
            onPress={() => onChange(opt)}
            className={`px-3 py-2 rounded-full border ${
              active
                ? "bg-blue-600 border-blue-600"
                : "bg-white border-gray-300"
            }`}
          >
            <Text
              className={`text-xs font-kumbh ${active ? "text-white" : "text-gray-800"}`}
            >
              {opt}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  if (!scrollable) return content;

  return (
    <FlatList
      data={options}
      keyExtractor={(x) => x}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="gap-2"
      renderItem={({ item }) => {
        const active = item === value;
        return (
          <Pressable
            onPress={() => onChange(item)}
            className={`px-3 py-2 rounded-full border ${
              active
                ? "bg-blue-600 border-blue-600"
                : "bg-white border-gray-300"
            }`}
          >
            <Text
              className={`text-xs font-kumbh ${active ? "text-white" : "text-gray-800"}`}
            >
              {item}
            </Text>
          </Pressable>
        );
      }}
    />
  );
}

function capitalize(s?: string) {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function formatMoney(n?: number) {
  if (typeof n !== "number") return "—";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return String(n);
  }
}
