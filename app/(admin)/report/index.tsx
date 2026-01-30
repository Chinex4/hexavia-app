import { selectAllChannels } from "@/redux/channels/channels.slice";
import { fetchChannels } from "@/redux/channels/channels.thunks";
import { fetchChannelLinks } from "@/redux/channelLinks/channelLinks.thunks";
import { fetchChannelNotes } from "@/redux/channelNotes/channelNotes.thunks";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { yupResolver } from "@hookform/resolvers/yup";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Print from "expo-print";
import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system/legacy";
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
import logoIcon from "@/assets/images/logo-icon.png";
import * as yup from "yup";
import type { ChannelLink } from "@/redux/channelLinks/channelLinks.types";
import type { ChannelNote } from "@/redux/channelNotes/channelNotes.types";

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

type ChannelExtras = {
  channelId: string;
  channelName: string;
  links: ChannelLink[];
  notes: ChannelNote[];
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

function slugFileName(s: string) {
  return (s || "project")
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^\w\-]+/g, "") // remove weird chars
    .slice(0, 80);
}

function yyyymmdd(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function escapeHtml(input?: string | null) {
  if (!input) return "";
  return String(input)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
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
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);

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
    let active = true;
    const loadLogo = async () => {
      try {
        const asset = Asset.fromModule(logoIcon);
        await asset.downloadAsync();
        const uri = asset.localUri ?? asset.uri;
        if (!uri || !active) return;
        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: "base64",
        });
        if (active) {
          setLogoDataUrl(
            base64 ? `data:image/png;base64,${base64}` : (asset.uri ?? null)
          );
        }
      } catch (error) {
        console.warn("Unable to inline report logo", error);
      }
    };
    loadLogo();
    return () => {
      active = false;
    };
  }, []);

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
    extras: ChannelExtras[];
  }) {
    const { projectName, period, channels, rows, summary, extras } = payload;

    const tableBody =
      rows.length > 0
        ? rows
            .map(
              (r, i) => `
        <tr>
          <td>${i + 1}</td>
          <td class="task-title">${r.title}</td>
          <td><span class="status-pill" style="background:${statusBadgeColor(
            r.status
          )};color:#fff;">${r.status}</span></td>
          <td>${r.channelName ?? "—"}</td>
          <td>${fmt(r.createdAt)}</td>
          <td>${fmt(r.updatedAt)}</td>
          <td>${r.dueDate ? fmt(r.dueDate) : "—"}</td>
        </tr>`
            )
            .join("")
        : `<tr><td colspan="7" class="empty-row">No tasks found for the selected filters.</td></tr>`;

    const channelCards = Array.from(summary.byChannel.entries())
      .map(([name, b]) => {
        const rate = b.total ? Math.round((b.completed / b.total) * 100) : 0;
        return `
          <div class="channel-card">
            <div class="channel-name">${name}</div>
            <div class="channel-stats">
              <span class="channel-stat">Total: ${b.total}</span>
              <span class="channel-stat">Completed: ${b.completed}</span>
              <span class="channel-stat">In-Progress: ${b.inProgress}</span>
              <span class="channel-stat">Not-Started: ${b.notStarted}</span>
              <span class="channel-stat">Completion: ${rate}%</span>
            </div>
          </div>`;
      })
      .join("");
    const channelSection =
      channelCards ||
      `<div class="channel-card empty">
        <div class="channel-name">No per-channel data</div>
        <div class="channel-stat">Adjust filters to see a breakdown.</div>
      </div>`;

    const statCards = [
      { label: "Total Tasks", value: summary.total },
      { label: "Completed", value: summary.counts.completed },
      { label: "In Progress", value: summary.counts.inProgress },
      { label: "Not Started", value: summary.counts.notStarted },
    ]
      .map(
        (card) => `
        <div class="stat-card">
          <div class="label">${card.label}</div>
          <div class="value">${card.value}</div>
        </div>`
      )
      .join("");

    const legendItems = [
      { label: "Completed", color: statusBadgeColor("completed") },
      { label: "In Progress", color: statusBadgeColor("in-progress") },
      { label: "Not Started", color: statusBadgeColor("not-started") },
    ]
      .map(
        (item) => `
        <span class="legend-item">
          <span class="legend-dot" style="background:${item.color};"></span>
          ${item.label}
        </span>`
      )
      .join("");

    const extrasSection =
      extras.length > 0
        ? extras
            .map((ch) => {
              const links =
                ch.links.length > 0
                  ? ch.links
                      .map(
                        (l) => `
                        <li class="ln-item">
                          <div class="ln-title">${escapeHtml(
                            l.title || "Link"
                          )}</div>
                          <div class="ln-url">${escapeHtml(l.url)}</div>
                          ${
                            l.description
                              ? `<div class="ln-desc">${escapeHtml(
                                  l.description
                                )}</div>`
                              : ""
                          }
                        </li>`
                      )
                      .join("")
                  : `<li class="ln-empty">No links</li>`;
              const notes =
                ch.notes.length > 0
                  ? ch.notes
                      .map(
                        (n) => `
                        <li class="ln-item">
                          <div class="ln-title">${escapeHtml(n.title)}</div>
                          <div class="ln-desc">${escapeHtml(
                            n.description
                          )}</div>
                        </li>`
                      )
                      .join("")
                  : `<li class="ln-empty">No notes</li>`;
              return `
                <div class="ln-card">
                  <div class="channel-name">${escapeHtml(ch.channelName)}</div>
                  <div class="ln-subsection">
                    <div class="ln-subtitle">Links</div>
                    <ul class="ln-list">${links}</ul>
                  </div>
                  <div class="ln-subsection">
                    <div class="ln-subtitle">Notes</div>
                    <ul class="ln-list">${notes}</ul>
                  </div>
                </div>`;
            })
            .join("")
        : `<div class="ln-card empty">
            <div class="channel-name">No links or notes found</div>
            <div class="ln-empty">Add channel links/notes to include them here.</div>
          </div>`;

    const logoMarkup = logoDataUrl
      ? `<img src="${logoDataUrl}" alt="Hexavia logo" class="logo" />`
      : `<div class="logo fallback">HEX</div>`;

    const channelCountLabel =
      channels.length === 0
        ? "All projects"
        : `${channels.length} project${channels.length === 1 ? "" : "s"} selected`;

    return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>Tasks Report</title>
<style>
  body {
    font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Inter, "Helvetica Neue", Arial, sans-serif;
    background: #eef2ff;
    color: #111827;
    margin: 0;
  }
  .page {
    width: 100%;
    padding: 32px 24px 48px;
  }
  .report-surface {
    max-width: 1000px;
    margin: 0 auto;
    background: #fff;
    border-radius: 32px;
    padding: 32px;
    box-shadow: 0 25px 60px rgba(15, 23, 42, 0.15);
  }
  .report-header {
    display: flex;
    justify-content: space-between;
    gap: 24px;
    align-items: flex-start;
  }
  .brand {
    display: flex;
    gap: 14px;
    align-items: center;
  }
  .logo {
    width: 56px;
    height: 56px;
    border-radius: 18px;
    object-fit: contain;
    background: #111827;
    padding: 6px;
  }
  .logo.fallback {
    display: flex;
    justify-content: center;
    align-items: center;
    color: #fff;
    font-weight: 700;
    letter-spacing: 0.08em;
    background: #111827;
  }
  .brand-copy {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .brand-copy .h1 {
    font-size: 26px;
    margin: 0;
    font-weight: 700;
  }
  .brand-subtitle {
    color: #6b7280;
    font-size: 14px;
  }
  .header-chips {
    display: flex;
    flex-direction: column;
    gap: 6px;
    align-items: flex-end;
  }
  .chip {
    border-radius: 999px;
    padding: 6px 14px;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    background: #eef2ff;
    color: #312e81;
  }
  .chip.subtle {
    background: #f3f4f6;
    color: #4b5563;
  }
  .muted {
    color: #6b7280;
    font-size: 13px;
  }
  .report-meta {
    margin-top: 24px;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 12px 20px;
    font-size: 13px;
    color: #475467;
  }
  .stat-grid {
    margin-top: 24px;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 14px;
  }
  .stat-card {
    border: 1px solid #e5e7eb;
    border-radius: 20px;
    padding: 16px;
    background: #f9fafb;
  }
  .stat-card .label {
    font-size: 11px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #6b7280;
  }
  .stat-card .value {
    margin-top: 8px;
    font-size: 24px;
    font-weight: 700;
    color: #111827;
  }
  .completion-card {
    margin-top: 18px;
    padding: 20px;
    border-radius: 22px;
    background: linear-gradient(135deg, #4338ca, #2563eb);
    color: #fff;
  }
  .completion-title {
    font-size: 14px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    font-weight: 600;
  }
  .completion-subtitle {
    margin-top: 8px;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.85);
  }
  .progress-bar {
    margin-top: 12px;
    height: 10px;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 999px;
    overflow: hidden;
  }
  .progress-fill {
    height: 100%;
    border-radius: 999px;
    background: #84d0ff;
  }
  .completion-details {
    margin-top: 10px;
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.85);
  }
  .legend {
    margin-top: 16px;
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    font-size: 12px;
    color: #475467;
  }
  .legend-item {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .legend-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    display: inline-block;
  }
  .ln-section {
    margin-top: 32px;
  }
  .ln-card {
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 18px;
    padding: 14px 16px;
    margin-bottom: 12px;
  }
  .ln-subsection {
    margin-top: 12px;
  }
  .ln-subtitle {
    font-size: 12px;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin-bottom: 6px;
  }
  .ln-list {
    margin: 0;
    padding-left: 16px;
  }
  .ln-item {
    margin-bottom: 8px;
  }
  .ln-title {
    font-weight: 600;
    color: #111827;
    margin-bottom: 2px;
  }
  .ln-url {
    font-size: 12px;
    color: #2563eb;
    word-break: break-all;
  }
  .ln-desc {
    font-size: 12px;
    color: #6b7280;
  }
  .ln-empty {
    font-size: 12px;
    color: #9ca3af;
  }
  .channel-section,
  .table-section {
    margin-top: 32px;
  }
  .section-heading {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    font-weight: 600;
    font-size: 16px;
  }
  .channel-grid {
    margin-top: 12px;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 14px;
  }
  .channel-card {
    border: 1px solid #e5e7eb;
    border-radius: 18px;
    padding: 14px;
    background: #fafafc;
  }
  .channel-card.empty {
    border-style: dashed;
    text-align: center;
  }
  .channel-name {
    font-weight: 600;
    margin-bottom: 6px;
    color: #111827;
  }
  .channel-stats {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 10px;
  }
  .channel-stat {
    font-size: 12px;
    color: #475467;
  }
  .table-wrapper {
    margin-top: 12px;
    border-radius: 20px;
    overflow: hidden;
    border: 1px solid #e5e7eb;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
  }
  thead {
    background: #111827;
    color: #fff;
  }
  th {
    padding: 12px;
    text-align: left;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  td {
    padding: 11px 12px;
    border-bottom: 1px solid #e5e7eb;
    color: #1f2937;
    vertical-align: middle;
  }
  tbody tr:nth-child(odd) {
    background: #f8fafc;
  }
  .task-title {
    font-weight: 600;
    color: #0f172a;
  }
  .status-pill {
    border-radius: 999px;
    padding: 4px 12px;
    font-size: 11px;
    text-transform: capitalize;
    letter-spacing: 0.04em;
    display: inline-flex;
    align-items: center;
  }
  .empty-row {
    text-align: center;
    padding: 24px 0;
    color: #6b7280;
  }
  .footer {
    margin-top: 32px;
    font-size: 11px;
    color: #6b7280;
    letter-spacing: 0.08em;
    text-align: right;
  }
</style>
</head>
<body>
  <div class="page">
    <div class="report-surface">
      <div class="report-header">
        <div class="brand">
          ${logoMarkup}
          <div class="brand-copy">
            <div class="h1">Project Tasks Report</div>
            <div class="brand-subtitle">${projectName || "Untitled Project"}</div>
            <div class="muted">Generated: ${fmt(new Date())}</div>
          </div>
        </div>
        <div class="header-chips">
          <div class="chip">HEXAVIA</div>
          <div class="chip subtle">${channelCountLabel}</div>
        </div>
      </div>

      <div class="report-meta">
        <div><strong>Project:</strong> ${projectName || "—"}</div>
        <div><strong>Report Period:</strong> ${period.start} — ${period.end}</div>
        <div><strong>Projects:</strong> ${
          channels.length ? channels.join(", ") : "All projects"
        }</div>
        <div><strong>Status Filter:</strong> not-started, in-progress, completed</div>
      </div>

      <div class="stat-grid">
        ${statCards}
      </div>

      <div class="completion-card">
        <div class="completion-title">Completion Rate</div>
        <div class="completion-subtitle">
          ${summary.completionRate}% of tasks are marked complete within the period.
        </div>
        <div class="progress-bar">
          <div
            class="progress-fill"
            style="width:${summary.completionRate}%;"
          ></div>
        </div>
        <div class="completion-details">
          <span>Overdue: <strong>${summary.overdue}</strong></span>
          <span>${rows.length} filtered task${rows.length === 1 ? "" : "s"}</span>
        </div>
      </div>

      <div class="legend">
        ${legendItems}
      </div>

      <div class="channel-section">
        <div class="section-heading">
          <div>Per-channel summary</div>
          <div class="muted">Breakdown by project</div>
        </div>
        <div class="channel-grid">
          ${channelSection}
        </div>
      </div>

      <div class="ln-section">
        <div class="section-heading">
          <div>Channel links & notes</div>
          <div class="muted">Resources captured during the period</div>
        </div>
        ${extrasSection}
      </div>

      <div class="table-section">
        <div class="section-heading">
          <div>Task list</div>
          <div class="muted">Detailed view of selected statuses</div>
        </div>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Task</th>
                <th>Status</th>
                <th>Project</th>
                <th>Created</th>
                <th>Updated</th>
                <th>Due</th>
              </tr>
            </thead>
            <tbody>
              ${tableBody}
            </tbody>
          </table>
        </div>
      </div>

      <div class="footer">Hexavia • Auto-generated report</div>
    </div>
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
      const extras = await Promise.all(
        values.channelIds.map(async (id) => {
          const [links, notes] = await Promise.all([
            dispatch(fetchChannelLinks(id))
              .unwrap()
              .catch(() => []),
            dispatch(fetchChannelNotes(id))
              .unwrap()
              .catch(() => []),
          ]);
          const ch = idToChannel.get(id);
          return {
            channelId: id,
            channelName: ch?.name ?? id,
            links: Array.isArray(links) ? links : [],
            notes: Array.isArray(notes) ? notes : [],
          } as ChannelExtras;
        })
      );
      const rows = getRowsFromSelection(values.channelIds);
      const summary = buildSummary(rows);
      const html = htmlForPDF({
        projectName: values.projectName,
        period: { start: fmt(values.startDate), end: fmt(values.endDate) },
        channels: selectedNames,
        rows,
        summary,
        extras,
      });
      const project = slugFileName(values.projectName);
      const start = values.startDate ? yyyymmdd(values.startDate) : "start";
      const end = values.endDate ? yyyymmdd(values.endDate) : "end";

      const filename = `${project}_${start}_to_${end}.pdf`;

      const result = await Print.printToFileAsync({
        html,
        base64: Platform.OS === "web",
      });

      setLastPdfUri(result.uri);
      let shareUri = result.uri;

      if (Platform.OS !== "web") {
        const dest = FileSystem.documentDirectory + filename;
        await FileSystem.copyAsync({ from: result.uri, to: dest });
        shareUri;
        shareUri = dest;
        setLastPdfUri(dest);
      }

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
        await Sharing.shareAsync(shareUri, {
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
        style={{ marginTop: Platform.select({ android: 60, ios: 20 }) }}
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
        <Text className="mt-5 text-lg font-kumbh text-black">Projects</Text>
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
