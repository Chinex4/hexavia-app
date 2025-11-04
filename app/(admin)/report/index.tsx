import { selectAllChannels } from "@/redux/channels/channels.slice";
import { fetchChannels } from "@/redux/channels/channels.thunks";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { yupResolver } from "@hookform/resolvers/yup";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Print from "expo-print";
import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import { ArrowLeft, Check, ChevronDown, Share2 } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import * as yup from "yup";

/* ───────── types ───────── */
type Channel = {
  _id: string;
  name: string;
  tasks?: Array<{
    _id: string;
    name: string;
    description?: string | null;
    createdAt: string;
    updatedAt?: string;
    status: "not-started" | "in-progress" | "completed" | string;
    dueDate?: string;
    due_date?: string;
  }>;
};

type FormValues = {
  projectName: string;
  channelIds: string[];
  startDate: Date | null;
  endDate: Date | null;
};

type TaskRow = {
  id: string;
  title: string;
  status: "not-started" | "in-progress" | "completed" | string;
  createdAt?: string;
  updatedAt?: string;
  channelName?: string;
  dueDate?: string;
};

/* ───────── validation ───────── */
const schema: yup.ObjectSchema<FormValues> = yup
  .object({
    projectName: yup.string().trim().required("Project name is required"),
    channelIds: yup
      .array(yup.string().trim().required())
      .min(1, "Please select at least one channel")
      .required("Please select at least one channel"),
    startDate: yup
      .date()
      .nullable()
      .required("Start date is required")
      .test(
        "valid",
        "Start date is required",
        (v) => !!v && !isNaN(v.getTime())
      ),
    endDate: yup
      .date()
      .nullable()
      .required("End date is required")
      .test("valid", "End date is required", (v) => !!v && !isNaN(v.getTime()))
      .test(
        "after-start",
        "End date must be on/after start date",
        function (end) {
          const start = this.parent.startDate as Date | null;
          if (!start || !end) return false;
          return end.getTime() >= start.getTime();
        }
      ),
  })
  .required();

/* ───────── helpers ───────── */
function fmt(d?: string | Date | null) {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  if (!date || isNaN(date.getTime())) return "";
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function statusBadgeColor(s: string) {
  switch (s) {
    case "completed":
      return "#16a34a";
    case "in-progress":
      return "#f59e0b";
    case "not-started":
      return "#9ca3af";
    default:
      return "#6b7280";
  }
}

/* ───────── component ───────── */
export default function CreateReportScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const channels = useAppSelector(selectAllChannels) as Channel[];

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: yupResolver(schema),
    defaultValues: {
      projectName: "",
      channelIds: [],
      startDate: null,
      endDate: null,
    },
    mode: "onBlur",
  });

  const selectedIds = watch("channelIds");
  const startDateValue = watch("startDate");
  const endDateValue = watch("endDate");

  /* date picker state */
  const [activeDateField, setActiveDateField] = useState<
    "start" | "end" | null
  >(null);
  const [tempDate, setTempDate] = useState<Date | null>(null);
  const [showDate, setShowDate] = useState(false);

  const openDatePicker = (which: "start" | "end", current?: Date | null) => {
    setActiveDateField(which);
    setTempDate(current ?? new Date());
    setShowDate(true);
  };
  const closeDatePicker = () => {
    setShowDate(false);
    setActiveDateField(null);
  };
  const confirmDate = () => {
    if (tempDate && activeDateField) {
      setValue(
        activeDateField === "start" ? "startDate" : "endDate",
        tempDate,
        {
          shouldValidate: true,
        }
      );
    }
    setShowDate(false);
    setActiveDateField(null);
  };

  /* channels load */
  useEffect(() => {
    dispatch(fetchChannels());
  }, [dispatch]);

  /* maps / selections */
  const idToChannel = useMemo(() => {
    const map = new Map<string, Channel>();
    channels.forEach((c) => map.set(c._id, c));
    return map;
  }, [channels]);

  const idToName = useMemo(() => {
    const map = new Map<string, string>();
    channels.forEach((c) => map.set(c._id, c.name));
    return map;
  }, [channels]);

  const selectedNames = useMemo(
    () => selectedIds.map((id) => idToName.get(id) ?? id),
    [selectedIds, idToName]
  );

  const toggleId = (id: string) => {
    const next = new Set(watch("channelIds"));
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setValue("channelIds", Array.from(next), {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  const selectAll = () => {
    setValue(
      "channelIds",
      channels.map((c) => c._id),
      { shouldValidate: true, shouldDirty: true, shouldTouch: true }
    );
  };

  const clearAll = () => {
    setValue("channelIds", [], {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  const formatDate = (d: Date | null) => (d ? fmt(d) : "DD/MM/YYYY");

  const ALLOWED = new Set(["not-started", "in-progress", "completed"]);

  function getRowsFromSelection(selected: string[]): TaskRow[] {
    const rows: TaskRow[] = [];
    selected.forEach((id) => {
      const ch = idToChannel.get(id);
      if (!ch) return;
      const chName = ch.name ?? id;
      (ch.tasks ?? []).forEach((t) => {
        const status = String(t.status ?? "").toLowerCase();
        if (!ALLOWED.has(status)) return;
        rows.push({
          id: t._id,
          title: t.name || "Untitled Task",
          status,
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,
          channelName: chName,
          dueDate: (t as any).dueDate || (t as any).due_date,
        });
      });
    });
    return rows;
  }

  function buildSummary(rows: TaskRow[]) {
    const total = rows.length;
    const counts = {
      notStarted: rows.filter((r) => r.status === "not-started").length,
      inProgress: rows.filter((r) => r.status === "in-progress").length,
      completed: rows.filter((r) => r.status === "completed").length,
    };
    const now = new Date();
    const overdue = rows.filter((r) => {
      const d = r.dueDate ? new Date(r.dueDate) : null;
      return (
        d instanceof Date &&
        !isNaN(d.getTime()) &&
        d < now &&
        r.status !== "completed"
      );
    }).length;
    const completionRate = total
      ? Math.round((counts.completed / total) * 100)
      : 0;

    const byChannel = new Map<
      string,
      {
        total: number;
        completed: number;
        inProgress: number;
        notStarted: number;
      }
    >();
    rows.forEach((r) => {
      const key = r.channelName ?? "Unknown";
      if (!byChannel.has(key)) {
        byChannel.set(key, {
          total: 0,
          completed: 0,
          inProgress: 0,
          notStarted: 0,
        });
      }
      const bucket = byChannel.get(key)!;
      bucket.total += 1;
      if (r.status === "completed") bucket.completed += 1;
      else if (r.status === "in-progress") bucket.inProgress += 1;
      else if (r.status === "not-started") bucket.notStarted += 1;
    });

    return { total, counts, overdue, completionRate, byChannel };
  }

  function htmlForPDF(payload: {
    projectName: string;
    period: { start: string; end: string };
    channels: string[];
    rows: TaskRow[];
    summary: ReturnType<typeof buildSummary>;
  }) {
    const { projectName, period, channels, rows, summary } = payload;

    const tableRows = rows
      .map(
        (r, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${r.title}</td>
          <td><span style="padding:3px 8px;border-radius:12px;background:${statusBadgeColor(
            r.status
          )};color:#fff;">${r.status}</span></td>
          <td>${r.channelName ?? ""}</td>
          <td>${fmt(r.createdAt)}</td>
          <td>${fmt(r.updatedAt)}</td>
          <td>${r.dueDate ? fmt(r.dueDate) : ""}</td>
        </tr>`
      )
      .join("");

    const channelBlocks = Array.from(summary.byChannel.entries())
      .map(([name, b]) => {
        const rate = b.total ? Math.round((b.completed / b.total) * 100) : 0;
        return `
          <div class="cbox">
            <div class="cname">${name}</div>
            <div class="cline"><strong>Total:</strong> ${b.total}</div>
            <div class="cline"><strong>Completed:</strong> ${b.completed}</div>
            <div class="cline"><strong>In-Progress:</strong> ${b.inProgress}</div>
            <div class="cline"><strong>Not-Started:</strong> ${b.notStarted}</div>
            <div class="cline"><strong>Completion:</strong> ${rate}%</div>
          </div>`;
      })
      .join("");

    return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>Tasks Report</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Inter, "Helvetica Neue", Arial, sans-serif; color:#111827; }
  .wrap { padding: 24px; }
  .h1 { font-size: 22px; font-weight: 700; margin: 0 0 4px; }
  .muted { color:#6b7280; font-size: 12px; }
  .meta { margin-top: 8px; font-size: 13px; display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap:4px 16px; }
  .cards { margin-top: 14px; display:grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: 12px; }
  .card { border:1px solid #e5e7eb; border-radius: 12px; padding: 12px; background:#fff; }
  .card .label { font-size: 12px; color:#6b7280; }
  .card .value { font-size: 20px; font-weight:700; margin-top: 4px; }
  .grid { display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 12px; margin-top: 12px; }
  .cbox { border:1px dashed #e5e7eb; border-radius:10px; padding:10px; }
  .cname { font-weight:600; margin-bottom:6px; }
  .cline { font-size:12px; color:#374151; }
  table { width:100%; border-collapse: collapse; margin-top: 16px; }
  th, td { border: 1px solid #e5e7eb; padding: 8px; font-size: 12px; text-align:left; vertical-align: top; }
  th { background:#f9fafb; font-weight:600; }
  .footer { margin-top: 18px; font-size: 11px; color:#6b7280; }
  @media print {
    .cards { grid-template-columns: repeat(4, 1fr); }
    .grid { grid-template-columns: repeat(2, 1fr); }
  }
</style>
</head>
<body>
  <div class="wrap">
    <div class="h1">Project Tasks Report</div>
    <div class="muted">Generated: ${fmt(new Date())}</div>

    <div class="meta">
      <div><strong>Project:</strong> ${projectName}</div>
      <div><strong>Report Period:</strong> ${period.start} — ${period.end}</div>
      <div><strong>Groups:</strong> ${channels.join(", ")}</div>
      <div><strong>Status Filter:</strong> not-started, in-progress, completed</div>
    </div>

    <!-- summary cards -->
    <div class="cards">
      <div class="card"><div class="label">Total Tasks</div><div class="value">${summary.total}</div></div>
      <div class="card"><div class="label">Completed</div><div class="value">${summary.counts.completed}</div></div>
      <div class="card"><div class="label">In-Progress</div><div class="value">${summary.counts.inProgress}</div></div>
      <div class="card"><div class="label">Not-Started</div><div class="value">${summary.counts.notStarted}</div></div>
    </div>

    <div class="cards" style="margin-top:10px;">
      <div class="card"><div class="label">Completion Rate</div><div class="value">${summary.completionRate}%</div></div>
      <div class="card"><div class="label">Overdue</div><div class="value">${summary.overdue}</div></div>
    </div>

    <!-- per-channel breakdown -->
    <div class="grid">
      ${channelBlocks || `<div class="cbox"><div class="cname">No per-channel data</div><div class="cline">—</div></div>`}
    </div>

    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Task</th>
          <th>Status</th>
          <th>Group</th>
          <th>Created</th>
          <th>Updated</th>
          <th>Due</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows || `<tr><td colspan="7">No tasks found for the selected filters.</td></tr>`}
      </tbody>
    </table>

    <div class="footer">Hexavia • Auto-generated report</div>
  </div>
</body>
</html>
`;
  }

  /* ───────── generate PDF ───────── */
  const [channelOpen, setChannelOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastPdfUri, setLastPdfUri] = useState<string | null>(null);

  const onGenerate = handleSubmit(async (values) => {
    setIsGenerating(true);
    setLastPdfUri(null);
    try {
      const rows = getRowsFromSelection(values.channelIds);
      const summary = buildSummary(rows);
      const html = htmlForPDF({
        projectName: values.projectName,
        period: { start: fmt(values.startDate), end: fmt(values.endDate) },
        channels: selectedNames,
        rows,
        summary,
      });

      const filename = `tasks_report_${values.projectName.replace(/\s+/g, "_")}_${Date.now()}.pdf`;
      const result = await Print.printToFileAsync({
        html,
        base64: Platform.OS === "web",
      });

      setLastPdfUri(result.uri);

      if (Platform.OS === "web") {
        if ((result as any).base64) {
          const a = document.createElement("a");
          a.href = `data:application/pdf;base64,${(result as any).base64}`;
          a.download = filename;
          a.click();
        } else {
          await Print.printAsync({ html });
        }
      } else {
        await Sharing.shareAsync(result.uri, {
          UTI: "com.adobe.pdf",
          mimeType: "application/pdf",
          dialogTitle: "Export PDF",
        });
      }
    } catch (err: any) {
      console.error(err);
      Alert.alert("Generate Report", err?.message ?? "Failed to generate.");
    } finally {
      setIsGenerating(false);
    }
  });

  const onShareAgain = async () => {
    if (!lastPdfUri) return;
    try {
      await Sharing.shareAsync(lastPdfUri, {
        UTI: "com.adobe.pdf",
        mimeType: "application/pdf",
        dialogTitle: "Export PDF",
      });
    } catch (e) {
      console.warn(e);
    }
  };

  /* ───────── UI ───────── */
  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View
        style={{ marginTop: Platform.select({ android: 60, ios: 60 }) }}
        className="px-5 flex-row items-center justify-between"
      >
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 -ml-1 items-center justify-center"
          hitSlop={8}
        >
          <ArrowLeft size={24} color="#111827" />
        </Pressable>
        <Text className="text-3xl font-kumbh text-black">Create report</Text>
        <View className="w-10" />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-10"
        keyboardShouldPersistTaps="handled"
      >
        {/* Title + blurb */}
        <Text className="mt-4 text-2xl font-kumbhBold text-black">Report</Text>
        <Text className="mt-3 text-base font-kumbh leading-6 text-gray-500">
          Generate insightful reports to monitor performance, track finances,
          and evaluate project progress.
        </Text>

        {/* Project Name */}
        <Text className="mt-6 text-lg font-kumbh text-black">Project Name</Text>
        <Controller
          control={control}
          name="projectName"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              className="mt-2 h-14 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 font-kumbh text-[16px] text-black"
              placeholder="Enter Project Name"
              placeholderTextColor="#9CA3AF"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
            />
          )}
        />
        {errors.projectName && (
          <Text className="mt-1 font-kumbh text-sm text-red-500">
            {errors.projectName.message}
          </Text>
        )}

        {/* Channels (multi) */}
        <Text className="mt-5 text-lg font-kumbh text-black">Groups</Text>
        <Controller
          control={control}
          name="channelIds"
          render={({ field: { value } }) => (
            <Pressable
              onPress={() => setChannelOpen(true)}
              className="mt-2 min-h-14 w-full flex-row items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3"
            >
              <View className="flex-1">
                {value.length === 0 ? (
                  <Text className="font-kumbh text-[16px] text-gray-400">
                    Select Channels
                  </Text>
                ) : (
                  <View>
                    <View className="flex-row flex-wrap gap-2">
                      {selectedNames.slice(0, 3).map((n) => (
                        <View
                          key={n}
                          className="px-3 py-1 rounded-full bg-white border border-gray-200"
                        >
                          <Text className="font-kumbh text-sm text-gray-700">
                            {n}
                          </Text>
                        </View>
                      ))}
                      {selectedNames.length > 3 && (
                        <View className="px-3 py-1 rounded-full bg-white border border-gray-200">
                          <Text className="font-kumbh text-sm text-gray-700">
                            +{selectedNames.length - 3} more
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                )}
              </View>
              <ChevronDown size={20} color="#6B7280" />
            </Pressable>
          )}
        />
        {errors.channelIds && (
          <Text className="mt-1 font-kumbh text-sm text-red-500">
            {String(errors.channelIds.message)}
          </Text>
        )}

        {/* Date Range */}
        <View className="mt-5">
          <Text className="text-lg font-kumbh text-black">Report Period</Text>
          <View className="mt-2 flex-row gap-4">
            {/* Start Date */}
            <View className="flex-1">
              <Text className="font-kumbh text-[12px] text-gray-500 mb-1">
                Start Date
              </Text>
              <Controller
                control={control}
                name="startDate"
                render={() => (
                  <Pressable
                    onPress={() => openDatePicker("start", startDateValue)}
                    className="h-14 w-full flex-row items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 px-4"
                  >
                    <Text
                      className={`font-kumbh text-[16px] ${
                        startDateValue ? "text-black" : "text-gray-400"
                      }`}
                    >
                      {formatDate(startDateValue)}
                    </Text>
                    <ChevronDown size={18} color="#6B7280" />
                  </Pressable>
                )}
              />
              {errors.startDate && (
                <Text className="mt-1 font-kumbh text-sm text-red-500">
                  {errors.startDate.message as string}
                </Text>
              )}
            </View>

            {/* End Date */}
            <View className="flex-1">
              <Text className="font-kumbh text-[12px] text-gray-500 mb-1">
                End Date
              </Text>
              <Controller
                control={control}
                name="endDate"
                render={() => (
                  <Pressable
                    onPress={() => openDatePicker("end", endDateValue)}
                    className="h-14 w-full flex-row items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 px-4"
                  >
                    <Text
                      className={`font-kumbh text-[16px] ${
                        endDateValue ? "text-black" : "text-gray-400"
                      }`}
                    >
                      {formatDate(endDateValue)}
                    </Text>
                    <ChevronDown size={18} color="#6B7280" />
                  </Pressable>
                )}
              />
              {errors.endDate && (
                <Text className="mt-1 font-kumbh text-sm text-red-500">
                  {errors.endDate.message as string}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Footer buttons */}
        <View className="mt-10 flex-row items-center justify-between">
          <Pressable
            disabled={isSubmitting || isGenerating}
            onPress={onGenerate}
            className="flex-1 rounded-2xl bg-primary py-4 disabled:opacity-60"
          >
            <Text className="text-center font-kumbh text-[16px] font-semibold text-white">
              {isGenerating ? "Generating..." : "AI Generate"}
            </Text>
          </Pressable>

          <Pressable
            onPress={onShareAgain}
            disabled={!lastPdfUri || isGenerating}
            className="ml-4 h-14 w-14 items-center justify-center rounded-2xl border border-gray-200 disabled:opacity-50"
          >
            <Share2 size={22} color="#111827" />
          </Pressable>
        </View>
      </ScrollView>

      {/* Channel Picker Modal (multi-select) */}
      <Modal visible={channelOpen} transparent animationType="fade">
        <Pressable
          onPress={() => setChannelOpen(false)}
          className="flex-1 bg-black/30"
        />
        <View className="absolute bottom-0 left-0 right-0 rounded-t-3xl bg-white p-5">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-lg font-kumbh font-semibold text-black">
              Select Channels
            </Text>
            <View className="flex-row items-center gap-4">
              <Pressable onPress={clearAll} className="px-2 py-1">
                <Text className="font-kumbh text-primary">Clear</Text>
              </Pressable>
              <Pressable onPress={selectAll} className="px-2 py-1">
                <Text className="font-kumbh text-primary">Select All</Text>
              </Pressable>
            </View>
          </View>

          <FlatList
            data={channels}
            keyExtractor={(i) => i._id}
            ItemSeparatorComponent={() => (
              <View className="h-[1px] bg-gray-100" />
            )}
            renderItem={({ item }) => {
              const checked = selectedIds.includes(item._id);
              return (
                <Pressable
                  onPress={() => toggleId(item._id)}
                  className="py-3 flex-row items-center justify-between"
                >
                  <Text className="font-kumbh text-[16px] text-black">
                    {item.name}
                  </Text>
                  <View
                    className={`w-6 h-6 rounded-md border items-center justify-center ${
                      checked
                        ? "bg-primary border-primary"
                        : "border-gray-300 bg-white"
                    }`}
                  >
                    {checked ? <Check size={16} color="#fff" /> : null}
                  </View>
                </Pressable>
              );
            }}
            style={{ maxHeight: 380 }}
          />

          <View className="mt-4 flex-row gap-3">
            <Pressable
              onPress={() => setChannelOpen(false)}
              className="flex-1 items-center justify-center rounded-2xl border border-gray-200 py-3"
            >
              <Text className="font-kumbh">Done</Text>
            </Pressable>
          </View>

          <View className="h-3" />
        </View>
      </Modal>

      {/* ANDROID: native date picker */}
      {showDate && Platform.OS === "android" && (
        <DateTimePicker
          mode="date"
          value={tempDate ?? new Date()}
          onChange={(event, picked) => {
            if (event.type === "set" && picked) {
              if (activeDateField) {
                setValue(
                  activeDateField === "start" ? "startDate" : "endDate",
                  picked,
                  {
                    shouldValidate: true,
                  }
                );
              }
            }
            setShowDate(false);
            setActiveDateField(null);
          }}
          maximumDate={new Date(2100, 11, 31)}
          minimumDate={new Date(2000, 0, 1)}
        />
      )}

      {/* iOS: custom sheet with spinner */}
      {showDate && Platform.OS === "ios" && (
        <Modal transparent animationType="fade">
          <Pressable className="flex-1 bg-black/30" onPress={closeDatePicker} />
          <View className="absolute bottom-0 left-0 right-0 rounded-t-3xl bg-white p-5">
            <View className="mb-3 flex-row justify-between">
              <Pressable onPress={closeDatePicker}>
                <Text className="font-kumbh text-primary">Cancel</Text>
              </Pressable>
              <Pressable onPress={confirmDate}>
                <Text className="font-kumbh font-semibold text-primary">
                  Done
                </Text>
              </Pressable>
            </View>

            <DateTimePicker
              mode="date"
              display="spinner"
              value={tempDate ?? new Date()}
              onChange={(_, picked) => {
                if (picked) setTempDate(picked);
              }}
              maximumDate={new Date(2100, 11, 31)}
              minimumDate={new Date(2000, 0, 1)}
            />
          </View>
        </Modal>
      )}

      {/* Generating overlay */}
      <Modal visible={isGenerating} transparent animationType="fade">
        <View className="flex-1 items-center justify-center bg-black/40">
          <View className="w-40 rounded-2xl bg-white px-5 py-6 items-center">
            <ActivityIndicator size="large" />
            <Text className="mt-3 font-kumbh">Generating PDF...</Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
