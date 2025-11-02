export type PersonalApiStatus =
  | "not-started"
  | "in-progress"
  | "completed"
  | "canceled";

export interface PersonalTaskApi {
  _id: string;
  userId: string;
  name: string;
  description?: string | null;
  status: PersonalApiStatus;
  createdAt: string | number;
  updatedAt?: string | number;
}

export interface PersonalTaskUI {
  id: string;
  title: string;
  description: string | null;
  status: PersonalApiStatus;
  createdAt: number;
  updatedAt?: number;
  channelCode?: "personal";
  channelId?: "personal";
}

export interface PersonalTasksState {
  items: Record<string, PersonalTaskUI>;
  order: string[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error?: string | null;
}
