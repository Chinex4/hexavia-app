import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, TextInput, Pressable, Text, FlatList } from "react-native";
import { Paperclip, Mic, Send, X } from "lucide-react-native";
import type { ReplyMeta } from "@/types/chat";
import type { Mentionable } from "@/utils/handles";

type Props = {
  onSend: (text: string) => void;
  value?: string;
  onChangeText?: (text: string) => void;
  onToggleTray: () => void;
  trayOpen: boolean;
  replyTo?: ReplyMeta | null;
  onCancelReply?: () => void;
  isRecording?: boolean;
  recordDurationMs?: number;
  onMicPress?: () => void;
  onCancelRecording?: () => void;
  mentionables: Mentionable[]; // ← NEW
};

export default function Composer({
  onSend,
  value,
  onChangeText,
  onToggleTray,
  trayOpen,
  replyTo,
  onCancelReply,
  isRecording,
  recordDurationMs = 0,
  onMicPress,
  onCancelRecording,
  mentionables,
}: Props) {
  const [text, setText] = useState(value ?? "");
  const [query, setQuery] = useState(""); // after "@"
  const [open, setOpen] = useState(false); // show typeahead
  const inputRef = useRef<TextInput>(null);

  const mm = Math.floor(recordDurationMs / 60000);
  const ss = Math.floor((recordDurationMs % 60000) / 1000);
  const durText = `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;

  useEffect(() => {
    if (value === undefined) return;
    if (value !== text) setText(value);
  }, [value, text]);

  // Filter mention suggestions by query
  const results = useMemo(() => {
    if (!open) return [];
    const q = query.trim().toLowerCase();
    if (!q) return mentionables.slice(0, 6);
    return mentionables
      .filter((m) => m.name.toLowerCase().includes(q) || m.handle.includes(q))
      .slice(0, 8);
  }, [open, query, mentionables]);

  // Detect an active "@..." token at the caret (end of input)
  const detectMention = (val: string) => {
    // Only look at the tail to keep it fast
    const tail = val.slice(Math.max(0, val.length - 48)); // last 48 chars
    // Matches: start or whitespace, then "@", then up to 30 non-space, non-"@" chars
    const m = tail.match(/(?:^|\s)@([^\s@]{0,30})$/);
    if (m) {
      setQuery(m[1] || "");
      setOpen(true);
    } else {
      setOpen(false);
      setQuery("");
    }
  };

  const onChange = (val: string) => {
    setText(val);
    onChangeText?.(val);
    if (!isRecording) detectMention(val);
  };

  // Insert selected mention → replaces current "@query" with "@handle "
  const insertMention = (m: Mentionable) => {
    const idx = text.lastIndexOf("@");
    if (idx < 0) return;
    // ensure we replace only the active tail token
    const before = text.slice(0, idx);
    const after = text.slice(idx).replace(/^@[^\s@]*/, "@" + m.handle) + " ";
    const combined = before + after;
    setText(combined);
    setOpen(false);
    setQuery("");
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const commit = () => {
    const val = text.trim();
    if (!val) return;
    onSend(val); // no backend change; we send plain text containing @handles
    setText("");
    onChangeText?.("");
    setOpen(false);
    setQuery("");
  };

  return (
    <View className="px-5 pb-3 bg-white">
      {/* Mention list */}
      {open && results.length ? (
        <View
          className="mb-2 rounded-2xl bg-white border border-gray-200 shadow"
          style={{ maxHeight: 220 }}
        >
          <View className="flex-row items-center justify-between px-3 py-2">
            <Text className="text-[12px] text-gray-700 font-kumbhBold">
              Mention someone
            </Text>
            <Pressable onPress={() => setOpen(false)} hitSlop={8}>
              <X size={14} color="#6B7280" />
            </Pressable>
          </View>
          <FlatList
            data={results}
            keyExtractor={(m) => m.id}
            keyboardShouldPersistTaps="always"
            showsVerticalScrollIndicator
            style={{ maxHeight: 180 }}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => insertMention(item)}
                className="px-3 py-2 rounded-xl flex-row items-center"
              >
                <View className="flex-1">
                  <Text className="text-[13px] text-gray-900 font-kumbhBold">
                    {item.name}
                  </Text>
                  <Text className="text-[11px] text-gray-500">
                    @{item.handle}
                  </Text>
                </View>
                <Text className="text-[12px] text-[#4C5FAB] font-kumbhBold">
                  Mention
                </Text>
              </Pressable>
            )}
          />
        </View>
      ) : null}

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
        {/* Input */}
        <View className="flex-1 bg-gray-100 rounded-full flex-row items-center pl-4 pr-2 min-h-12">
          {!isRecording && (
            <Pressable onPress={onToggleTray} className="mr-2">
              <Paperclip size={20} color="#111827" />
            </Pressable>
          )}

          <TextInput
            ref={inputRef}
            value={text}
            onChangeText={onChange}
            placeholder="Send Message — try @ to mention"
            placeholderTextColor="#9CA3AF"
            className="flex-1 text-gray-900 py-2"
            style={{ fontFamily: "KumbhSans-Regular" }}
            multiline
            blurOnSubmit={false}
            returnKeyType="default"
          />
        </View>

        <Pressable
          onPress={text.trim() ? commit : onMicPress}
          className="ml-3 h-12 w-12 rounded-full items-center justify-center"
          style={{ backgroundColor: "#4C5FAB" }}
        >
          {isRecording || text.trim() ? (
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
