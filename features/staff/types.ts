export type StatusKey =
  | "in-progress"
  | "not_started"
  | "completed"
  | "canceled";

export type Task = {
  id: string;
  title: string;
  description?: string;
  channelCode: string;
  channelId?: string;
  status: StatusKey;
  createdAt: number;
};

export const TAB_ORDER: StatusKey[] = [
  "in-progress",
  "not_started",
  "completed",
  "canceled",
];

export const STATUS_META: Record<
  StatusKey,
  { title: string; bgColor: string; arrowBg: string }
> = {
  "in-progress": {
    title: "In Progress",
    bgColor: "#3BA0F5",
    arrowBg: "#1E8AE4",
  },
  not_started: { title: "Not Started", bgColor: "#F6A94A", arrowBg: "#E48914" },
  completed: { title: "Completed", bgColor: "#29C57A", arrowBg: "#1AA962" },
  canceled: { title: "Canceled", bgColor: "#EF4444", arrowBg: "#DC2626" },
};
