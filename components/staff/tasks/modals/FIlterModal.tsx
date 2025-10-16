import { StatusKey, TAB_ORDER } from "@/features/staff/types";
import React, { useState } from "react";
import { Keyboard, TouchableWithoutFeedback } from "react-native";
import { Platform } from "react-native";
import {
  KeyboardAvoidingView,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

export type FilterState = {
  channelCode: string;
  statuses: StatusKey[];
};

export default function FilterModal({
  visible,
  initial,
  onClose,
  onApply,
}: {
  visible: boolean;
  initial: FilterState;
  onClose: () => void;
  onApply: (f: FilterState) => void;
}) {
  const [channelCode, setChannelCode] = useState(initial.channelCode);
  const [statuses, setStatuses] = useState<StatusKey[]>(initial.statuses);

  const toggle = (s: StatusKey) => {
    setStatuses((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const reset = () => {
    setChannelCode("");
    setStatuses([]);
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0} // bump this if you have a custom header
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="flex-1 bg-black/40 justify-end">
            <View className="bg-white rounded-t-3xl px-5 py-8">
              <Text className="font-kumbh text-[18px] text-[#111827]">
                Filter Tasks
              </Text>

              <TextInput
                value={channelCode}
                onChangeText={setChannelCode}
                placeholder="Channel code"
                placeholderTextColor="#9CA3AF"
                className="font-kumbh mt-4 rounded-xl bg-[#F3F4F6] px-4 py-3 text-[#111827]"
              />

              <Text className="font-kumbh text-[#6B7280] mt-4 mb-2">
                Statuses
              </Text>
              <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                {TAB_ORDER.map((s) => {
                  const selected = statuses.includes(s);
                  return (
                    <Pressable
                      key={s}
                      onPress={() => toggle(s)}
                      className="rounded-full px-4 py-2"
                      style={{
                        backgroundColor: selected ? "#111827" : "#E5E7EB",
                      }}
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

              <View className="flex-row justify-between items-center mt-6">
                <Pressable onPress={reset}>
                  <Text className="font-kumbh text-[#EF4444]">Reset</Text>
                </Pressable>
                <View className="flex-row items-center" style={{ gap: 12 }}>
                  <Pressable onPress={onClose}>
                    <Text className="font-kumbh text-[#6B7280]">Cancel</Text>
                  </Pressable>
                  <Pressable
                    onPress={() =>
                      onApply({ channelCode: channelCode.trim(), statuses })
                    }
                    className="rounded-xl px-5 py-3"
                    style={{ backgroundColor: "#4C5FAB" }}
                  >
                    <Text className="font-kumbh text-white">Apply</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
}
