import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  FlatList,
  Platform,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  Bell,
  ClipboardCheck,
  ChevronDown,
  Save,
} from "lucide-react-native";

import { useAppSelector } from "@/store/hooks";
import { selectAdminUsers } from "@/redux/admin/admin.slice";
// (kept import to avoid breaking, not used in this file now)
import { selectAllChannels } from "@/redux/channels/channels.slice";

type AdminUser = {
  _id: string;
  email: string;
  fullname?: string;
  username?: string;
  role: "client" | "staff" | "admin" | "super-admin";
  isSuspended?: boolean;
  createdAt?: string;
  projectName?: string;
  industry?: string;
  staffSize?: number | string;
  description?: string;
  problems?: string;
  engagement?: string;
  deliverables?: string;
  payableAmount?: number;
  status?: "Active" | "Pending" | "Closed";
};

const BG_INPUT = "#F7F9FC";
const BORDER = "#E5E7EB";
const PRIMARY = "#4C5FAB";

const STATUS_OPTIONS: AdminUser["status"][] = ["Active", "Pending", "Closed"];

/* ----------------------------- UI bits ----------------------------- */
function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text className="font-kumbh text-[13px] text-[#111827] mb-2">
      {children}
    </Text>
  );
}

function Input({
  value,
  onChangeText,
  placeholder = "—",
  multiline = false,
  keyboardType,
}: {
  value?: string | number | null;
  onChangeText: (t: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: "default" | "numeric";
}) {
  return (
    <TextInput
      value={value == null ? "" : String(value)}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#9CA3AF"
      multiline={multiline}
      keyboardType={keyboardType}
      className="rounded-2xl px-4 py-3 font-kumbh text-[#111827]"
      style={{
        backgroundColor: BG_INPUT,
        minHeight: multiline ? 64 : undefined,
      }}
    />
  );
}

function TwoCol({ children }: { children: React.ReactNode }) {
  return (
    <View className="flex-row" style={{ gap: 12 }}>
      {children}
    </View>
  );
}

function PillButton({
  icon,
  label,
  onPress,
  variant = "primary",
}: {
  icon: React.ReactNode;
  label: string;
  onPress?: () => void;
  variant?: "primary" | "outline";
}) {
  const isPrimary = variant === "primary";
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-center rounded-2xl px-4 py-4"
      style={{
        backgroundColor: isPrimary ? PRIMARY : "transparent",
        borderWidth: isPrimary ? 0 : 1,
        borderColor: isPrimary ? "transparent" : PRIMARY,
        gap: 10,
      }}
      android_ripple={{ color: "#ffffff20" }}
    >
      <View
        className="w-7 h-7 rounded-full items-center justify-center"
        style={{
          backgroundColor: isPrimary ? "rgba(255,255,255,0.2)" : "transparent",
        }}
      >
        {icon}
      </View>
      <Text
        className="font-kumbh text-[16px]"
        style={{ color: isPrimary ? "#fff" : PRIMARY }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function formatMoneyNaira(v?: number) {
  if (typeof v !== "number" || !isFinite(v)) return "₦ 0.00";
  try {
    return (
      "₦ " +
      new Intl.NumberFormat("en-NG", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(v)
    );
  } catch {
    return `₦ ${v.toFixed(2)}`;
  }
}
function parseMoney(input: string): number {
  // strip non-digits except dot/comma
  const cleaned = input.replace(/[₦,\s]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}
function formatDate(d?: string) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString();
  } catch {
    return d;
  }
}

/* ------------------------------ Screen ------------------------------ */
export default function ClientDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const users = useAppSelector(selectAdminUsers);
  useAppSelector(selectAllChannels); // kept (no usage yet), safe for future

  const fallbackUser: AdminUser = {
    _id: String(id ?? "unknown"),
    email: "unknown@example.com",
    fullname: "Unknown User",
    username: "unknown",
    role: "client",
    isSuspended: false,
    createdAt: new Date().toISOString(),
    projectName: "Ogba  Milk App",
    industry: "Food",
    staffSize: 12,
    description: "All good",
    problems: "A lot",
    engagement: "Core Consulting",
    deliverables: "UI Screens",
    payableAmount: 240573.04,
    status: "Active",
  };

  const baseUser = useMemo(() => {
    if (!id) return fallbackUser;
    const found = users.find((u) => u._id === id);
    return { ...fallbackUser, ...found } as AdminUser;
  }, [users, id]);

  // Form state
  const [name, setName] = useState(
    baseUser.fullname || baseUser.username || baseUser.email || ""
  );
  const [projectName, setProjectName] = useState(baseUser.projectName ?? "");
  const [industry, setIndustry] = useState(baseUser.industry ?? "");
  const [staffSize, setStaffSize] = useState(String(baseUser.staffSize ?? ""));
  const [description, setDescription] = useState(baseUser.description ?? "");
  const [problems, setProblems] = useState(baseUser.problems ?? "");
  const [engagement, setEngagement] = useState(baseUser.engagement ?? "");
  const [deliverables, setDeliverables] = useState(baseUser.deliverables ?? "");
  const [payable, setPayable] = useState(
    formatMoneyNaira(baseUser.payableAmount)
  );
  const [status, setStatus] = useState<AdminUser["status"]>(
    baseUser.status ?? "Active"
  );
  const [statusOpen, setStatusOpen] = useState(false);

  // recompute “dirty” (has changes)
  const dirty = useMemo(() => {
    const basePay = formatMoneyNaira(baseUser.payableAmount);
    const baseName =
      baseUser.fullname || baseUser.username || baseUser.email || "";
    return (
      name !== baseName ||
      projectName !== (baseUser.projectName ?? "") ||
      industry !== (baseUser.industry ?? "") ||
      staffSize !== String(baseUser.staffSize ?? "") ||
      description !== (baseUser.description ?? "") ||
      problems !== (baseUser.problems ?? "") ||
      engagement !== (baseUser.engagement ?? "") ||
      deliverables !== (baseUser.deliverables ?? "") ||
      payable !== basePay ||
      status !== (baseUser.status ?? "Active")
    );
  }, [
    baseUser,
    name,
    projectName,
    industry,
    staffSize,
    description,
    problems,
    engagement,
    deliverables,
    payable,
    status,
  ]);

  // When the baseUser changes (navigating quickly), reset form
  useEffect(() => {
    setName(baseUser.fullname || baseUser.username || baseUser.email || "");
    setProjectName(baseUser.projectName ?? "");
    setIndustry(baseUser.industry ?? "");
    setStaffSize(String(baseUser.staffSize ?? ""));
    setDescription(baseUser.description ?? "");
    setProblems(baseUser.problems ?? "");
    setEngagement(baseUser.engagement ?? "");
    setDeliverables(baseUser.deliverables ?? "");
    setPayable(formatMoneyNaira(baseUser.payableAmount));
    setStatus(baseUser.status ?? "Active");
  }, [baseUser._id]); // eslint-disable-line react-hooks/exhaustive-deps

  const joined = formatDate(baseUser.createdAt);

  const onSave = () => {
    // Build payload for API (later)
    const payload = {
      id: baseUser._id,
      fullname: name.trim(),
      projectName: projectName.trim(),
      industry: industry.trim(),
      staffSize: Number(staffSize) || 0,
      description: description.trim(),
      problems: problems.trim(),
      engagement: engagement.trim(),
      deliverables: deliverables.trim(),
      payableAmount: parseMoney(payable),
      status,
    };
    console.log("[ClientDetails] save", payload);
    Alert.alert("Saved (mock)", "Payload logged to console.");
    router.back(); // or keep on page; change to taste
  };

  return (
    <SafeAreaView
      className="flex-1 bg-white"
      style={{ paddingTop: Platform.select({ ios: 8, android: 0 }) }}
    >
      {/* Header */}
      <View className="px-5 pt-4 pb-2 flex-row items-center justify-between">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full items-center justify-center"
        >
          <ArrowLeft size={24} color="#111827" />
        </Pressable>

        <Text className="text-[22px] font-kumbhBold text-[#111827]">
          Client Details
        </Text>

        <Pressable
          disabled={!dirty}
          onPress={onSave}
          className="w-10 h-10 rounded-full items-center justify-center"
          style={{ opacity: dirty ? 1 : 0.4 }}
        >
          <Save size={22} color={dirty ? PRIMARY : "#9CA3AF"} />
        </Pressable>
      </View>

      <KeyboardAvoidingWidget>
        <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
          <View className="px-5 mt-3">
            {/* Name */}
            <FieldLabel>Name</FieldLabel>
            <Input value={name} onChangeText={setName} />

            {/* Project Name */}
            <View className="mt-4">
              <FieldLabel>Project Name</FieldLabel>
              <Input value={projectName} onChangeText={setProjectName} />
            </View>

            {/* Industry | Staff Size */}
            <View className="mt-4">
              <TwoCol>
                <View style={{ flex: 1 }}>
                  <FieldLabel>Industry</FieldLabel>
                  <Input value={industry} onChangeText={setIndustry} />
                </View>
                <View style={{ flex: 1 }}>
                  <FieldLabel>Staff Size</FieldLabel>
                  <Input
                    value={staffSize}
                    onChangeText={setStaffSize}
                    keyboardType="numeric"
                  />
                </View>
              </TwoCol>
            </View>

            {/* Description */}
            <View className="mt-4">
              <FieldLabel>Description</FieldLabel>
              <Input
                value={description}
                onChangeText={setDescription}
                multiline
              />
            </View>

            {/* Problems Faced */}
            <View className="mt-4">
              <FieldLabel>Problems Faced</FieldLabel>
              <Input value={problems} onChangeText={setProblems} multiline />
            </View>

            {/* Engagement Offered */}
            <View className="mt-4">
              <FieldLabel>Engagement Offered</FieldLabel>
              <Input value={engagement} onChangeText={setEngagement} />
            </View>

            {/* Deliverables */}
            <View className="mt-4">
              <FieldLabel>Deliverables</FieldLabel>
              <Input value={deliverables} onChangeText={setDeliverables} />
            </View>

            {/* Payable Amount | Status */}
            <View className="mt-4">
              <TwoCol>
                <View style={{ flex: 1 }}>
                  <FieldLabel>Payable Amount</FieldLabel>
                  <Input
                    value={payable}
                    onChangeText={(t) => {
                      // allow free typing, but keep currency look
                      const n = parseMoney(t);
                      setPayable(formatMoneyNaira(n));
                    }}
                    keyboardType="numeric"
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <FieldLabel>Status</FieldLabel>
                  <Pressable
                    onPress={() => setStatusOpen(true)}
                    className="rounded-2xl px-4 py-3 flex-row items-center justify-between"
                    style={{ backgroundColor: BG_INPUT, borderColor: BORDER }}
                  >
                    <Text className="font-kumbh text-[#111827]">{status}</Text>
                    <ChevronDown size={18} color="#111827" />
                  </Pressable>
                </View>
              </TwoCol>
            </View>

            {/* tiny footer note */}
            <View className="items-center mt-3">
              <Text className="text-[12px] text-[#6B7280] font-kumbh">
                Generate Invoice
              </Text>
            </View>

            {/* Extra (not in screenshot) */}
            <View className="mt-6">
              <FieldLabel>Joined</FieldLabel>
              <Input value={joined} onChangeText={() => {}} />
            </View>

            {/* Buttons row (kept like screenshot) */}
            <View className="mt-6 flex-row" style={{ gap: 12 }}>
              <View style={{ flex: 1 }}>
                <PillButton
                  variant="outline"
                  icon={<Bell size={16} color={PRIMARY} />}
                  label="Send Invoice"
                  onPress={() => {}}
                />
              </View>
              <View style={{ flex: 1 }}>
                <PillButton
                  variant="primary"
                  icon={<ClipboardCheck size={16} color="#fff" />}
                  label="Client Installment"
                  onPress={() => {}}
                />
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingWidget>

      {/* Status picker modal */}
      <Modal
        transparent
        visible={statusOpen}
        animationType="fade"
        onRequestClose={() => setStatusOpen(false)}
      >
        <Pressable
          onPress={() => setStatusOpen(false)}
          className="flex-1 bg-black/30"
        >
          <View className="absolute left-5 right-5 bottom-8 rounded-2xl bg-white p-4">
            <Text className="font-kumbhBold text-[#111827] mb-2">
              Select Status
            </Text>
            <FlatList
              data={STATUS_OPTIONS}
              keyExtractor={(s, i) => (s ? String(s) : `status-${i}`)}
              ItemSeparatorComponent={() => (
                <View style={{ height: 1, backgroundColor: "#EEF0F3" }} />
              )}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    setStatus(item);
                    setStatusOpen(false);
                  }}
                  className="py-3"
                >
                  <Text className="font-kumbh text-[#111827]">{item}</Text>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

/* ----------------------- helpers ----------------------- */
function KeyboardAvoidingWidget({ children }: { children: React.ReactNode }) {
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.select({ ios: "padding", android: undefined })}
      keyboardVerticalOffset={Platform.select({ ios: 70, android: 0 }) ?? 0}
    >
      {children}
    </KeyboardAvoidingView>
  );
}
