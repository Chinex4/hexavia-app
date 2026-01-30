// UploadChooser.tsx
import React from "react";
import { Modal, Pressable, Text, View } from "react-native";

export default function UploadChooser({
  visible,
  onClose,
  onPick,
  onDismiss,
  disabled = false,
}: {
  visible: boolean;
  onClose: () => void;
  onPick: (type: "image" | "doc") => void;
  onDismiss?: () => void; // ✅ add
  disabled?: boolean;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      onDismiss={onDismiss} // ✅ add
    >
      <Pressable
        onPress={onClose}
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.25)" }}
      />
      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "#fff",
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          padding: 20,
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: "600", marginBottom: 12 }}>
          Upload to channel
        </Text>

        <Pressable
          disabled={disabled}
          onPress={() => !disabled && onPick("image")}
          style={{ paddingVertical: 14, opacity: disabled ? 0.5 : 1 }}
        >
          <Text>Pick Image</Text>
        </Pressable>

        <Pressable
          disabled={disabled}
          onPress={() => !disabled && onPick("doc")}
          style={{ paddingVertical: 14, opacity: disabled ? 0.5 : 1 }}
        >
          <Text>Pick File (PDF, audio, etc.)</Text>
        </Pressable>

        <Pressable onPress={onClose} style={{ paddingVertical: 14 }}>
          <Text style={{ color: "#6B7280" }}>Cancel</Text>
        </Pressable>
      </View>
    </Modal>
  );
}
