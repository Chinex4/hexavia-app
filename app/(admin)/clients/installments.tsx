// app/(admin)/clients/installments.tsx
import DateTimePicker from "@react-native-community/datetimepicker";
import clsx from "clsx";
import * as Print from "expo-print";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import { ArrowLeft, Plus, Trash2 } from "lucide-react-native";
import React from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import SectionTitle from "@/components/admin/SectionTitle";
import { showError, showSuccess } from "@/components/ui/toast";
import {
  makeSelectClientById,
  selectClientDetailLoading,
} from "@/redux/client/client.selectors";
import { fetchClientById } from "@/redux/client/client.thunks";
import {
  selectAdding,
  selectAmountPaid,
  selectClientId,
  selectDerivedRemaining,
  selectInstallmentsError,
  selectInstallmentsErrorDetail,
  selectLastAdd,
  selectRows,
  selectTotalAmount,
} from "@/redux/installments/installments.selectors";
import {
  addRow as addRowAction,
  clearError,
  removeRow as removeRowAction,
  setAmountPaid,
  setClientId,
  setRows,
  setTotalAmount,
  updateRow as updateRowAction,
} from "@/redux/installments/installments.slice";
import {
  addClientInstallments,
  deleteClientInstallment,
} from "@/redux/installments/installments.thunks";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system/legacy";
import logoIcon from "@/assets/images/logo-icon.png";

const PRIMARY = "#4C5FAB";
const BG_INPUT = "#F7F9FC";

/* ====== Customize these for your brand ====== */
const COMPANY_NAME = "Hexavia"; // header: "Hexavia Invoice"
const ACCOUNT_DETAILS = {
  accountName: "Hexavia Consulting",
  accountNumber: "8035202891",
  bankName: "Moniepoint Microfinance Bank",
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

function slugFileName(s: string) {
  return (s || "invoice")
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^\w\-]+/g, "")
    .slice(0, 80);
}

function yyyymmdd(d = new Date()) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/* ---------- invoice HTML (Total only + bank details + POP instruction) ---------- */
function htmlForInvoice(payload: {
  logoDataUrl?: string | null;
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
    logoDataUrl,
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
            <td>${r.paymentId ? `<span class="pill ok">Recorded</span>` : `<span class="pill">Pending</span>`}</td>
          </tr>`;
        })
        .join("")
    : `<tr><td colspan="4">No installments added.</td></tr>`;

  const logoMarkup = logoDataUrl
    ? `<img src="${logoDataUrl}" class="logo" alt="${companyName} logo" />`
    : `<div class="logo fallback">${(companyName || "C").slice(0, 1)}</div>`;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>${companyName} Invoice</title>
<style>
  * { box-sizing: border-box; }
  body { margin:0; font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Inter, "Helvetica Neue", Arial, sans-serif; color:#0f172a; background:#eef2ff; }
  .page { padding: 28px 20px 40px; }
  .sheet { max-width: 980px; margin: 0 auto; background:#fff; border-radius: 26px; padding: 26px; box-shadow: 0 25px 60px rgba(15, 23, 42, 0.14); }
  .topbar { display:flex; align-items:flex-start; justify-content:space-between; gap: 18px; }
  .brand { display:flex; align-items:center; gap: 12px; }
  .logo { width: 54px; height: 54px; border-radius: 16px; background:#111827; padding: 8px; object-fit: contain; }
  .logo.fallback { display:flex; align-items:center; justify-content:center; color:#fff; font-weight:800; letter-spacing:0.08em; }
  .title { display:flex; flex-direction:column; gap: 2px; }
  .company { font-size: 18px; font-weight: 800; letter-spacing: 0.2px; }
  .inv { font-size: 26px; font-weight: 800; margin-top: 2px; }
  .muted { color:#64748b; font-size: 12px; }
  .chip { padding: 7px 12px; border-radius: 999px; background:#eef2ff; color:#312e81; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; display:inline-block; }
  .meta { margin-top: 18px; display:grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px 18px; font-size: 13px; color:#334155; }
  .meta strong { color:#0f172a; }
  .divider { height: 1px; background:#e5e7eb; margin: 18px 0; }
  table { width:100%; border-collapse: collapse; margin-top: 14px; overflow:hidden; border-radius: 16px; border: 1px solid #e5e7eb; }
  thead { background:#0f172a; color:#fff; }
  th { padding: 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; text-align:left; }
  td { padding: 12px; border-top: 1px solid #e5e7eb; font-size: 12px; color:#0f172a; vertical-align: top; }
  tbody tr:nth-child(odd) { background:#f8fafc; }
  .right { text-align:right; }
  .pill { display:inline-block; padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; background:#f1f5f9; color:#334155; }
  .pill.ok { background:#e8fff3; color:#047857; }
  .totals { margin-top: 16px; display:flex; justify-content:flex-end; }
  .totalCard { width: 280px; border: 1px solid #e5e7eb; border-radius: 18px; padding: 14px; background:#f8fafc; }
  .totalLabel { font-size: 12px; color:#64748b; letter-spacing: 0.08em; text-transform: uppercase; font-weight: 700; }
  .totalValue { margin-top: 6px; font-size: 22px; font-weight: 900; text-align:right; }
  .payGrid { margin-top: 14px; display:grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .card { border:1px solid #e5e7eb; border-radius: 18px; padding: 14px; background:#fff; }
  .card h3 { margin:0 0 8px; font-size: 14px; }
  .kv { font-size: 13px; color:#334155; line-height: 1.6; }
  .footnote { margin-top: 10px; font-size: 12px; color:#334155; }
  .footer { margin-top: 18px; font-size: 11px; color:#64748b; letter-spacing:0.08em; text-align:right; }
</style>
</head>
<body>
  <div class="page">
    <div class="sheet">

      <div class="topbar">
        <div class="brand">
          ${logoMarkup}
          <div class="title">
            <div class="company">${companyName}</div>
            <div class="inv">Invoice</div>
            <div class="muted">Generated: ${fmtDMY(new Date())}</div>
          </div>
        </div>
        <div style="text-align:right">
          <div class="chip">INSTALLMENT PLAN</div>
        </div>
      </div>

      <div class="meta">
        <div><strong>Client:</strong> ${clientName || "—"}</div>
        <div><strong>Engagement:</strong> ${engagement || "—"}</div>
        <div><strong>Project:</strong> ${projectName || "—"}</div>
        <div><strong>Reference:</strong> ${companyName}</div>
      </div>

      <div class="divider"></div>

      <table>
        <thead>
          <tr>
            <th style="width:44px">#</th>
            <th>Due Date</th>
            <th class="right">Amount</th>
            <th style="width:120px">Status</th>
          </tr>
        </thead>
        <tbody>
          ${bodyRows}
        </tbody>
      </table>

      <div class="totals">
        <div class="totalCard">
          <div class="totalLabel">Total</div>
          <div class="totalValue">${N(total)}</div>
        </div>
      </div>

      <div class="payGrid">
        <div class="card">
          <h3>Payment Details</h3>
          <div class="kv"><strong>Account Name:</strong> ${account.accountName}</div>
          <div class="kv"><strong>Account Number:</strong> ${account.accountNumber}</div>
          <div class="kv"><strong>Bank:</strong> ${account.bankName}</div>
        </div>

        <div class="card">
          <h3>Proof of Payment</h3>
          <div class="kv">${proofInstruction || ""}</div>
        </div>
      </div>

      <div class="footer">${companyName} Invoice</div>
    </div>
  </div>
</body>
</html>`;
}

export default function ClientInstallments() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const params = useLocalSearchParams<{ clientId?: string }>();
  const incomingClientId = params?.clientId ? String(params.clientId) : "";
  const [logoDataUrl, setLogoDataUrl] = React.useState<string | null>(null);

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
    let active = true;

    (async () => {
      try {
        const asset = Asset.fromModule(logoIcon);
        await asset.downloadAsync();
        const uri = asset.localUri ?? asset.uri;
        if (!uri || !active) return;

        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: "base64",
        });

        if (active) {
          setLogoDataUrl(base64 ? `data:image/png;base64,${base64}` : null);
        }
      } catch (e) {
        console.warn("Unable to inline invoice logo", e);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

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
        logoDataUrl,
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

      const clientSlug = slugFileName(name || "client");
      const projectSlug = slugFileName(project || "project");
      const dateSlug = yyyymmdd(new Date());

      const filename = `invoice_${clientSlug}_${projectSlug}_${dateSlug}.pdf`;

      const result = await Print.printToFileAsync({
        html,
        base64: Platform.OS === "web",
      });

      let shareUri = result.uri;

      if (Platform.OS !== "web") {
        const dest =
          (FileSystem.documentDirectory || FileSystem.cacheDirectory || "") +
          filename;
        await FileSystem.copyAsync({ from: result.uri, to: dest });
        shareUri = dest;
      }

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
        await Sharing.shareAsync(shareUri, {
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
                      Receivable Amount
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
              <Text className="text-white font-kumbhBold">
                Generate Invoice/Send Reminder
              </Text>
            </Pressable>
            {/* <Pressable
              onPress={() => onBuildInvoice("Generate Invoice")}
              className="flex-1 h-14 rounded-2xl border border-[#4C5FAB] items-center justify-center active:opacity-90"
            >
              <Text className="text-[#4C5FAB] font-kumbhBold">
                Generate Invoice
              </Text>
            </Pressable> */}
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
