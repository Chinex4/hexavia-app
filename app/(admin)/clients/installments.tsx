// app/(admin)/clients/installments.tsx
import React from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Plus, Trash2 } from "lucide-react-native";
import clsx from "clsx";
import DateTimePicker from "@react-native-community/datetimepicker";

import SectionTitle from "@/components/admin/SectionTitle";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  addRow as addRowAction,
  updateRow as updateRowAction,
  removeRow as removeRowAction,
  setRows,
  setTotalAmount,
  setAmountPaid,
  setClientId,
  clearError,
} from "@/redux/installments/installments.slice";
import {
  selectRows,
  selectTotalAmount,
  selectAmountPaid,
  selectDerivedRemaining,
  selectAdding,
  selectInstallmentsError,
  selectInstallmentsErrorDetail,
  selectClientId,
  selectLastAdd,
} from "@/redux/installments/installments.selectors";
import { addClientInstallments, deleteClientInstallment } from "@/redux/installments/installments.thunks";

import { fetchClientById } from "@/redux/client/client.thunks";
import {
  makeSelectClientById,
  selectClientDetailLoading,
} from "@/redux/client/client.selectors";

// ✅ toasts
import { showSuccess, showError } from "@/components/ui/toast";

const PRIMARY = "#4C5FAB";
const BG_INPUT = "#F7F9FC";

type PlanRow = { amount: string; due: string; paymentId?: string };

const N = (v: number | string) => {
  const n = typeof v === "string" ? Number(String(v).replace(/[^\d]/g, "")) : v;
  if (!Number.isFinite(n)) return "₦ 0";
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(n);
};

// dd/mm/yyyy -> yyyy-mm-dd
function toISO(d: string) {
  const m = d.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return d;
  const [_, dd, mm, yyyy] = m;
  return `${yyyy}-${mm}-${dd}`;
}
function fmtDMY(d: Date) {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export default function ClientInstallments() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const params = useLocalSearchParams<{ clientId?: string }>();
  const incomingClientId = params?.clientId ? String(params.clientId) : "";

  // Redux
  const rows = useAppSelector(selectRows);
  const totalAmount = useAppSelector(selectTotalAmount);
  const amountPaid = useAppSelector(selectAmountPaid);
  const remaining = useAppSelector(selectDerivedRemaining);
  const adding = useAppSelector(selectAdding);
  const error = useAppSelector(selectInstallmentsError);
  const errorDetail = useAppSelector(selectInstallmentsErrorDetail);
  const clientId = useAppSelector(selectClientId);
  const lastAdd = useAppSelector(selectLastAdd);

  const selectClient = React.useMemo(
    () => (clientId ? makeSelectClientById(clientId) : () => null),
    [clientId]
  );
  const client = useAppSelector(selectClient);
  const loadingClient = useAppSelector(selectClientDetailLoading);

  // read-only header fields
  const [name, setName] = React.useState("");
  const [project, setProject] = React.useState("");
  const [engagement, setEngagement] = React.useState("");

  // date picker
  const [dateIdx, setDateIdx] = React.useState<number | null>(null);
  const [pickerDate, setPickerDate] = React.useState<Date>(new Date());

  // bootstrap
  React.useEffect(() => {
    if (!incomingClientId) {
      showError("Client ID is required");
      router.back();
      return;
    }
    dispatch(setClientId(incomingClientId));
    dispatch(fetchClientById(incomingClientId));
  }, [incomingClientId]);

  // Hydrate UI from client
  React.useEffect(() => {
    if (!client) return;
    setName(client.name ?? "");
    setProject(client.projectName ?? "");
    setEngagement(client.engagement ?? "");
    dispatch(setTotalAmount(String(client.payableAmount ?? 0)));

    // If your API exposes existing payments (e.g., client.installments),
    // normalize them into rows here:
    // const existing: PlanRow[] = (client.installments ?? []).map((p) => ({
    //   amount: String(p.amount ?? 0),
    //   due: /* convert ISO -> DD/MM/YYYY */ fmtDMY(new Date(p.date)),
    //   paymentId: p._id,
    // }));
    // if (existing.length) dispatch(setRows(existing));
  }, [client]);

  // API error -> toast
  React.useEffect(() => {
    if (!error) return;
    const extra =
      errorDetail?.excess != null ? ` • Excess: ${N(errorDetail.excess)}` : "";
    showError((error || "Action failed") + extra);
    dispatch(clearError());
  }, [error, errorDetail]);

  // After add: update amountPaid from server + toast
  React.useEffect(() => {
    if (!lastAdd) return;
    dispatch(setAmountPaid(String(lastAdd.totalPaid ?? 0)));
    showSuccess(
      `Installments saved. Paid: ${N(lastAdd.totalPaid ?? 0)} • Remaining: ${N(
        lastAdd.remainingBalance ?? 0
      )}`
    );
  }, [lastAdd]);

  const updateRow = (idx: number, patch: Partial<PlanRow>) => {
    dispatch(updateRowAction({ index: idx, patch }));
  };
  const addRow = () => dispatch(addRowAction());

  const deleteRow = async (idx: number, paymentId?: string) => {
    if (!paymentId) {
      // Unsaved row → remove locally
      dispatch(removeRowAction(idx));
      return;
    }
    if (!clientId) return;

    Alert.alert("Delete payment", "Remove this recorded payment?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const res = await dispatch(
              deleteClientInstallment({ clientId, paymentId })
            ).unwrap();

            // update totals from server
            dispatch(setAmountPaid(String(res.data?.totalPaid ?? 0)));

            // drop the row with this paymentId
            const filtered = rows.filter((r) => r.paymentId !== paymentId);
            dispatch(setRows(filtered));

            showSuccess(
              `Payment deleted. Paid: ${N(res.data?.totalPaid ?? 0)} • Remaining: ${N(
                res.data?.remainingBalance ?? 0
              )}`
            );
          } catch (e: any) {
            showError(e?.message || "Failed to delete payment");
          }
        },
      },
    ]);
  };

  const handleSave = () => {
    const payments = rows
      .filter((r) => !r.paymentId && r.amount && r.due) // only NEW rows
      .map((r) => ({
        amount: Number(r.amount),
        date: toISO(r.due),
      }));

    if (!clientId) {
      showError("Client not ready yet.");
      return;
    }
    if (payments.length === 0) {
      showError("Add at least one new installment row.");
      return;
    }

    dispatch(addClientInstallments({ clientId, payments }));
  };

  const ReadonlyBox = ({ children }: { children: React.ReactNode }) => (
    <View className="rounded-2xl px-4 py-3" style={{ backgroundColor: BG_INPUT }}>
      <Text className="font-kumbh text-[#111827]">{children}</Text>
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

  // amount input (kept inline and simple)
  const AmountInput = ({
    value,
    onChange,
    editable = true,
  }: {
    value: string;
    onChange: (t: string) => void;
    editable?: boolean;
  }) => (
    <View className="rounded-2xl px-4 py-3" style={{ backgroundColor: "#F3F4F6" }}>
      <TextInput
        editable={editable}
        value={value ? `₦ ${Number(value).toLocaleString("en-NG")}` : ""}
        onChangeText={(t) => onChange(t.replace(/[^\d]/g, ""))}
        placeholder="₦ 5,000"
        placeholderTextColor="#9CA3AF"
        keyboardType="numeric"
        className="font-kumbh text-[#111827]"
      />
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="px-5 pt-6 pb-3 flex-row items-center justify-between">
        <View className="flex-row items-center gap-4">
          <Pressable onPress={() => router.back()} className="w-10 h-10 rounded-full items-center justify-center">
            <ArrowLeft size={24} color="#111827" />
          </Pressable>
          <Text className="text-[22px] font-kumbhBold text-[#111827]">Installment Payment</Text>
        </View>
        <Pressable
          onPress={handleSave}
          disabled={adding || loadingClient}
          className={clsx(
            "px-5 py-3 rounded-2xl active:opacity-90",
            adding || loadingClient ? "bg-[#9CA3AF]" : "bg-[#4C5FAB]"
          )}
        >
          <Text className="text-white font-kumbhBold">{adding ? "Saving..." : "Save"}</Text>
        </Pressable>
      </View>

      {/* Body */}
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.select({ ios: "padding", android: "height" })}
        keyboardVerticalOffset={Platform.select({ ios: 8, android: 0 }) as number}
      >
        <ScrollView className="flex-1" contentContainerClassName="px-5 pb-10">
          {/* Summary card */}
          <View className="rounded-2xl p-4 bg-[#EEF1FF]">
            <Text className="font-kumbhBold text-[#111827] text-[16px]">{loadingClient ? "Loading…" : name || "—"}</Text>
            <Text className="font-kumbh text-[#111827] mt-1">{project || "—"}</Text>
            <Text className="font-kumbh text-[#6B7280]">{engagement || "—"}</Text>

            <View className="flex-row mt-3" style={{ gap: 12 }}>
              <View className="flex-1 rounded-xl bg-white/80 px-3 py-2">
                <Text className="text-[12px] text-[#6B7280] font-kumbh">Total</Text>
                <Text className="font-kumbhBold text-[#111827]">{N(totalAmount)}</Text>
              </View>
              <View className="flex-1 rounded-xl bg-white/80 px-3 py-2">
                <Text className="text-[12px] text-[#6B7280] font-kumbh">Paid</Text>
                <Text className="font-kumbhBold text-[#111827]">
                  {amountPaid ? N(amountPaid) : "—"}
                </Text>
              </View>
              <View className="flex-1 rounded-xl bg-white/80 px-3 py-2">
                <Text className="text-[12px] text-[#6B7280] font-kumbh">Remaining</Text>
                <Text className="font-kumbhBold text-[#111827]">{N(remaining)}</Text>
              </View>
            </View>
          </View>

          {/* Plan */}
          <SectionTitle className="mt-6">Installment Plan</SectionTitle>

          {rows.map((row, idx) => {
            const persisted = !!row.paymentId; // recorded on server
            return (
              <View key={idx} className="mt-3 rounded-2xl border border-[#EEF0F3] p-3">
                <View className="flex-row items-center justify-between">
                  <Text className="font-kumbh text-[#6B7280]">Row {idx + 1}</Text>
                  {persisted && (
                    <Text className="text-[12px] px-2 py-1 rounded-full bg-[#E5F9EE] text-[#0E9F6E]">
                      Recorded
                    </Text>
                  )}
                </View>

                <View className="flex-row mt-3" style={{ gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text className="mb-2 text-[13px] text-gray-700 font-kumbh">Payable Amount</Text>
                    <AmountInput
                      value={row.amount}
                      onChange={(t) => updateRow(idx, { amount: t })}
                      editable={!persisted}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text className="mb-2 text-[13px] text-gray-700 font-kumbh">Date due</Text>
                    <Pressable
                      disabled={persisted}
                      onPress={() => {
                        setDateIdx(idx);
                        const parts = row.due.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
                        if (parts) {
                          setPickerDate(new Date(+parts[3], +parts[2] - 1, +parts[1]));
                        } else {
                          setPickerDate(new Date());
                        }
                      }}
                      className={clsx(
                        "rounded-2xl px-4 py-3",
                        persisted ? "bg-gray-100" : "bg-[#F3F4F6]"
                      )}
                    >
                      <Text className="font-kumbh text-[#111827]">
                        {row.due || "DD/MM/YYYY"}
                      </Text>
                    </Pressable>
                  </View>
                </View>

                <View className="mt-3 items-end">
                  <Pressable
                    onPress={() => deleteRow(idx, row.paymentId)}
                    className="px-3 py-2 rounded-xl bg-red-50"
                  >
                    <View className="flex-row items-center" style={{ gap: 6 }}>
                      <Trash2 size={16} color="#B91C1C" />
                      <Text className="text-[#B91C1C] font-kumbh">Delete</Text>
                    </View>
                  </Pressable>
                </View>
              </View>
            );
          })}

          <Pressable
            onPress={addRow}
            className="mt-6 h-14 rounded-2xl bg-[#4C5FAB] flex-row items-center justify-center active:opacity-90"
          >
            <Plus size={18} color="#fff" />
            <Text className="ml-2 text-white font-kumbhBold">Add Row</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Date picker */}
      {dateIdx !== null && (
        <DateTimePicker
          value={pickerDate}
          mode="date"
          display={Platform.OS === "ios" ? "inline" : "default"}
          onChange={(e, d) => {
            if (Platform.OS === "android") setDateIdx(null);
            if (!d) return;
            updateRow(dateIdx!, { due: fmtDMY(d) });
          }}
        />
      )}
    </SafeAreaView>
  );
}
