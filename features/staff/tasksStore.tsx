import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type StatusKey =
  | "in-progress"
  | "not-started"
  | "completed"
  | "canceled";

export type Task = {
  id: string;
  title: string;
  description?: string;
  channelCode: string;
  status: StatusKey;
  createdAt: number;
};

type TasksContextValue = {
  tasks: Task[];
  addTask: (t: Omit<Task, "id" | "createdAt">) => void;
  updateStatus: (id: string, status: StatusKey) => void;
  updateTask: (
    id: string,
    patch: Partial<Omit<Task, "id" | "createdAt">>
  ) => void;
  clearAll: () => void;
  hydrated: boolean;
};

const STORAGE_KEY = "@hexavia:tasks";

const TasksContext = createContext<TasksContextValue | null>(null);

export function TasksProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Load from storage once
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed: Task[] = JSON.parse(raw);
          // basic guard
          if (Array.isArray(parsed)) setTasks(parsed);
        }
      } catch {}
      setHydrated(true);
    })();
  }, []);

  // Persist whenever tasks change (after hydration)
  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)).catch(() => {});
  }, [tasks, hydrated]);

  const addTask: TasksContextValue["addTask"] = (t) => {
    setTasks((prev) => [
      { id: Math.random().toString(36).slice(2), createdAt: Date.now(), ...t },
      ...prev,
    ]);
  };

  const updateStatus: TasksContextValue["updateStatus"] = (id, status) => {
    setTasks((prev) => prev.map((x) => (x.id === id ? { ...x, status } : x)));
  };

  const updateTask: TasksContextValue["updateTask"] = (id, patch) => {
    setTasks((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  };

  const clearAll = () => setTasks([]);

  const value = useMemo(
    () => ({ tasks, addTask, updateStatus, updateTask, clearAll, hydrated }),
    [tasks, hydrated]
  );

  return (
    <TasksContext.Provider value={value}>{children}</TasksContext.Provider>
  );
}

export function useTasks() {
  const ctx = useContext(TasksContext);
  if (!ctx) throw new Error("useTasks must be used within TasksProvider");
  return ctx;
}
