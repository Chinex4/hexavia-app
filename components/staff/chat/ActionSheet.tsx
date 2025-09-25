import React from "react";
import { Modal, View, Pressable, Text } from "react-native";

type Item = {
  key: string;
  label: string;
  danger?: boolean;
  onPress: () => void;
};

export default function ActionSheet({
  visible,
  onClose,
  items,
}: {
  visible: boolean;
  onClose: () => void;
  items: Item[];
}) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable onPress={onClose} className="flex-1 bg-black/40">
        <View className="absolute left-0 right-0 bottom-0 rounded-t-3xl bg-white p-4">
          {items.map((it, idx) => (
            <Pressable
              key={it.key}
              onPress={() => {
                onClose();
                setTimeout(it.onPress, 0);
              }}
              className={`h-12 rounded-2xl px-4 justify-center ${idx > 0 ? "mt-2" : ""} ${it.danger ? "bg-red-50" : "bg-gray-100"}`}
            >
              <Text
                className={`text-[15px] ${it.danger ? "text-red-600" : "text-gray-900"} font-kumbhBold`}
              >
                {it.label}
              </Text>
            </Pressable>
          ))}
          <Pressable
            onPress={onClose}
            className="h-12 rounded-2xl px-4 justify-center mt-3 bg-gray-200"
          >
            <Text className="text-center text-[15px] text-gray-700 font-kumbhBold">
              Cancel
            </Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}
