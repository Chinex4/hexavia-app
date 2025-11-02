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
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

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
import {
  addClientInstallments,
  deleteClientInstallment,
} from "@/redux/installments/installments.thunks";
import { fetchClientById } from "@/redux/client/client.thunks";
import {
  makeSelectClientById,
  selectClientDetailLoading,
} from "@/redux/client/client.selectors";
import { showSuccess, showError } from "@/components/ui/toast";

const PRIMARY = "#4C5FAB";
const BG_INPUT = "#F7F9FC";

/* ====== Customize these for your brand ====== */
const COMPANY_NAME = "Hexavia"; // header: "Hexavia Invoice"
const ACCOUNT_DETAILS = {
  accountName: "Hexavia Technologies Ltd.",
  accountNumber: "0123456789",
  bankName: "GTBank",
};
const PROOF_INSTRUCTION =
  "After payment, please upload or attach your proof of payment (POP) for verification. Thank you.";
/* ============================================ */

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

/* ---------- invoice HTML (Total only + bank details + POP instruction) ---------- */
function htmlForInvoice(payload: {
  companyName: string;
  clientName: string;
  projectName: string;
  engagement: string;
  rows: PlanRow[];
  total: string | number;
  account: { accountName: string; accountNumber: string; bankName: string };
  proofInstruction?: string;
}) {
  const {
    companyName,
    clientName,
    projectName,
    engagement,
    rows,
    total,
    account,
    proofInstruction,
  } = payload;

  const bodyRows = rows.length
    ? rows
        .map((r, i) => {
          const amountNum = Number(String(r.amount).replace(/[^\d]/g, ""));
          return `<tr>
            <td>${i + 1}</td>
            <td>${r.due || ""}</td>
            <td style="text-align:right">${N(amountNum)}</td>
            <td>${r.paymentId ? "Recorded" : "—"}</td>
          </tr>`;
        })
        .join("")
    : `<tr><td colspan="4">No installments added.</td></tr>`;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>${companyName} Invoice</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Inter, "Helvetica Neue", Arial, sans-serif; color:#111827; }
  .wrap { padding: 24px; }
  .brand { font-size: 26px; font-weight: 800; letter-spacing: 0.3px; }
  .h1 { font-size: 18px; font-weight: 700; margin: 2px 0 6px; }
  .muted { color:#6b7280; font-size: 12px; }
  .meta { margin-top: 10px; font-size: 13px; display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap:6px 16px; }
  table { width:100%; border-collapse: collapse; margin-top: 16px; }
  th, td { border: 1px solid #e5e7eb; padding: 8px; font-size: 12px; text-align:left; vertical-align: top; }
  th { background:#f9fafb; font-weight:600; }
  .totals { margin-top:16px; display:grid; grid-template-columns: 1fr; gap: 12px; }
  .card { border:1px solid #e5e7eb; border-radius: 12px; padding: 12px; background:#fff; }
  .label { font-size: 12px; color:#6b7280; }
  .value { font-size: 18px; font-weight:700; margin-top: 4px; text-align:right; }
  .divider { height: 1px; background:#e5e7eb; margin: 16px 0; }
  .bank { font-size: 13px; line-height: 1.5; }
  .footnote { font-size: 12px; color:#374151; margin-top: 6px; }
</style>
</head>
<body>
  <div class="wrap">
    <div class="brand">${companyName}</div>
    <div class="h1">Invoice</div>
    <div class="muted">Generated: ${fmtDMY(new Date())}</div>

    <div class="meta">
      <div><strong>Client:</strong> ${clientName || "—"}</div>
      <div><strong>Engagement:</strong> ${engagement || "—"}</div>
      <div><strong>Project:</strong> ${projectName || "—"}</div>
      <div><strong>Reference:</strong> ${companyName}</div>
    </div>

    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Due Date</th>
          <th style="text-align:right">Amount</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>${bodyRows}</tbody>
    </table>

    <div class="totals">
      <div class="card">
        <div class="label">Total</div>
        <div class="value">${N(total)}</div>
      </div>
    </div>

    <div class="divider"></div>

    <div class="h1">Payment Details</div>
    <div class="bank">
      <div><strong>Account Name:</strong> ${account.accountName}</div>
      <div><strong>Account Number:</strong> ${account.accountNumber}</div>
      <div><strong>Bank:</strong> ${account.bankName}</div>
    </div>

    <p class="footnote">${proofInstruction || ""}</p>
  </div>
</body>
</html>`;
}

export default function ClientInstallments() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const params = useLocalSearchParams<{ clientId?: string }>();
  const incomingClientId = params?.clientId ? String(params.clientId) : "";

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

  const [name, setName] = React.useState("");
  const [project, setProject] = React.useState("");
  const [engagement, setEngagement] = React.useState("");

  const [dateIdx, setDateIdx] = React.useState<number | null>(null);
  const [pickerDate, setPickerDate] = React.useState<Date>(new Date());

  React.useEffect(() => {
    if (!incomingClientId) {
      showError("Client ID is required");
      router.back();
      return;
    }
    dispatch(setClientId(incomingClientId));
    dispatch(fetchClientById(incomingClientId));
  }, [incomingClientId]);

  React.useEffect(() => {
    if (!client) return;
    setName(client.name ?? "");
    setProject(client.projectName ?? "");
    setEngagement(client.engagement ?? "");
    dispatch(setTotalAmount(String(client.payableAmount ?? 0)));
  }, [client]);

  React.useEffect(() => {
    if (!error) return;
    const extra =
      errorDetail?.excess != null ? ` • Excess: ${N(errorDetail.excess)}` : "";
    showError((error || "Action failed") + extra);
    dispatch(clearError());
  }, [error, errorDetail]);

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

            dispatch(setAmountPaid(String(res.data?.totalPaid ?? 0)));

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
      .filter((r) => !r.paymentId && r.amount && r.due)
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

  /* ---------- Generate / Send Invoice (PDF) ---------- */
  const onBuildInvoice = async (dialogTitle: string) => {
    try {
      const html = htmlForInvoice({
        companyName: COMPANY_NAME,
        clientName: name,
        projectName: project,
        engagement: engagement,
        rows,
        total: totalAmount, // ONLY total (no paid/remaining yet)
        account: {
          accountName: ACCOUNT_DETAILS.accountName,
          accountNumber: ACCOUNT_DETAILS.accountNumber,
          bankName: ACCOUNT_DETAILS.bankName,
        },
        proofInstruction: PROOF_INSTRUCTION,
      });

      const filename = `invoice_${(name || "client").replace(/\s+/g, "_")}_${Date.now()}.pdf`;
      const result = await Print.printToFileAsync({
        html,
        base64: Platform.OS === "web",
      });

      if (Platform.OS === "web") {
        const base64 = (result as any).base64;
        if (base64) {
          const a = document.createElement("a");
          a.href = `data:application/pdf;base64,${base64}`;
          a.download = filename;
          a.click();
        } else {
          await Print.printAsync({ html });
        }
      } else {
        await Sharing.shareAsync(result.uri, {
          UTI: "com.adobe.pdf",
          mimeType: "application/pdf",
          dialogTitle,
        });
      }
    } catch (e: any) {
      showError(e?.message || "Failed to generate invoice");
    }
  };

  const ReadonlyBox = ({ children }: { children: React.ReactNode }) => (
    <View
      className="rounded-2xl px-4 py-3"
      style={{ backgroundColor: BG_INPUT }}
    >
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

  const AmountInput = ({
    value,
    onChange,
    editable = true,
  }: {
    value: string;
    onChange: (t: string) => void;
    editable?: boolean;
  }) => (
    <View
      className="rounded-2xl px-4 py-3"
      style={{ backgroundColor: "#F3F4F6" }}
    >
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
          disabled={adding || loadingClient}
          className={clsx(
            "px-5 py-3 rounded-2xl active:opacity-90",
            adding || loadingClient ? "bg-[#9CA3AF]" : "bg-[#4C5FAB]"
          )}
        >
          <Text className="text-white font-kumbhBold">
            {adding ? "Saving..." : "Save"}
          </Text>
        </Pressable>
      </View>

      {/* Body */}
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.select({ ios: "padding", android: "height" })}
        keyboardVerticalOffset={
          Platform.select({ ios: 8, android: 0 }) as number
        }
      >
        <ScrollView className="flex-1" contentContainerClassName="px-5 pb-10">
          {/* Summary card (Total only visible) */}
          <View className="rounded-2xl p-4 bg-[#EEF1FF]">
            <Text className="font-kumbhBold text-[#111827] text-[16px]">
              {loadingClient ? "Loading…" : name || "—"}
            </Text>
            <Text className="font-kumbh text-[#111827] mt-1">
              {project || "—"}
            </Text>
            <Text className="font-kumbh text-[#6B7280]">
              {engagement || "—"}
            </Text>

            <View className="flex-row mt-3" style={{ gap: 12 }}>
              {/* Total (keep visible) */}
              <View className="flex-1 rounded-xl bg-white/80 px-3 py-2">
                <Text className="text-[12px] text-[#6B7280] font-kumbh">
                  Total
                </Text>
                <Text className="font-kumbhBold text-[#111827]">
                  {N(totalAmount)}
                </Text>
              </View>

              {/*
              // Paid (COMMENTED OUT AS REQUESTED)
              <View className="flex-1 rounded-xl bg-white/80 px-3 py-2">
                <Text className="text-[12px] text-[#6B7280] font-kumbh">Paid</Text>
                <Text className="font-kumbhBold text-[#111827]">
                  {amountPaid ? N(amountPaid) : "—"}
                </Text>
              </View>

              // Remaining (COMMENTED OUT AS REQUESTED)
              <View className="flex-1 rounded-xl bg-white/80 px-3 py-2">
                <Text className="text-[12px] text-[#6B7280] font-kumbh">Remaining</Text>
                <Text className="font-kumbhBold text-[#111827]">{N(remaining)}</Text>
              </View>
              */}
            </View>
          </View>

          {/* Plan header + small Add Row button in same container */}
          <View className="mt-6 flex-row items-center justify-between">
            <SectionTitle className="m-0">Installment Plan</SectionTitle>
            <Pressable
              onPress={addRow}
              className="px-3 py-2 rounded-xl bg-[#4C5FAB] active:opacity-90"
            >
              <View className="flex-row items-center" style={{ gap: 6 }}>
                <Plus size={16} color="#fff" />
                <Text className="text-white font-kumbhBold text-[13px]">
                  Add Row
                </Text>
              </View>
            </Pressable>
          </View>

          {/* Plan rows */}
          {rows.map((row, idx) => {
            const persisted = !!row.paymentId; // recorded on server
            return (
              <View
                key={idx}
                className="mt-3 rounded-2xl border border-[#EEF0F3] p-3"
              >
                <View className="flex-row items-center justify-between">
                  <Text className="font-kumbh text-[#6B7280]">
                    Row {idx + 1}
                  </Text>
                  {persisted && (
                    <Text className="text-[12px] px-2 py-1 rounded-full bg-[#E5F9EE] text-[#0E9F6E]">
                      Recorded
                    </Text>
                  )}
                </View>

                <View className="flex-row mt-3" style={{ gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text className="mb-2 text-[13px] text-gray-700 font-kumbh">
                      Payable Amount
                    </Text>
                    <AmountInput
                      value={row.amount}
                      onChange={(t) => updateRow(idx, { amount: t })}
                      editable={!persisted}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text className="mb-2 text-[13px] text-gray-700 font-kumbh">
                      Date due
                    </Text>
                    <Pressable
                      disabled={persisted}
                      onPress={() => {
                        setDateIdx(idx);
                        const parts = row.due.match(
                          /^(\d{2})\/(\d{2})\/(\d{4})$/
                        );
                        if (parts) {
                          setPickerDate(
                            new Date(+parts[3], +parts[2] - 1, +parts[1])
                          );
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

          {/* Bottom actions: Send / Generate Invoice */}
          <View className="mt-6 flex-row" style={{ gap: 12 }}>
            <Pressable
              onPress={() => onBuildInvoice("Send Invoice")}
              className="flex-1 h-14 rounded-2xl bg-[#4C5FAB] items-center justify-center active:opacity-90"
            >
              <Text className="text-white font-kumbhBold">Send Reminder</Text>
            </Pressable>
            <Pressable
              onPress={() => onBuildInvoice("Generate Invoice")}
              className="flex-1 h-14 rounded-2xl border border-[#4C5FAB] items-center justify-center active:opacity-90"
            >
              <Text className="text-[#4C5FAB] font-kumbhBold">
                Generate Invoice
              </Text>
            </Pressable>
          </View>
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
