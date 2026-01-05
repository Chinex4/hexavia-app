import React from "react";
import { Modal, Pressable, Text, View } from "react-native";

type Props = {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View className="flex-1 justify-center items-center bg-black/40">
        <View className="mx-5 w-full max-w-sm rounded-3xl bg-white p-5">
          <Text className="font-kumbhBold text-lg text-gray-900">{title}</Text>
          {message ? (
            <Text className="mt-2 text-sm text-gray-500">{message}</Text>
          ) : null}
          <View className="mt-4 flex-row justify-end gap-3">
            <Pressable
              onPress={onCancel}
              className="rounded-xl border border-gray-200 px-4 py-2"
            >
              <Text className="font-kumbh text-sm text-gray-600">
                {cancelLabel}
              </Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              className="rounded-xl bg-[#DC2626] px-4 py-2"
            >
              <Text className="font-kumbh text-sm text-white">
                {confirmLabel}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
