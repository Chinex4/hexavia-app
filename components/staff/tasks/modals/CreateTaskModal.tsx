import { useTasks } from "@/features/staff/tasksStore";
import { StatusKey, TAB_ORDER } from "@/features/staff/types";
import React, { useState } from "react";
import { Modal, Pressable, Text, TextInput, View } from "react-native";

export default function CreateTaskModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { addTask } = useTasks();
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [channelCode, setChannelCode] = useState("");
  const [status, setStatus] = useState<StatusKey>("in_progress");

  const reset = () => {
    setTitle(""); setDesc(""); setChannelCode(""); setStatus("in_progress");
  };

  const create = () => {
    if (!title.trim() || !channelCode.trim()) return;
    addTask({ title: title.trim(), description: desc.trim(), channelCode: channelCode.trim(), status });
    reset();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 bg-black/40 justify-end">
        <View className="bg-white rounded-t-3xl py-8 px-5">
          <Text className="font-kumbhBold text-[20px] text-[#111827]">Create Task</Text>

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
            placeholder="Description (optional)"
            placeholderTextColor="#9CA3AF"
            className="font-kumbh mt-3 rounded-xl bg-[#F3F4F6] px-4 py-3 text-[#111827]"
            multiline
          />

          <TextInput
            value={channelCode}
            onChangeText={setChannelCode}
            placeholder="Channel code (e.g. HEX-PRJ-001)"
            placeholderTextColor="#9CA3AF"
            className="font-kumbh mt-3 rounded-xl bg-[#F3F4F6] px-4 py-3 text-[#111827]"
          />

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
                      {s.replace("_", " ")}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View className="flex-row justify-end items-center mt-6" style={{ gap: 12 }}>
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
    </Modal>
  );
}
