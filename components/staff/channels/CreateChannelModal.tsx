import React, { useState } from "react";
import {
  Modal,
  Pressable,
  View,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { X } from "lucide-react-native";

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function CreateChannelModal({ visible, onClose }: Props) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [code, setCode] = useState("#0101");

  const handleSubmit = () => {
    // No-op for now — API wiring comes later.
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      {/* Backdrop (tap outside to close) */}
      <Pressable
        onPress={onClose}
        className="flex-1 bg-black/40"
        style={{ justifyContent: "center", paddingHorizontal: 20 }}
      >
        {/* Content (prevent backdrop press) */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="w-full"
        >
          <Pressable onPress={() => {}} className="">
            <View className="bg-white rounded-3xl p-5">
              {/* Header */}
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-[18px] font-kumbhBold text-gray-900">
                  Create Channel
                </Text>
                <Pressable
                  onPress={onClose}
                  className="h-9 w-9 rounded-xl bg-gray-100 items-center justify-center"
                  accessibilityLabel="Close modal"
                >
                  <X size={18} color="#111827" />
                </Pressable>
              </View>

              {/* Fields */}
              <View className="mb-3">
                <Text className="text-[12px] text-gray-500 mb-1">Name of Channel</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter Name of Channel"
                  className="h-12 px-4 rounded-2xl bg-gray-100 text-gray-900"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View className="mb-3">
                <Text className="text-[12px] text-gray-500 mb-1">Descriptions</Text>
                <TextInput
                  value={desc}
                  onChangeText={setDesc}
                  placeholder="Add a short description"
                  className="px-4 pt-3 pb-3 rounded-2xl bg-gray-100 text-gray-900"
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View className="mb-5">
                <Text className="text-[12px] text-gray-500 mb-1">Code</Text>
                <TextInput
                  value={code}
                  onChangeText={setCode}
                  placeholder="#0101"
                  className="h-12 px-4 rounded-2xl bg-gray-100 text-gray-900"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="none"
                />
              </View>

              {/* Submit */}
              <Pressable
                onPress={handleSubmit}
                className="h-12 rounded-2xl items-center justify-center bg-[#4C5FAB]"
              >
                <Text className="text-white font-kumbhBold">Create Channel</Text>
              </Pressable>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}
