import React from "react";
import { Modal, Pressable, Text, View } from "react-native";

export default function UploadChooser({
  visible,
  onClose,
  onPickImage,
  onPickDocument,
}: {
  visible: boolean;
  onClose: () => void;
  onPickImage: () => void;
  onPickDocument: () => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
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
          onPress={() => {
            onPickImage();
            onClose();
          }}
          style={{ paddingVertical: 14 }}
        >
          <Text>Pick Image</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            onPickDocument();
            onClose();
          }}
          style={{ paddingVertical: 14 }}
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
