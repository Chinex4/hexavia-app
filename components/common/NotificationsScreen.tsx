import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import {
    AlarmClock,
    AtSign,
    Briefcase,
    ChevronLeft,
    DollarSign,
    MessageSquare,
    Plus,
    Search,
    Users
} from "lucide-react-native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    Alert,
    Modal,
    Pressable,
    SectionList,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import {
    AppNotification,
    NotificationKind,
} from "@/redux/notifications/notification.types";
import { registerForPushNotificationsAsync } from "@/redux/notifications/notifications";
import { selectNotifications, selectNotificationsStatus } from "@/redux/notifications/notifications.slice";
import { fetchNotifications, sendMassNotification } from "@/redux/notifications/notifications.thunks";
import { selectUser } from "@/redux/user/user.slice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { StatusBar } from "expo-status-bar";

type TabKey = "all" | "channel" | "mass";

const TABS: { key: TabKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "channel", label: "Channel" },
  { key: "mass", label: "Mass" },
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
    case "channel":
      return <MessageSquare size={22} color="white" />;
    case "mass":
      return <Users size={22} color="white" />;
    default:
      return <Briefcase size={22} color="white" />;
  }
}

interface MassNotificationModalProps {
  visible: boolean;
  onClose: () => void;
  onSend: (title: string, message: string) => void;
}

function MassNotificationModal({ visible, onClose, onSend }: MassNotificationModalProps) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (!title.trim() || !message.trim()) {
      Alert.alert("Error", "Please fill in both title and message");
      return;
    }
    onSend(title.trim(), message.trim());
    setTitle("");
    setMessage("");
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-white rounded-t-3xl p-6">
          <Text className="text-xl font-bold mb-4">Send Mass Notification</Text>
          <TextInput
            placeholder="Notification Title"
            value={title}
            onChangeText={setTitle}
            className="border border-gray-300 rounded-lg p-3 mb-3"
          />
          <TextInput
            placeholder="Notification Message"
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={4}
            className="border border-gray-300 rounded-lg p-3 mb-4 h-24"
          />
          <View className="flex-row justify-end space-x-3">
            <TouchableOpacity onPress={onClose} className="px-4 py-2">
              <Text className="text-gray-600">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSend} className="px-4 py-2 bg-blue-500 rounded-lg">
              <Text className="text-white font-semibold">Send</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function NotificationsScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const notifications = useAppSelector(selectNotifications);
  const status = useAppSelector(selectNotificationsStatus);

  const [tab, setTab] = useState<TabKey>("all");
  const [query, setQuery] = useState("");
  const [modalVisible, setModalVisible] = useState(false);

  const notifListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  useEffect(() => {
    (async () => {
      await registerForPushNotificationsAsync();
      notifListener.current = Notifications.addNotificationReceivedListener(
        (n) => {
          const data = n.request.content.data as
            | Partial<AppNotification>
            | undefined;
          // Append a new notification (fallbacks)
          const newNotif: AppNotification = {
            id: String(Date.now()),
            kind: (data?.kind as NotificationKind) || "channel",
            title: data?.title || n.request.content.title || "New Update",
            message: data?.message || n.request.content.body || "",
            createdAt: new Date().toISOString(),
          };
          dispatch({ type: 'notifications/addNotification', payload: newNotif });
        }
      );
    })();
    return () => {
      notifListener.current?.remove();
    };
  }, [dispatch]);

  // Filter by tab + search
  const filtered = useMemo(() => {
    const base = notifications.filter((n) => {
      const okTab =
        tab === "all"
          ? true
          : tab === "channel"
            ? n.kind === "channel"
            : tab === "mass"
              ? n.kind === "mass"
              : true;

      const q = query.trim().toLowerCase();
      const okQ =
        !q ||
        n.title.toLowerCase().includes(q) ||
        n.message.toLowerCase().includes(q);
      return okTab && okQ;
    });

    // Project into sections by day bucket
    const map = new Map<string, AppNotification[]>();
    base.forEach((n) => {
      const label = dateBucketLabel(new Date(n.createdAt));
      if (!map.has(label)) map.set(label, []);
      map.get(label)!.push(n);
    });

    return Array.from(map.entries()).map(([title, data]) => ({
      title,
      data,
    }));
  }, [notifications, tab, query]);

  const handleSendMass = (title: string, message: string) => {
    dispatch(sendMassNotification({ title, message }));
  };

  const isAdmin = user?.role === "admin";

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />

      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200">
        <Pressable onPress={() => router.back()} className="p-2">
          <ChevronLeft size={24} color="#374151" />
        </Pressable>
        <Text className="text-lg font-semibold">Notifications</Text>
        <View className="w-10" />
      </View>

      {/* Search */}
      <View className="px-4 py-3 border-b border-gray-200">
        <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
          <Search size={20} color="#6B7280" />
          <TextInput
            placeholder="Search notifications..."
            value={query}
            onChangeText={setQuery}
            className="flex-1 ml-2 text-base"
          />
        </View>
      </View>

      {/* Tabs */}
      <View className="flex-row px-4 py-2 border-b border-gray-200">
        {TABS.map((t) => (
          <Pressable
            key={t.key}
            onPress={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg mr-2 ${
              tab === t.key ? "bg-blue-500" : "bg-gray-100"
            }`}
          >
            <Text
              className={`font-medium ${
                tab === t.key ? "text-white" : "text-gray-700"
              }`}
            >
              {t.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* List */}
      <SectionList
        sections={filtered}
        keyExtractor={(item) => item.id}
        renderSectionHeader={({ section: { title } }) => (
          <View className="bg-gray-50 px-4 py-2">
            <Text className="text-sm font-medium text-gray-600">{title}</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <View className="flex-row items-start px-4 py-3 border-b border-gray-100">
            <View className="w-10 h-10 rounded-full bg-blue-500 items-center justify-center mr-3">
              {iconFor(item.kind)}
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-base mb-1">{item.title}</Text>
              <Text className="text-gray-600 mb-1">{item.message}</Text>
              <Text className="text-xs text-gray-500">{timeAgo(item.createdAt)}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-12">
            <Text className="text-gray-500 text-center">
              {status === "loading" ? "Loading..." : "No notifications found"}
            </Text>
          </View>
        }
      />

      {/* FAB for Admin */}
      {isAdmin && (
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          className="absolute bottom-6 right-6 w-14 h-14 bg-blue-500 rounded-full items-center justify-center shadow-lg"
        >
          <Plus size={24} color="white" />
        </TouchableOpacity>
      )}

      <MassNotificationModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSend={handleSendMass}
      />
    </View>
  );
}