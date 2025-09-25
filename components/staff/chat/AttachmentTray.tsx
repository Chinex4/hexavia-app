import React from "react";
import { View, Text } from "react-native";
import {
  Image as ImageIcon,
  FileAudio,
  Camera,
  FileText,
} from "lucide-react-native";
import type { AttachmentKind } from "@/types/chat";
import { Pressable } from "react-native";

const items: { key: AttachmentKind; label: string; Icon: any }[] = [
  { key: "gallery", label: "Gallery", Icon: ImageIcon },
  { key: "audio", label: "Audio", Icon: FileAudio },
  { key: "camera", label: "Camera", Icon: Camera },
  { key: "document", label: "Document", Icon: FileText },
];

export default function AttachmentTray({
  onPick,
}: {
  onPick: (kind: AttachmentKind) => void;
}) {
  return (
    <View className="mx-5 mb-2 p-4 rounded-3xl bg-[#E1E4F6]">
      <View className="flex-row items-center justify-between">
        {items.map(({ key, label, Icon }) => (
          <Pressable
            key={key}
            onPress={() => onPick(key)}
            className="items-center justify-center"
          >
            <View className="h-14 w-14 rounded-2xl bg-white/40 items-center justify-center mb-2">
              <Icon size={22} color="#4C5FAB" />
            </View>
            <Text className="text-gray-700 text-[12px]">{label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
