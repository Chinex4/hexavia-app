import React, { useState } from "react";
import { View, TextInput, Pressable, Text } from "react-native";
import { Paperclip, Camera, Mic, Send, X } from "lucide-react-native";
import type { ReplyMeta } from "@/types/chat";

type Props = {
  onSend: (text: string) => void;
  onToggleTray: () => void;
  trayOpen: boolean;
  replyTo?: ReplyMeta | null;
  onCancelReply?: () => void;
  // NEW
  isRecording?: boolean;
  recordDurationMs?: number;
  onMicPress?: () => void; // start/stop
  onCancelRecording?: () => void;
};

export default function Composer({
  onSend,
  onToggleTray,
  trayOpen,
  replyTo,
  onCancelReply,
  isRecording,
  recordDurationMs = 0,
  onMicPress,
  onCancelRecording,
}: Props) {
  const [text, setText] = useState("");
  const mm = Math.floor(recordDurationMs / 60000);
  const ss = Math.floor((recordDurationMs % 60000) / 1000);
  const durText = `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;

  const commit = () => {
    const val = text.trim();
    if (!val) return;
    onSend(val);
    setText("");
  };

  return (
    <View className="px-5 pb-3 bg-white">
      {/* Reply bar */}
      {replyTo ? (
        <View className="mb-2 px-4 py-2 rounded-2xl bg-[#E1E4F6] flex-row items-start">
          <View className="flex-1">
            <Text className="text-[12px] text-gray-500 font-kumbhBold">
              {replyTo.senderName}
            </Text>
            <Text className="text-[12px] text-gray-700" numberOfLines={2}>
              {replyTo.preview}
            </Text>
          </View>
          <Pressable
            onPress={onCancelReply}
            className="h-6 w-6 ml-2 rounded-lg bg-white/60 items-center justify-center"
          >
            <X size={14} color="#111827" />
          </Pressable>
        </View>
      ) : null}

      {isRecording ? (
        <View className="mb-2 px-4 py-2 rounded-2xl bg-[#FFEFEF] flex-row items-center justify-between">
          <Text className="text-[13px] text-red-600 font-kumbhBold">
            ● Recording {durText}
          </Text>
          <Pressable
            onPress={onCancelRecording}
            className="h-6 px-3 rounded-lg bg-red-100 items-center justify-center"
          >
            <Text className="text-[12px] text-red-700">Cancel</Text>
          </Pressable>
        </View>
      ) : null}

      <View className="flex-row items-end">
        {/* Input area */}
        <View className="flex-1 bg-gray-100 rounded-full flex-row items-center pl-4 pr-2 min-h-12">
          {!isRecording && (
            <Pressable onPress={onToggleTray} className="mr-2">
              <Paperclip size={20} color="#111827" />
            </Pressable>
          )}

          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Send Message"
            placeholderTextColor="#9CA3AF"
            className="flex-1 text-gray-900 py-2"
            style={{ fontFamily: "KumbhSans-Regular" }}
            multiline
            blurOnSubmit={false}
            returnKeyType="default"
          />
        </View>

        {/* Mic / Send */}
        <Pressable
          onPress={text.trim() ? commit : onMicPress}
          className="ml-3 h-12 w-12 rounded-full items-center justify-center"
          style={{ backgroundColor: "#4C5FAB" }}
        >
          {text.trim() ? (
            <Send size={20} color="#fff" />
          ) : isRecording ? (
            <Send size={20} color="#fff" />
          ) : (
            <Mic size={20} color="#fff" />
          )}
        </Pressable>
      </View>

      {trayOpen ? (
        <Text className="text-[11px] text-gray-400 mt-2 ml-1">
          Attach a Picture, Audio, Camera, or Document.
        </Text>
      ) : null}
    </View>
  );
}
