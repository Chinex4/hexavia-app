// app/(admin)/clients/installments.tsx
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Plus } from "lucide-react-native";
import clsx from "clsx";

import Field from "@/components/admin/Field";
import SectionTitle from "@/components/admin/SectionTitle";
import Dropdown from "@/components/admin/Dropdown";
import Menu from "@/components/admin/Menu";
import MenuItem from "@/components/admin/MenuItem";

type PlanRow = { amount: string; due: string };

const ENGAGEMENTS = ["Core Consulting", "Design & Build", "Advisory"];
const PROJECTS = ["Project Alpha", "Project Beta", "HomeLet Revamp"];

const N = (v: number | string) => {
  const n = typeof v === "string" ? Number(String(v).replace(/[^\d]/g, "")) : v;
  if (!Number.isFinite(n)) return "₦ 0";
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(n);
};

export default function ClientInstallments() {
  const router = useRouter();

  // Header fields (dummy defaults to match screenshot)
  const [name, setName] = useState("Adebayo Moda Ibrahim");
  const [project, setProject] = useState("Project Alpha");
  const [engagement, setEngagement] = useState("Core Consulting");

  // Menus
  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const [showEngagementMenu, setShowEngagementMenu] = useState(false);

  // Amount summary
  const [totalAmount, setTotalAmount] = useState("60000");
  const [amountPaid, setAmountPaid] = useState("48000");

  // Installment plan rows
  const [rows, setRows] = useState<PlanRow[]>([
    { amount: "5000", due: "01/02/2025" },
    { amount: "", due: "" },
  ]);

  const remaining = useMemo(() => {
    const total = Number(totalAmount || 0);
    const paid = Number(amountPaid || 0);
    return Math.max(total - paid, 0);
  }, [totalAmount, amountPaid]);

  const updateRow = (idx: number, patch: Partial<PlanRow>) => {
    setRows((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], ...patch };
      return copy;
    });
  };

  const addRow = () => setRows((p) => [...p, { amount: "", due: "" }]);

  const handleSave = () => {
    // wire this later:
    // dispatch(saveInstallmentPlan({ name, project, engagement, totalAmount, amountPaid, rows }))
    // For now just log:
    console.log({
      name,
      project,
      engagement,
      totalAmount,
      amountPaid,
      remaining,
      schedule: rows,
    });
  };

  const FilledInput = ({
    value,
    onChangeText,
    placeholder,
    keyboardType = "default",
    className,
    prefix,
  }: {
    value: string;
    onChangeText: (t: string) => void;
    placeholder?: string;
    keyboardType?: "default" | "numeric";
    className?: string;
    prefix?: string;
  }) => (
    <View
      className={clsx("w-full rounded-2xl bg-gray-100 px-4 py-3", className)}
    >
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        keyboardType={keyboardType}
        className="font-kumbh text-[16px] text-[#111827]"
      />
      {prefix ? null : null}
    </View>
  );

  const Labeled = ({
    label,
    children,
    className,
  }: {
    label: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <View className={clsx("mb-4", className)}>
      <Text className="mb-2 text-[13px] text-gray-700 font-kumbh">{label}</Text>
      {children}
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="px-5 pt-6 pb-3 flex-row items-center justify-between">
        <View className="flex-row items-center gap-4">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full items-center justify-center"
          >
            <ArrowLeft size={24} color="#111827" />
          </Pressable>
          <Text className="text-[22px] font-kumbhBold text-[#111827]">
            Installment Payment
          </Text>
        </View>
        <Pressable
          onPress={handleSave}
          className="px-5 py-3 rounded-2xl bg-[#4C5FAB] active:opacity-90"
        >
          <Text className="text-white font-kumbhBold">Save</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.select({ ios: "padding", android: "height" })}
        keyboardVerticalOffset={
          Platform.select({ ios: 8, android: 0 }) as number
        }
      >
        <ScrollView className="flex-1" contentContainerClassName="px-5 pb-10">
          {/* Name */}
          <Labeled label="Name">
            <FilledInput
              value={name}
              onChangeText={setName}
              placeholder="Enter name"
            />
          </Labeled>

          {/* Project Name */}
          <Labeled label="Project Name">
            <Dropdown
              value={project}
              open={showProjectMenu}
              onToggle={() => setShowProjectMenu((s) => !s)}
            />
            {showProjectMenu && (
              <Menu>
                {PROJECTS.map((p) => (
                  <MenuItem
                    key={p}
                    active={p === project}
                    onPress={() => {
                      setProject(p);
                      setShowProjectMenu(false);
                    }}
                  >
                    {p}
                  </MenuItem>
                ))}
              </Menu>
            )}
          </Labeled>

          {/* Engagement */}
          <Labeled label="Engagement">
            <Dropdown
              value={engagement}
              open={showEngagementMenu}
              onToggle={() => setShowEngagementMenu((s) => !s)}
            />
            {showEngagementMenu && (
              <Menu>
                {ENGAGEMENTS.map((e) => (
                  <MenuItem
                    key={e}
                    active={e === engagement}
                    onPress={() => {
                      setEngagement(e);
                      setShowEngagementMenu(false);
                    }}
                  >
                    {e}
                  </MenuItem>
                ))}
              </Menu>
            )}
          </Labeled>

          {/* Amounts row */}
          <View className="flex-row gap-3 mt-2">
            <Labeled label="Total Amount" className="flex-1">
              <FilledInput
                value={N(totalAmount)}
                onChangeText={(t) => setTotalAmount(t.replace(/[^\d]/g, ""))}
                placeholder="₦ 0"
                keyboardType="numeric"
              />
            </Labeled>
            <Labeled label="Amount Paid" className="flex-1">
              <FilledInput
                value={N(amountPaid)}
                onChangeText={(t) => setAmountPaid(t.replace(/[^\d]/g, ""))}
                placeholder="₦ 0"
                keyboardType="numeric"
              />
            </Labeled>
          </View>

          {/* Installment Plan */}
          <SectionTitle className="mt-4">Installment Plan</SectionTitle>

          {/* First row (as in screenshot) */}
          {rows.map((row, idx) => (
            <View
              key={idx}
              className={clsx("flex-row gap-3", idx > 0 ? "mt-3" : "mt-3")}
            >
              <Labeled label="Payable Amount" className="flex-1">
                <FilledInput
                  value={
                    row.amount
                      ? `₦ ${Number(row.amount).toLocaleString("en-NG")}`
                      : ""
                  }
                  onChangeText={(t) =>
                    updateRow(idx, { amount: t.replace(/[^\d]/g, "") })
                  }
                  placeholder="₦ 5,000"
                  keyboardType="numeric"
                />
              </Labeled>
              <Labeled label="Date due" className="flex-1">
                <FilledInput
                  value={row.due}
                  onChangeText={(t) => updateRow(idx, { due: t })}
                  placeholder="DD/MM/YYYY"
                />
              </Labeled>
            </View>
          ))}

          {/* Add button bar */}
          <Pressable
            onPress={addRow}
            className="mt-6 h-14 rounded-2xl bg-[#4C5FAB] flex-row items-center justify-center active:opacity-90"
          >
            <Plus size={18} color="#fff" />
            <Text className="ml-2 text-white font-kumbhBold">Add</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
