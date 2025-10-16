// components/staff/tasks/modals/TaskDetailModal.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Pressable,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  updateChannelTask,
  fetchChannels,
  fetchChannelById,
} from "@/redux/channels/channels.thunks";
import { selectChannelIdByCode } from "@/redux/channels/channels.slice";
import { StatusKey, TAB_ORDER, Task } from "@/features/staff/types";
import { toApiStatus } from "@/features/client/statusMap";
import { showError } from "@/components/ui/toast";
import { Keyboard } from "react-native";
import { Platform } from "react-native";

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
  const channelIdFromCode = useAppSelector(
    selectChannelIdByCode(task.channelCode)
  );
  useEffect(() => {
    if (!channelIdFromCode && visible) dispatch(fetchChannels());
  }, [channelIdFromCode, visible, dispatch]);

  const [name, setName] = useState<string>(task.title);
  const [desc, setDesc] = useState<string>(task.description ?? "");
  const [pending, setPending] = useState<StatusKey>(task.status);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      // sync fields when reopened
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
    const channelId = channelIdFromCode ?? (task as any).channelId;
    if (!channelId) return;

    try {
      setSaving(true);

      // update text if changed
      const textChanged =
        name.trim() !== task.title ||
        (desc.trim() || "") !== (task.description?.trim() || "");
      if (textChanged) {
        await dispatch(
          updateChannelTask({
            channelId,
            taskId: task.id,
            name: name.trim(),
            description: desc.trim() === "" ? null : desc.trim(),
          })
        ).unwrap();
      }

      // update status if changed
      if (pending !== task.status) {
        await dispatch(
          updateChannelTask({
            channelId,
            taskId: task.id,
            status: toApiStatus(pending),
            name,
            description: desc,
          })
        ).unwrap();
      }

      // refresh the channel to get latest tasks
      await dispatch(fetchChannelById(channelId));

      onClose();
    } catch (msg) {
      // err handled in thunk
      showError(String(msg));
    } finally {
      setSaving(false);
    }
  };

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
        keyboardVerticalOffset={0} // bump this if you have a custom header
      >
        {/* tap outside to dismiss keyboard */}
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="flex-1 bg-black/40 justify-end">
            <View className="bg-white rounded-t-3xl px-5 py-8">
              <Text className="font-kumbhBold text-[20px] text-[#111827]">
                Task Details
              </Text>

              <Text className="font-kumbh text-[#6B7280] mt-4 mb-2">Name</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Enter task name"
                className="font-kumbh text-[#111827] border border-[#E5E7EB] rounded-2xl px-4 py-3"
              />

              <Text className="font-kumbh text-[#6B7280] mt-4 mb-2">
                Description
              </Text>
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

              <Text className="font-kumbh text-[#6B7280] mt-3">
                Channel: {task.channelCode}
              </Text>

              <Text className="font-kumbh text-[#6B7280] mt-4 mb-2">
                Change Status
              </Text>
              <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                {TAB_ORDER.map((s) => {
                  const selected = pending === s;
                  return (
                    <Pressable
                      key={s}
                      onPress={() => setPending(s)}
                      className="rounded-full px-4 py-2"
                      style={{
                        backgroundColor: selected ? "#111827" : "#E5E7EB",
                      }}
                    >
                      <Text
                        className="font-kumbh text-[12px]"
                        style={{ color: selected ? "#fff" : "#111827" }}
                      >
                        {s.replace("-", " ")}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <View
                className="flex-row justify-end items-center mt-6"
                style={{ gap: 12 }}
              >
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
                  <Text className="font-kumbh text-white">
                    {saving ? "Saving…" : "Save"}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
}
