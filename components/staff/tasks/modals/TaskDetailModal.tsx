import { useTasks } from "@/features/staff/tasksStore";
import { StatusKey, TAB_ORDER, Task } from "@/features/staff/types";
import React, { useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";

export default function TaskDetailModal({
  visible,
  onClose,
  task,
}: {
  visible: boolean;
  onClose: () => void;
  task: Task;
}) {
  const { updateStatus } = useTasks();
  const [pending, setPending] = useState<StatusKey>(task.status);

  const save = () => {
    updateStatus(task.id, pending);
    onClose();
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
          <Text className="font-kumbh text-[#111827] mt-3">{task.title}</Text>
          {task.description ? (
            <Text className="font-kumbh text-[#6B7280] mt-1">
              {task.description}
            </Text>
          ) : null}
          <Text className="font-kumbh text-[#6B7280] mt-2">
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

          <View className="flex-row justify-end items-center mt-6" style={{ gap: 12 }}>
            <Pressable onPress={onClose}>
              <Text className="font-kumbh text-[#6B7280]">Close</Text>
            </Pressable>
            <Pressable
              onPress={save}
              className="rounded-xl px-5 py-3"
              style={{ backgroundColor: "#4C5FAB" }}
            >
              <Text className="font-kumbh text-white">Save</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
