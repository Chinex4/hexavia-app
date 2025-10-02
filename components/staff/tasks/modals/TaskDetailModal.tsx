import React, { useMemo, useState, useEffect } from "react";
import { Modal, Pressable, Text, TextInput, View } from "react-native";
import { useTasks } from "@/features/staff/tasksStore";
import { StatusKey, TAB_ORDER, Task } from "@/features/staff/types";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { updateChannelTask, fetchChannels } from "@/redux/channels/channels.thunks";
import { selectChannelIdByCode } from "@/redux/channels/channels.slice";

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
  const { updateStatus } = useTasks();

  const channelIdFromCode = useAppSelector(
    selectChannelIdByCode(task.channelCode)
  );

  // (Optional) ensure channels are loaded if id not found yet
  useEffect(() => {
    if (!channelIdFromCode && visible) {
      dispatch(fetchChannels());
    }
  }, [channelIdFromCode, visible, dispatch]);

  const [name, setName] = useState<string>(task.title);
  const [desc, setDesc] = useState<string>(task.description ?? "");
  const [pending, setPending] = useState<StatusKey>(task.status);
  const [saving, setSaving] = useState(false);

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

      const textChanged =
        name.trim() !== task.title ||
        (desc.trim() || "") !== (task.description?.trim() || "");

      // Prefer id derived from code; fall back to any existing task.channelId if present
      const finalChannelId =
        channelIdFromCode ?? (task as any).channelId; // keep this fallback if Task sometimes carries it

      if (textChanged && finalChannelId) {
        await dispatch(
          updateChannelTask({
            channelId: finalChannelId,
            taskId: task.id,
            name: name.trim(),
            description: desc.trim() === "" ? null : desc.trim(),
          })
        ).unwrap();
      }

      if (pending !== task.status) {
        updateStatus(task.id, pending);
      }

      onClose();
    } catch {
      // errors are toasted in the thunk
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
      <View className="flex-1 bg-black/40 justify-end">
        <View className="bg-white rounded-t-3xl px-5 py-8">
          <Text className="font-kumbhBold text-[20px] text-[#111827]">
            Task Details
          </Text>

          {/* Name */}
          <Text className="font-kumbh text-[#6B7280] mt-4 mb-2">Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Enter task name"
            className="font-kumbh text-[#111827] border border-[#E5E7EB] rounded-2xl px-4 py-3"
          />

          {/* Description */}
          <Text className="font-kumbh text-[#6B7280] mt-4 mb-2">
            Description
          </Text>
          <TextInput
            value={desc}
            onChangeText={setDesc}
            placeholder="Add a short description"
            multiline
            textAlignVertical="top"
            numberOfLines={4}
            className="font-kumbh text-[#111827] border border-[#E5E7EB] rounded-2xl px-4 py-3"
            style={{ minHeight: 120 }}
          />

          {/* Meta */}
          <Text className="font-kumbh text-[#6B7280] mt-3">
            Channel: {task.channelCode}
          </Text>

          {/* Status */}
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
                  style={{ backgroundColor: selected ? "#111827" : "#E5E7EB" }}
                >
                  <Text
                    className="font-kumbh text-[12px]"
                    style={{ color: selected ? "#fff" : "#111827" }}
                  >
                    {s.replace("_", " ")}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Actions */}
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
    </Modal>
  );
}
