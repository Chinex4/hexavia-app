// app/(staff)/sanctions/index.tsx
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  FlatList,
  Platform,
  Alert,
} from "react-native";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import BackHeader from "@/components/BackHeader";
import Ionicons from "@expo/vector-icons/Ionicons";

type Sanction = {
  id: string;
  date: string;
  recipient: string;
  reason: string;
  remarks: string;
  status: "Active" | "Resolved" | "Pending";
};

const DATA: Sanction[] = [
  { id: "1", date: "25 Aug 2020", recipient: "John Doe", reason: "Missed deadline", remarks: "Written warning issued", status: "Active" },
  { id: "2", date: "2 Sept 2025", recipient: "Jane Smith", reason: "Unapproved absence", remarks: "Salary deduction (5%)", status: "Resolved" },
  { id: "3", date: "25 Aug 2025", recipient: "Mark Anthony", reason: "Misconduct in team", remarks: "Pending HR review", status: "Pending" },
];

const PRIMARY = "#4C5FAB";

// ---- COLUMN LAYOUT (fixed widths = perfect alignment) ----
const COLS = [
  { key: "date",      title: "Date",      width: 120 },
  { key: "recipient", title: "Recipient", width: 150 },
  { key: "reason",    title: "Reason",    width: 180 },
  { key: "remarks",   title: "Remarks",   width: 240 },
  { key: "status",    title: "Status",    width: 120 },
] as const;
const TABLE_MIN_WIDTH = COLS.reduce((sum, c) => sum + c.width, 0);

// ---- UI helpers ----
function StatusBadge({ value }: { value: Sanction["status"] }) {
  const styles = {
    Active:   { bg: "#FEE2E2", text: "#B91C1C" },
    Resolved: { bg: "#DCFCE7", text: "#166534" },
    Pending:  { bg: "#FEF9C3", text: "#854D0E" },
  }[value];

  return (
    <View className="px-3 h-8 rounded-full items-center justify-center" style={{ backgroundColor: styles.bg }}>
      <Text className="text-xs font-kumbhBold" style={{ color: styles.text }}>{value}</Text>
    </View>
  );
}

function Th({ title, width }: { title: string; width: number }) {
  return (
    <View style={{ width }} className="py-3 px-3">
      <Text className="text-[12px] tracking-wide text-gray-600 font-kumbhBold">{title}</Text>
    </View>
  );
}

function Td({ children, width }: { children: React.ReactNode; width: number }) {
  return (
    <View style={{ width }} className="py-3 px-3">
      <Text className="text-[13px] text-gray-900 font-kumbh" numberOfLines={2}>{children}</Text>
    </View>
  );
}

// ---- CSV helpers ----
const csvEscape = (v: unknown) => {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

async function exportCsv(rows: Sanction[]) {
  const header = COLS.map(c => c.title).join(",");
  const lines = rows.map(r =>
    [
      csvEscape(r.date),
      csvEscape(r.recipient),
      csvEscape(r.reason),
      csvEscape(r.remarks),
      csvEscape(r.status),
    ].join(",")
  );
  const csv = [header, ...lines].join("\n");

  const fileUri = FileSystem.documentDirectory + `sanctions_${Date.now()}.csv`;
  await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: FileSystem.EncodingType.UTF8 });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(fileUri, { mimeType: "text/csv", dialogTitle: "Export Sanctions CSV" });
  } else {
    Alert.alert("CSV exported", `Saved to: ${fileUri}`);
  }
}

export default function SanctionsScreen() {
  const [rows] = useState<Sanction[]>(DATA);
  const sorted = useMemo(() => rows, [rows]); // hook up real sorting later

  const viewStyle = { flex: 1, marginTop: Platform.select({ ios: 60, android: 40 }) };

  return (
    <View className="flex-1 bg-white">
      <View style={viewStyle}>
        <BackHeader title="Sanction Grid" />

        <View
          className="mx-4 mt-2 mb-6 rounded-3xl bg-white overflow-hidden"
          style={{
            shadowColor: "#000",
            shadowOpacity: 0.08,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 4 },
            elevation: 3,
          }}
        >
          {/* horizontal scroll keeps columns readable; fixed widths keep header/rows aligned */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ minWidth: TABLE_MIN_WIDTH }}>
            <View className="w-full">
              {/* Header */}
              <View className="flex-row items-center" style={{ backgroundColor: "#F6F8FA" }}>
                {COLS.map(col => <Th key={col.key} title={col.title} width={col.width} />)}
              </View>

              {/* Rows */}
              <FlatList
                data={sorted}
                keyExtractor={i => i.id}
                renderItem={({ item, index }) => {
                  const zebra = index % 2 === 0 ? "bg-white" : "bg-gray-50";
                  return (
                    <View className={`flex-row items-center ${zebra}`}>
                      <Td width={COLS[0].width}>{item.date}</Td>
                      <Td width={COLS[1].width}>{item.recipient}</Td>
                      <Td width={COLS[2].width}>{item.reason}</Td>
                      <Td width={COLS[3].width}>{item.remarks}</Td>
                      <View style={{ width: COLS[4].width }} className="py-2 px-3">
                        <StatusBadge value={item.status} />
                      </View>
                    </View>
                  );
                }}
                ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: "#EEF0F3" }} />}
                ListFooterComponent={<View style={{ height: 4 }} />}
              />
            </View>
          </ScrollView>

          {/* Footer actions */}
          <View className="flex-row items-center justify-end px-4 pb-4 pt-1">
            <Pressable
              className="flex-row items-center px-3 py-2 rounded-lg"
              style={{ borderWidth: 1, borderColor: "#E5E7EB" }}
              onPress={() => exportCsv(sorted).catch(e => Alert.alert("Export failed", String(e)))}
            >
              <Ionicons name="download-outline" size={16} color="#111827" />
              <Text className="ml-1 text-[13px] font-kumbh">Export CSV</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}
