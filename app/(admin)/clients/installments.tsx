// app/(admin)/clients/installments.tsx
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, ChevronDown } from "lucide-react-native";
import clsx from "clsx";
import Field from "@/components/admin/Field";
import SectionTitle from "@/components/admin/SectionTitle";
import AmountText from "@/components/admin/AmountText";
import MenuItem from "@/components/admin/MenuItem";
import Menu from "@/components/admin/Menu";
import Dropdown from "@/components/admin/Dropdown";

type PlanKey = "1_month" | "3_months" | "6_months";

const PROJECTS = ["Project Alpha", "Project Beta", "HomeLet Revamp"];
const PLANS: Record<PlanKey, { label: string; months: number }> = {
  "1_month": { label: "1 Month", months: 1 },
  "3_months": { label: "3 Months", months: 3 },
  "6_months": { label: "6 Months", months: 6 },
};

const N = (v: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(v);

export default function ClientInstallments() {
  const router = useRouter();

  // ---- dummy state ----
  const [project, setProject] = useState(PROJECTS[0]);
  const [showProjectMenu, setShowProjectMenu] = useState(false);

  const [plan, setPlan] = useState<PlanKey>("3_months");
  const [showPlanMenu, setShowPlanMenu] = useState(false);

  const totalAmount = 60000; // dummy
  const perInstallment = useMemo(
    () => Math.round(totalAmount / PLANS[plan].months),
    [totalAmount, plan]
  );

  // Fake schedule for visual (replace with API later)
  const schedule = useMemo(
    () =>
      Array.from({ length: PLANS[plan].months }, (_, i) => ({
        idx: i + 1,
        of: PLANS[plan].months,
        dueLabel:
          ["Sept 12", "Oct 12", "Nov 12", "Dec 12", "Jan 12", "Feb 12"][i] ??
          "—",
        amount: perInstallment,
      })),
    [plan, perInstallment]
  );

  const paymentDue = [
    { due: "Nov 12", amount: perInstallment, status: "paid" as const },
    { due: "Nov 12", amount: perInstallment, status: "unpaid" as const },
    { due: "Nov 12", amount: perInstallment, status: "unpaid" as const },
  ];

  const handleSave = () => {
    // later: dispatch(saveInstallmentPlan(...))
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="px-5 pt-6 pb-4 flex-row items-center justify-between">
        <View className="flex-row items-center gap-4">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full items-center justify-center"
          >
            <ArrowLeft size={24} color="#111827" />
          </Pressable>
          <Text className="text-2xl font-kumbhBold text-text">
            Installment Payment
          </Text>
        </View>

        <Pressable
          onPress={handleSave}
          className="px-5 py-3 rounded-2xl bg-primary-500 active:opacity-90"
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
          {/* Project Name */}
          <Field label="Project Name">
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
          </Field>

          {/* Total Amount */}
          <Field label="Total Amount">
            <AmountText>{N(totalAmount)}</AmountText>
          </Field>

          {/* Installment Plan */}
          <Field label="Installment Plan">
            <Dropdown
              value={PLANS[plan].label}
              open={showPlanMenu}
              onToggle={() => setShowPlanMenu((s) => !s)}
            />
            {showPlanMenu && (
              <Menu>
                {(Object.keys(PLANS) as PlanKey[]).map((key) => (
                  <MenuItem
                    key={key}
                    active={key === plan}
                    onPress={() => {
                      setPlan(key);
                      setShowPlanMenu(false);
                    }}
                  >
                    {PLANS[key].label}
                  </MenuItem>
                ))}
              </Menu>
            )}
          </Field>

          {/* Installment Amount */}
          <Field label="Installment Amount">
            <AmountText>{N(perInstallment)}</AmountText>
          </Field>

          {/* Date Due list */}
          <SectionTitle>Date Due</SectionTitle>
          <View className="mt-2">
            {schedule.map((row) => (
              <View
                key={row.idx}
                className="flex-row items-center justify-between py-3"
              >
                <View className="flex-row items-center gap-3">
                  <View className="w-7 h-7 rounded-full border border-gray-400 items-center justify-center">
                    <Text className="text-sm font-kumbhBold text-gray-700">
                      {row.idx}
                    </Text>
                  </View>
                  <Text className="text-base font-kumbh text-text">
                    {row.idx} of {row.of} Installments
                  </Text>
                </View>

                <View className="flex-row items-center gap-4">
                  <Text className="text-base font-kumbh text-gray-600">
                    Due: {row.dueLabel}
                  </Text>
                  <Text className="text-base font-kumbhBold text-text">
                    {N(row.amount)}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Payment Due */}
          <SectionTitle className="mt-6">Payment Due</SectionTitle>
          <View className="mt-2">
            {paymentDue.map((p, i) => (
              <View
                key={i}
                className="flex-row items-center justify-between py-3"
              >
                <Text className="text-base font-kumbh text-text">
                  Due: {p.due} {N(p.amount)}
                </Text>

                <View
                  className={clsx(
                    "px-3 py-1 rounded-lg",
                    p.status === "paid" ? "bg-green-100" : "bg-green-100/40"
                  )}
                >
                  <Text
                    className={clsx(
                      "text-sm font-kumbhBold",
                      p.status === "paid" ? "text-green-700" : "text-green-700"
                    )}
                  >
                    {p.status === "paid" ? "Paid" : "Unpaid"}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
