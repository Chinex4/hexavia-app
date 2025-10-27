import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  SectionList,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import {
  AtSign,
  Briefcase,
  AlarmClock,
  DollarSign,
  ChevronLeft,
  SlidersHorizontal,
  Search,
} from "lucide-react-native";
import * as Notifications from "expo-notifications";

import {
  AppNotification,
  seedNotifications,
  NotificationKind,
} from "@/redux/notifications/notification.types";
import { registerForPushNotificationsAsync } from "@/redux/notifications/notifications";
import { StatusBar } from "expo-status-bar";

type TabKey = "all" | "project" | "finance" | "mention";

const TABS: { key: TabKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "project", label: "Projects" },
  { key: "finance", label: "Finance" },
  { key: "mention", label: "Mention" },
];

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hours ago`;
  const days = Math.floor(hrs / 24);
  return `${days} days`;
}

function dateBucketLabel(date: Date) {
  const now = new Date();
  const one = 24 * 60 * 60 * 1000;
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  ).getTime();
  const startOfGiven = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  ).getTime();

  if (startOfGiven === startOfToday) return "Today";
  if (startOfToday - startOfGiven === one) return "Yesterday";

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function iconFor(kind: NotificationKind) {
  switch (kind) {
    case "project":
      return <Briefcase size={22} color="white" />;
    case "task":
      return <AlarmClock size={22} color="white" />;
    case "mention":
      return <AtSign size={22} color="white" />;
    case "finance":
      return <DollarSign size={22} color="white" />;
    default:
      return <Briefcase size={22} color="white" />;
  }
}

export default function NotificationsScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>("all");
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<AppNotification[]>(seedNotifications);

  const notifListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    (async () => {
      await registerForPushNotificationsAsync();
      notifListener.current = Notifications.addNotificationReceivedListener(
        (n) => {
          const data = n.request.content.data as
            | Partial<AppNotification>
            | undefined;
          // Append a new notification (fallbacks)
          setItems((prev) => [
            {
              id: String(Date.now()),
              kind: (data?.kind as NotificationKind) || "project",
              title: data?.title || n.request.content.title || "New Update",
              message: data?.message || n.request.content.body || "",
              createdAt: new Date().toISOString(),
            },
            ...prev,
          ]);
        }
      );
    })();
    return () => {
      notifListener.current?.remove();
    };
  }, []);

  // Filter by tab + search
  const filtered = useMemo(() => {
    const base = items.filter((n) => {
      const okTab =
        tab === "all"
          ? true
          : tab === "project"
            ? n.kind === "project" || n.kind === "task" // keep tasks under Projects tab (as per UI)
            : tab === "finance"
              ? n.kind === "finance"
              : tab === "mention"
                ? n.kind === "mention"
                : true;

      const q = query.trim().toLowerCase();
      const okQ =
        !q ||
        n.title.toLowerCase().includes(q) ||
        n.message.toLowerCase().includes(q);
      return okTab && okQ;
    });

    // Group into sections by day bucket
    const map = new Map<string, AppNotification[]>();
    base.forEach((n) => {
      const label = dateBucketLabel(new Date(n.createdAt));
      if (!map.has(label)) map.set(label, []);
      map.get(label)!.push(n);
    });

    const sections = Array.from(map.entries())
      .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime()) // Today/Yesterday keep natural order due to NaN, but we want Today first
      .map(([title, data]) => ({
        title,
        data: data.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ),
      }));

    // Ensure Today, Yesterday appear on top if present
    const today = sections.find((s) => s.title === "Today");
    const yest = sections.find((s) => s.title === "Yesterday");
    const rest = sections.filter(
      (s) => s.title !== "Today" && s.title !== "Yesterday"
    );
    return [today, yest, ...rest].filter(Boolean) as typeof sections;
  }, [items, tab, query]);

  return (
    <View
      className="flex-1 bg-white px-5 pt-12"
      style={{ paddingTop: Platform.select({ ios: 75, android: 60 }) }}
    >
      <StatusBar style="dark" />
      {/* Top bar */}
      <View className="flex-row items-center mb-4">
        <Pressable onPress={() => router.back()} className="p-2 -ml-2">
          <ChevronLeft size={26} color="#111" />
        </Pressable>
      <Text className="text-3xl font-kumbh font-semibold text-black">
        Notifications
      </Text>
      </View>


      {/* Search */}
      <View className="flex-row items-center bg-black/5 rounded-2xl px-4 h-12 mb-3">
        <Search size={18} color="#6b7280" />
        <TextInput
          placeholder="Search…"
          placeholderTextColor="#9CA3AF"
          className="ml-2 flex-1 text-base font-kumbh text-black"
          value={query}
          onChangeText={setQuery}
        />
      </View>

      {/* Tabs */}
      <View className="flex-row gap-x-6 mb-2">
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <Pressable
              key={t.key}
              onPress={() => setTab(t.key)}
              className="pb-2"
            >
              <Text
                className={`font-kumbh ${active ? "text-primary font-semibold" : "text-black/60"}`}
              >
                {t.label}
              </Text>
              <View
                className={`h-0.5 rounded-full ${active ? "bg-primary mt-1" : "bg-transparent"}`}
              />
            </Pressable>
          );
        })}
      </View>

      {/* List */}
      <SectionList
        sections={filtered}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        className="mt-2"
        renderSectionHeader={({ section: { title } }) => (
          <Text className="text-sm text-black/50 font-kumbh mt-4 mb-2">
            {title}
          </Text>
        )}
        renderItem={({ item }) => (
          <View className="flex-row items-center py-4 border-b border-black/5">
            <View className="w-12 h-12 rounded-full bg-primary items-center justify-center mr-4">
              {iconFor(item.kind)}
            </View>
            <View className="flex-1">
              <Text className="text-lg font-kumbh font-semibold text-black">
                {item.title}
              </Text>
              <Text className="text-black/60 font-kumbh" numberOfLines={1}>
                {item.message}
              </Text>
            </View>
            <View className="items-end ml-2">
              <Text className="text-black/60 font-kumbh text-sm">
                {timeAgo(item.createdAt)}
              </Text>
              {/* Optional right time text (like 3:15pm) – derive if you want */}
            </View>
          </View>
        )}
        ListFooterComponent={<View className="h-12" />}
      />
    </View>
  );
}
