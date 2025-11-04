import React, { useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Pressable,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
  Platform,
  Keyboard,
} from "react-native";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { StatusKey, TAB_ORDER, Task } from "@/features/staff/types";
import { toApiStatus } from "@/features/client/statusMap";
import { showError } from "@/components/ui/toast";
import { fetchChannelById } from "@/redux/channels/channels.thunks";
import { fetchPersonalTasks } from "@/redux/personalTasks/personalTasks.thunks";
import {
  normalizeCode,
  selectCodeIndex,
} from "@/redux/channels/channels.selectors";
import { api } from "@/api/axios";
import { getToken } from "@/storage/auth";

export default function TaskDetailModal({
  visible,
  onClose,
  task,
}: {
  visible: boolean;
  onClose: () => void;
  task: Task;
}) {
  const dispatch = useAppDispatch();

  const isPersonal = task.channelCode === "personal";

  const codeIndex = useAppSelector(selectCodeIndex);

  const brr = getToken();

  const resolvedChannelId = useMemo(() => {
    if (isPersonal) return undefined;
    if ((task as any).channelId) return String((task as any).channelId);
    const norm = normalizeCode(task.channelCode);
    if (!norm) return undefined;
    const viaIndex = codeIndex.get(norm);
    return viaIndex ? String(viaIndex) : undefined;
  }, [isPersonal, task, codeIndex]);

  const [name, setName] = useState<string>(task.title);
  const [desc, setDesc] = useState<string>(task.description ?? "");
  const [pending, setPending] = useState<StatusKey>(task.status);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setName(task.title);
      setDesc(task.description ?? "");
      setPending(task.status);
    }
  }, [visible, task]);

  const canSave = useMemo(() => {
    const changedText =
      name.trim() !== task.title ||
      (desc.trim() || "") !== (task.description?.trim() || "");
    const changedStatus = pending !== task.status;
    return changedText || changedStatus;
  }, [name, desc, pending, task]);

  const save = async () => {
    if (!canSave || saving) return;

    try {
      setSaving(true);

      const payload = {
        channelId: !isPersonal ? resolvedChannelId : undefined,
        taskId: task.id,
        name: name.trim(),
        description: desc.trim() === "" ? null : desc.trim(),
        status: toApiStatus(pending),
      };

      if (isPersonal) {
        // PERSONAL: direct API call (adjust the path if your final route differs)
        await api.put(
          "/personal-task",
          {
            taskId: payload.taskId,
            name: payload.name,
            description: payload.description,
            status: payload.status,
          },
          brr ? { headers: { Authorization: `BRR ${brr}` } } : undefined
        );

        // Refresh personal list so UI updates
        await dispatch(fetchPersonalTasks());
      } else {
        if (!resolvedChannelId) {
          showError("Could not resolve channel id for this task.");
          setSaving(false);
          return;
        }

        const res = await api.put("/channel/update-task", {
          channelId: resolvedChannelId,
          taskId: payload.taskId,
          name: payload.name,
          description: payload.description,
          status: payload.status,
        });

        console.log(res.data);

        await dispatch(fetchChannelById(resolvedChannelId));
      }

      onClose();
    } catch (err: any) {
      console.log("TaskDetailModal direct API save error:", err);
      showError(err?.message ? String(err.message) : "Failed to save task.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="flex-1 bg-black/40 justify-end">
            <View className="bg-white rounded-t-3xl px-5 py-8">
              <Text className="font-kumbhBold text-[20px] text-[#111827]">Task Details</Text>

              <Text className="font-kumbh text-[#6B7280] mt-2">
                {isPersonal ? "Type: Personal" : `Channel: ${task.channelCode}`}
              </Text>

              <Text className="font-kumbh text-[#6B7280] mt-4 mb-2">Name</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Enter task name"
                className="font-kumbh text-[#111827] border border-[#E5E7EB] rounded-2xl px-4 py-3"
              />

              <Text className="font-kumbh text-[#6B7280] mt-4 mb-2">Description</Text>
              <TextInput
                value={desc}
                onChangeText={setDesc}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                placeholder="Add a short description"
                className="font-kumbh text-[#111827] border border-[#E5E7EB] rounded-2xl px-4 py-3"
                style={{ minHeight: 120 }}
              />

              <Text className="font-kumbh text-[#6B7280] mt-4 mb-2">Change Status</Text>
              <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                {TAB_ORDER.map((s) => {
                  const selected = pending === s;
                  return (
                    <Pressable
                      key={s}
                      onPress={() => setPending(s)}
                      className="rounded-full px-4 py-2"
                      style={{ backgroundColor: selected ? "#111827" : "#E5E7EB" }}
                    >
                      <Text className="font-kumbh text-[12px]" style={{ color: selected ? "#fff" : "#111827" }}>
                        {s.replace("-", " ")}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <View className="flex-row justify-end items-center mt-6" style={{ gap: 12 }}>
                <Pressable disabled={saving} onPress={onClose}>
                  <Text className="font-kumbh text-[#6B7280]">Close</Text>
                </Pressable>
                <Pressable
                  onPress={save}
                  disabled={!canSave || saving}
                  className="rounded-xl px-5 py-3"
                  style={{
                    backgroundColor: !canSave || saving ? "#9CA3AF" : "#4C5FAB",
                    opacity: saving ? 0.8 : 1,
                  }}
                >
                  <Text className="font-kumbh text-white">{saving ? "Saving…" : "Save"}</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
}
