import { showError, showSuccess } from "@/components/ui/toast";
import { toApiStatus } from "@/features/client/statusMap";
import { StatusKey, TAB_ORDER } from "@/features/staff/types";
import {
  normalizeCode,
  selectCodeIndex,
  selectMyChannelsByUserId,
} from "@/redux/channels/channels.selectors";
import {
  createChannelTask,
  fetchChannelById,
  fetchChannels,
} from "@/redux/channels/channels.thunks";
import {
  assignPersonalTask,
  createPersonalTask,
  fetchPersonalTasks,
} from "@/redux/personalTasks/personalTasks.thunks";
import { selectUser } from "@/redux/user/user.slice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import React, { useEffect, useMemo, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";

type Mode = "channel" | "personal";

export default function CreateTaskModal({
  visible,
  onClose,
  forcePersonalForUserId,
  hideModeToggle = false,
}: {
  visible: boolean;
  onClose: () => void;
  forcePersonalForUserId?: string | null;
  hideModeToggle?: boolean;
}) {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const loggedInUserId = user?._id ?? null;

  const role = (user?.role || "").toLowerCase();
  const allowPersonalByRole = ["staff", "admin", "super-admin"].includes(role);

  const allowPersonal = forcePersonalForUserId ? true : allowPersonalByRole;

  const channels = useAppSelector((s) =>
    selectMyChannelsByUserId(s, loggedInUserId)
  );
  const codeIndex = useAppSelector(selectCodeIndex);

  const [mode, setMode] = useState<Mode>("channel");
  const isAdminish = ["admin", "super-admin"].includes(
    (user?.role || "").toLowerCase()
  );

  useEffect(() => {
    if (visible) {
      dispatch(fetchChannels());
      setPicking(false);
      setSelectedChannelId(null);

      // Lock to personal if forced
      if (forcePersonalForUserId) {
        setMode("personal");
      } else {
        setMode("channel");
      }
    }
  }, [visible, dispatch, forcePersonalForUserId]);

  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [channelCode, setChannelCode] = useState("");
  const [status, setStatus] = useState<StatusKey>("in-progress");
  const [picking, setPicking] = useState(false);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(
    null
  );

  // if user isn't allowed personal, force channel mode on open/role change
  useEffect(() => {
    if (!allowPersonal && mode === "personal") {
      setMode("channel");
    }
  }, [allowPersonal, mode, visible]);

  const normInput = normalizeCode(channelCode);
  const suggestions = useMemo(() => {
    if (!normInput) return [];
    return channels
      .filter((c: any) => normalizeCode(c?.code).startsWith(normInput))
      .slice(0, 6);
  }, [channels, normInput]);

  const reset = () => {
    setTitle("");
    setDesc("");
    setChannelCode("");
    setStatus("in-progress");
    setPicking(false);
    setSelectedChannelId(null);
    setMode("channel");
  };

  const resolveChannelId = (codeRaw: string): string | null => {
    const norm = normalizeCode(codeRaw);
    if (!norm) return null;
    const viaMap = codeIndex.get(norm);
    if (viaMap) return viaMap;
    const found = (channels as any[]).find(
      (c) => normalizeCode(c?.code) === norm
    );
    return found?._id ?? found?.id ?? null;
  };

  const create = async () => {
    const name = title.trim();
    const description = desc.trim() || null;
    if (!name) return;

    try {
      if (forcePersonalForUserId || mode === "personal") {
        // Personal task flow
        if (isAdminish && forcePersonalForUserId) {
          // Admin/Super-admin assigning to a staff
          await dispatch(
            assignPersonalTask({
              assignedTo: forcePersonalForUserId, // ← staff user id
              name,
              description,
              status: toApiStatus(status) as any,
            })
          ).unwrap();

          await dispatch(fetchPersonalTasks());
          showSuccess("Personal task assigned to staff.");
        } else {
          // Normal personal task for self
          const targetUserId = loggedInUserId;
          if (!targetUserId) {
            showError("User not loaded yet.");
            return;
          }

          await dispatch(
            createPersonalTask({
              name,
              description,
              status: toApiStatus(status) as any,
            })
          ).unwrap();

          await dispatch(fetchPersonalTasks());
          showSuccess("Personal task created.");
        }
      } else {
        // Channel task flow
        const code = channelCode.trim();
        const channelId = selectedChannelId ?? resolveChannelId(code);
        if (!channelId) {
          showError("Project Code not found.");
          return;
        }

        await dispatch(
          createChannelTask({
            channelId,
            name,
            description,
            status: toApiStatus(status),
          })
        ).unwrap();

        await dispatch(fetchChannelById(channelId));
        showSuccess("Channel task created.");
      }

      reset();
      onClose();
    } catch {
      // errors are already surfaced by thunks/toasts in your app
    }
  };

  const chooseSuggestion = (c: any) => {
    setChannelCode(c.code ?? "");
    setSelectedChannelId(c._id ?? c.id ?? null);
    setPicking(false);
  };

  const modes: Mode[] = forcePersonalForUserId
    ? ["personal"]
    : allowPersonal
      ? ["channel", "personal"]
      : ["channel"];

  if (isAdminish && mode === "personal" && !forcePersonalForUserId) {
    showError("Pick a staff member to assign this personal task to.");
    return;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="flex-1 bg-black/40 justify-end">
            <View className="bg-white rounded-t-3xl py-8 px-5">
              <Text className="font-kumbhBold text-[20px] text-[#111827]">
                Create Task
              </Text>

              {!hideModeToggle && (
                <View className="mt-4 flex-row" style={{ gap: 8 }}>
                  {modes.map((m) => {
                    const selected = m === mode;
                    return (
                      <Pressable
                        key={m}
                        onPress={() => setMode(m)}
                        className="rounded-full px-4 py-2"
                        style={{
                          backgroundColor: selected ? "#111827" : "#E5E7EB",
                        }}
                      >
                        <Text
                          className="font-kumbh text-[12px]"
                          style={{ color: selected ? "#FFFFFF" : "#111827" }}
                        >
                          {m === "channel"
                            ? "Assign to Channel"
                            : "My Personal Task"}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}

              {!allowPersonal && (
                <Text className="font-kumbh text-[12px] text-[#9CA3AF] mt-2">
                  Personal tasks are only available to staff.
                </Text>
              )}

              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Task title"
                placeholderTextColor="#9CA3AF"
                className="font-kumbh mt-4 rounded-xl bg-[#F3F4F6] px-4 py-3 text-[#111827]"
              />

              <TextInput
                value={desc}
                onChangeText={setDesc}
                placeholder="Task Description"
                placeholderTextColor="#9CA3AF"
                className="font-kumbh mt-3 rounded-xl bg-[#F3F4F6] px-4 py-3 text-[#111827]"
                multiline
              />

              {mode === "channel" && !forcePersonalForUserId && (
                <View className="mt-3">
                  <TextInput
                    value={channelCode}
                    onChangeText={(t) => {
                      setChannelCode(t);
                      setSelectedChannelId(null);
                      setPicking(true);
                    }}
                    placeholder="Project Code (e.g. #1234)"
                    placeholderTextColor="#9CA3AF"
                    className="font-kumbh rounded-xl bg-[#F3F4F6] px-4 py-3 text-[#111827]"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  {picking && suggestions.length > 0 && (
                    <View className="mt-2 rounded-xl border border-gray-200 bg-white max-h-44 overflow-hidden">
                      <ScrollView keyboardShouldPersistTaps="handled">
                        {suggestions.map((c: any) => (
                          <Pressable
                            key={`${c._id ?? c.id}:${(c.code ?? "").toLowerCase()}`}
                            onPress={() => chooseSuggestion(c)}
                            className="px-4 py-3 border-b border-gray-100"
                          >
                            <Text className="font-kumbh text-[#111827]">
                              {c.code ?? "#—"}
                            </Text>
                            <Text className="font-kumbh text-[12px] text-[#6B7280]">
                              {c.name}
                            </Text>
                          </Pressable>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
              )}

              {/* Status */}
              <View className="mt-4">
                <Text className="font-kumbh text-[#6B7280] mb-2">Status</Text>
                <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                  {TAB_ORDER.map((s) => {
                    const selected = s === status;
                    return (
                      <Pressable
                        key={s}
                        onPress={() => setStatus(s)}
                        className="rounded-full px-4 py-2"
                        style={{
                          backgroundColor: selected ? "#111827" : "#E5E7EB",
                        }}
                      >
                        <Text
                          className="font-kumbh text-[12px]"
                          style={{ color: selected ? "#FFFFFF" : "#111827" }}
                        >
                          {s.replace("-", " ")}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View
                className="flex-row justify-end items-center mt-6"
                style={{ gap: 12 }}
              >
                <Pressable onPress={onClose}>
                  <Text className="font-kumbh text-[#6B7280]">Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={create}
                  className="rounded-xl px-5 py-3"
                  style={{ backgroundColor: "#4C5FAB" }}
                >
                  <Text className="font-kumbh text-white">Create</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
}
