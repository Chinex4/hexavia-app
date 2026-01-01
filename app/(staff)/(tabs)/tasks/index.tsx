import FabCreate from "@/components/staff/tasks/FabCreate";
import SearchBar from "@/components/staff/tasks/SearchBar";
import StatusCard from "@/components/staff/tasks/StatusCard";
import StatusTabs from "@/components/staff/tasks/StatusTabs";
import TaskCard from "@/components/staff/tasks/TaskCard";
import CreateTaskModal from "@/components/staff/tasks/modals/CreateTaskModal";
import FilterModal, {
  FilterState,
} from "@/components/staff/tasks/modals/FIlterModal";
import { STATUS_META, StatusKey, Task } from "@/features/staff/types";
import { selectAllPersonalTasks } from "@/redux/personalTasks/personalTasks.selectors";
import {
  deletePersonalTask,
  fetchPersonalTasks,
} from "@/redux/personalTasks/personalTasks.thunks";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { StatusBar } from "expo-status-bar";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { fromApiStatus } from "@/features/client/statusMap";
import { selectAllChannels, selectMyChannelsByUserId } from "@/redux/channels/channels.selectors";
import {
  fetchChannelById,
  fetchChannels,
} from "@/redux/channels/channels.thunks";
import { selectUser } from "@/redux/user/user.slice";
import { Trash2 } from "lucide-react-native";

// ===== stable time normalizer & comparator =====
function normalizeCreatedAt(t: any): number {
  if (typeof t?.createdAt === "number") return t.createdAt;
  if (t?.createdAt) {
    const d = new Date(t.createdAt).getTime();
    if (!Number.isNaN(d)) return d;
  }
  if (typeof t?.updatedAt === "number") return t.updatedAt;
  if (t?.updatedAt) {
    const d = new Date(t.updatedAt).getTime();
    if (!Number.isNaN(d)) return d;
  }
  const oid = String(t?._id ?? t?.id ?? "");
  if (/^[a-f\d]{24}$/i.test(oid)) {
    const seconds = parseInt(oid.slice(0, 8), 16);
    if (!Number.isNaN(seconds)) return seconds * 1000;
  }
  return 0; // stable fallback (never Date.now)
}

function byCreatedAtDescThenId(a: Task, b: Task) {
  const ad = a.createdAt || 0;
  const bd = b.createdAt || 0;
  if (bd !== ad) return bd - ad;
  return String(a.id).localeCompare(String(b.id));
}

// ===== per-call throttling helpers =====
const THROTTLE_MS = 10_000; // avoid per-channel refetching within 10s

export default function TaskScreen() {
  const dispatch = useAppDispatch();

  const user = useAppSelector(selectUser);
  const role = (user?.role || "").toLowerCase();
  const hidePersonal = role === "client"; // clients cannot see personal

  const userId = user?._id ?? null;

  // ---- call guards / refs ----
  const didInitRef = useRef(false);
  const isRefreshingRef = useRef(false);
  const fetching = useRef({
    channels: false,
    personal: false,
  });
  const fetchedPersonalOnceRef = useRef(false);
  const channelFetchInFlight = useRef<Set<string>>(new Set());
  const channelLastFetchedAt = useRef<Map<string, number>>(new Map());

  // ---- initial channels fetch (once) ----
  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;

    if (!fetching.current.channels) {
      fetching.current.channels = true;
      dispatch(fetchChannels())
        .finally(() => {
          fetching.current.channels = false;
        })
        .catch(() => {});
    }
  }, [dispatch]);

  // Channels derived for this user
  const myChannels = useAppSelector(selectAllChannels);

  // Fetch channel details (tasks) when needed, with throttle & dedupe
  useEffect(() => {
    if (!Array.isArray(myChannels) || myChannels.length === 0) return;

    myChannels.forEach((c: any) => {
      const id = String(c?._id ?? c?.id ?? "");
      if (!id) return;

      const tasksMissing = !Array.isArray(c?.tasks) || c.tasks.length === 0;
      if (!tasksMissing) return;

      // throttle & de-dupe
      const now = Date.now();
      const lastAt = channelLastFetchedAt.current.get(id) ?? 0;
      const withinThrottle = now - lastAt < THROTTLE_MS;
      const inFlight = channelFetchInFlight.current.has(id);

      if (withinThrottle || inFlight) return;

      channelFetchInFlight.current.add(id);
      channelLastFetchedAt.current.set(id, now);
      dispatch(fetchChannelById(id))
        .finally(() => {
          channelFetchInFlight.current.delete(id);
        })
        .catch(() => {});
    });
  }, [dispatch, myChannels]);

  // Personal (skip entirely for clients), guarded so it doesn't spam
  useEffect(() => {
    if (hidePersonal) return;
    if (fetching.current.personal) return;
    if (fetchedPersonalOnceRef.current) return;

    fetching.current.personal = true;
    dispatch(fetchPersonalTasks())
      .finally(() => {
        fetching.current.personal = false;
        fetchedPersonalOnceRef.current = true;
      })
      .catch(() => {});
  }, [dispatch, hidePersonal]);

  // ---- UI state ----
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<StatusKey>("in-progress");
  const [showCreate, setShowCreate] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [filters, setFilters] = useState<FilterState>({
    mode: hidePersonal ? "channel" : "all", // clients forced to "channel"
    channelCode: "",
    statuses: [],
  });

  // If role flips to client while open, force channel-only filters
  useEffect(() => {
    if (hidePersonal) {
      setFilters((f) => ({ ...f, mode: "channel" }));
    }
  }, [hidePersonal]);

  const onRefresh = useCallback(async () => {
    if (isRefreshingRef.current) return;
    isRefreshingRef.current = true;
    setRefreshing(true);
    try {
      // refetch channels once
      if (!fetching.current.channels) {
        fetching.current.channels = true;
        await dispatch(fetchChannels()).finally(() => {
          fetching.current.channels = false;
        });
      }

      // refetch only channels that need details, with throttle
      const ids = (myChannels || [])
        .map((c: any) => String(c?._id ?? c?.id))
        .filter(Boolean);

      await Promise.all(
        ids.map(async (id: any) => {
          const now = Date.now();
          const lastAt = channelLastFetchedAt.current.get(id) ?? 0;
          const withinThrottle = now - lastAt < THROTTLE_MS;
          const inFlight = channelFetchInFlight.current.has(id);
          if (withinThrottle || inFlight) return;

          channelFetchInFlight.current.add(id);
          channelLastFetchedAt.current.set(id, now);
          try {
            await dispatch(fetchChannelById(id)).unwrap();
          } catch {
          } finally {
            channelFetchInFlight.current.delete(id);
          }
        })
      );

      if (!hidePersonal && !fetching.current.personal) {
        fetching.current.personal = true;
        await dispatch(fetchPersonalTasks()).finally(() => {
          fetching.current.personal = false;
          fetchedPersonalOnceRef.current = true;
        });
      }
    } finally {
      setRefreshing(false);
      isRefreshingRef.current = false;
    }
  }, [dispatch, myChannels, hidePersonal]);

  // ---- map to Task[] with stable timestamps ----
  const channelTasks: Task[] = useMemo(() => {
    if (!Array.isArray(myChannels)) return [];
    const out: Task[] = [];
    myChannels.forEach((ch: any) => {
      const code = ch?.name ?? ""; // or ch?.code
      const tasks = Array.isArray(ch?.tasks) ? ch.tasks : [];
      tasks.forEach((t: any) => {
        out.push({
          id: String(t?._id ?? t?.id),
          title: String(t?.name ?? t?.title ?? "Untitled task"),
          description: t?.description ?? null,
          status: fromApiStatus(t?.status),
          channelCode: code,
          channelId: ch?._id
            ? String(ch._id)
            : ch?.id
              ? String(ch.id)
              : undefined,
          createdAt: normalizeCreatedAt(t),
        });
      });
    });
    return out.sort(byCreatedAtDescThenId);
  }, [myChannels]);

  // Personal list (empty for clients)
  const personal = useAppSelector(selectAllPersonalTasks);
  const personalTasks: Task[] = useMemo(() => {
    if (hidePersonal) return [];
    return personal.map((t: any) => ({
      id: t.id,
      title: t.title,
      description: t.description as any,
      status: t.status as StatusKey,
      channelCode: "personal",
      channelId: "personal",
      createdAt:
        typeof t.createdAt === "number"
          ? t.createdAt
          : t.createdAt
            ? new Date(t.createdAt).getTime()
            : 0,
    }));
  }, [personal, hidePersonal]);

  const merged: Task[] = useMemo(() => {
    const all = hidePersonal
      ? [...channelTasks]
      : [...channelTasks, ...personalTasks];
    return all.sort(byCreatedAtDescThenId); // single deterministic sort
  }, [channelTasks, personalTasks, hidePersonal]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let base = merged;

    if (filters.mode === "channel")
      base = base.filter((t) => t.channelCode !== "personal");
    else if (filters.mode === "personal")
      base = base.filter((t) => t.channelCode === "personal");

    if (filters.channelCode)
      base = base.filter((t) => t.channelCode === filters.channelCode);
    if (filters.statuses.length)
      base = base.filter((t) => filters.statuses.includes(t.status));

    if (q) {
      base = base.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.description || "").toLowerCase().includes(q)
      );
    }

    return base.filter((t) => t.status === active);
  }, [merged, active, query, filters]);

  const confirmDelete = useCallback(
    (task: Task) => {
      if (task.channelCode !== "personal") return;

      Alert.alert(
        "Delete task?",
        "This personal task will be permanently removed.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              try {
                await dispatch(deletePersonalTask({ id: task.id })).unwrap();
              } catch (e: any) {
                Alert.alert(
                  "Delete failed",
                  e?.message || "Unable to delete task. Please try again."
                );
              }
            },
          },
        ]
      );
    },
    [dispatch]
  );

  const Header = (
    <>
      <SearchBar
        value={query}
        onChangeText={setQuery}
        onFilterPress={() => setShowFilter(true)}
      />
      <View className="px-4 mt-6">
        <View className="flex-row" style={{ gap: 8 }}>
          <View style={{ flex: 1, gap: 8 }}>
            <StatusCard status="in-progress" />
            <StatusCard status="completed" />
          </View>
          <View style={{ flex: 1, gap: 8 }}>
            <StatusCard status="not-started" />
            <StatusCard status="canceled" />
          </View>
        </View>
      </View>
      <StatusTabs active={active} onChange={setActive} />
      <View className="px-5 mt-6">
        <View className="rounded-2xl border border-[#E5E7EB] p-5">
          <Text className="font-kumbh text-[#6B7280]">
            Showing tasks:{" "}
            <Text className="text-[#111827]">{STATUS_META[active].title}</Text>
          </Text>

          {hidePersonal ? (
            <Text className="font-kumbh text-[12px] text-[#9CA3AF] mt-1">
              Tip: Use Filter to narrow by{" "}
              <Text className="text-[#4C5FAB]">Channel</Text> or a specific{" "}
              <Text className="text-[#4C5FAB]">Project Code</Text>.
            </Text>
          ) : (
            <Text className="font-kumbh text-[12px] text-[#9CA3AF] mt-1">
              Tip: Use Filter ➜ Mode (
              <Text className="text-[#4C5FAB]">Personal</Text> or{" "}
              <Text className="text-[#4C5FAB]">Channel</Text>) or filter by a
              specific <Text className="text-[#4C5FAB]">Project Code</Text>.
            </Text>
          )}
        </View>
      </View>
    </>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <FlatList
        contentContainerStyle={{ paddingBottom: 140 }}
        data={filtered}
        keyExtractor={(i) => i.id}
        ListHeaderComponent={Header}
        renderItem={({ item }) => (
          <View className="px-5 mt-3">
            {!hidePersonal && (
              <View className="flex-row items-center mb-2">
                <Text
                  className="font-kumbh text-[11px] px-2 py-[2px] rounded-full"
                  style={{
                    backgroundColor:
                      item.channelCode === "personal" ? "#E1F5FE" : "#EEF2FF",
                    color:
                      item.channelCode === "personal" ? "#01579B" : "#3730A3",
                  }}
                >
                  {item.channelCode === "personal"
                    ? "Personal"
                    : item.channelCode}
                </Text>
              </View>
            )}
            <View style={{ position: "relative" }}>
              {!hidePersonal && item.channelCode === "personal" && (
                <Pressable
                  onPress={() => confirmDelete(item)}
                  hitSlop={10}
                  style={{
                    position: "absolute",
                    right: 8,
                    top: 8,
                    zIndex: 10,
                    padding: 6,
                    borderRadius: 999,
                    backgroundColor: "#FEE2E2",
                  }}
                >
                  <Trash2 size={18} color="#B91C1C" />
                </Pressable>
              )}
              <TaskCard task={item} />
            </View>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={
          <View className="px-5 mt-3">
            <Text className="font-kumbh text-[#9CA3AF]">
              No tasks yet in this category.
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#4C5FAB"
            colors={["#4C5FAB"]}
          />
        }
      />

      <FabCreate onPress={() => setShowCreate(true)} />
      <CreateTaskModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
      />

      <FilterModal
        visible={showFilter}
        initial={filters}
        hidePersonal={hidePersonal}
        onClose={() => setShowFilter(false)}
        onApply={(f) => {
          setFilters(f);
          setShowFilter(false);
        }}
      />
    </SafeAreaView>
  );
}
