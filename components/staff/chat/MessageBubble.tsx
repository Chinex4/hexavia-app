import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  Image,
  Modal,
  TouchableWithoutFeedback,
  Dimensions,
  Linking,
} from "react-native";
import type { Message } from "@/types/chat";
import { formatTime } from "@/utils/format";
import {
  Check,
  CheckCheck,
  Loader2,
  PlayCircle,
  PauseCircle,
  FileText,
  X,
} from "lucide-react-native";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import * as WebBrowser from "expo-web-browser";
import * as Sharing from "expo-sharing";
function renderWithMentions(text: string) {
  const parts = text.split(/(\@\w+)/g);
  return parts.map((p, i) =>
    p.startsWith("@") ? (
      <Text key={i} className="text-primary font-kumbhBold text-[15px]">
        {p}
      </Text>
    ) : (
      <Text key={i} className="text-gray-800 text-[15px] font-kumbh">
        {p}
      </Text>
    )
  );
}

function StatusTicks({ status }: { status?: Message["status"] }) {
  if (status === "sending") return <Loader2 size={14} color="#9CA3AF" />;
  if (status === "sent") return <Check size={14} color="#9CA3AF" />;
  if (status === "delivered") return <CheckCheck size={14} color="#9CA3AF" />;
  if (status === "seen") return <CheckCheck size={14} color="#4C5FAB" />;
  return null;
}

function ReplyPreview({ msg }: { msg: Message }) {
  if (!msg.replyTo) return null;
  return (
    <View className="mb-2 rounded-2xl px-3 py-2 bg-white/50 border border-white/40">
      <Text className="text-[11px] text-gray-500 mb-1 font-kumbhBold">
        {msg.replyTo.senderName}
      </Text>
      <Text className="text-[12px] text-gray-700 font-kumbh" numberOfLines={2}>
        {msg.replyTo.preview}
      </Text>
    </View>
  );
}
const isHttp = (uri?: string) => !!uri && /^https?:\/\//i.test(uri);
const hasExt = (uri: string, exts: string[]) =>
  new RegExp(`\\.(${exts.join("|")})($|\\?)`, "i").test(uri);

const isImage = (m: Message) =>
  !!m.mediaUri &&
  (m.mimeType?.startsWith("image/") ??
    hasExt(m.mediaUri, ["png", "jpg", "jpeg", "gif", "webp"]));

const isAudio = (m: Message) =>
  !!m.mediaUri &&
  (m.mimeType?.startsWith("audio/") ??
    hasExt(m.mediaUri, ["m4a", "aac", "mp3", "wav", "ogg"]));

const isDocument = (m: Message) =>
  !!m.mediaUri &&
  (m.mimeType?.startsWith("application/") ||
    hasExt(m.mediaUri, [
      "pdf",
      "doc",
      "docx",
      "ppt",
      "pptx",
      "xls",
      "xlsx",
      "txt",
      "rtf",
      "csv",
      "zip",
      "rar",
    ]));

const fmtClock = (ms = 0) => {
  const total = Math.max(0, Math.round(ms / 1000));
  const mm = Math.floor(total / 60);
  const ss = total % 60;
  return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
};

const filenameFromUri = (uri?: string) => {
  if (!uri) return "document";
  try {
    const path = decodeURIComponent(uri.split("?")[0]);
    const seg = path.split("/").pop();
    return seg || "document";
  } catch {
    return "document";
  }
};
function ImagePreviewModal({
  uri,
  visible,
  onClose,
}: {
  uri: string;
  visible: boolean;
  onClose: () => void;
}) {
  const { width, height } = Dimensions.get("window");
  return (
    <Modal
      visible={visible}
      onRequestClose={onClose}
      transparent
      animationType="fade"
    >
      <View className="flex-1 bg-black/95">
        <View className="absolute right-4 top-10 z-10">
          <Pressable
            onPress={onClose}
            className="h-9 w-9 rounded-full bg-black/60 items-center justify-center"
          >
            <X size={18} color="#fff" />
          </Pressable>
        </View>
        <TouchableWithoutFeedback onPress={onClose}>
          <View className="flex-1 items-center justify-center">
            <Image
              source={{ uri }}
              style={{
                width: width,
                height: height,
                resizeMode: "contain",
              }}
            />
          </View>
        </TouchableWithoutFeedback>
      </View>
    </Modal>
  );
}
async function openDocument(uri: string) {
  try {
    if (isHttp(uri)) {
      await WebBrowser.openBrowserAsync(uri);
      return;
    }
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri);
      return;
    }
    await Linking.openURL(uri);
  } catch (e) {
    console.warn("Open document failed", e);
  }
}

function DocumentPill({ msg }: { msg: Message }) {
  const name = useMemo(() => filenameFromUri(msg.mediaUri), [msg.mediaUri]);
  return (
    <Pressable
      onPress={() => msg.mediaUri && openDocument(msg.mediaUri)}
      className="mb-2 px-3 py-2 rounded-xl bg-white/60 border border-white/40 flex-row items-center"
    >
      <FileText size={18} color="#374151" />
      <Text className="ml-2 text-[13px] text-gray-800" numberOfLines={1}>
        {name}
      </Text>
    </Pressable>
  );
}
function AudioPlayer({ msg }: { msg: Message }) {
  const player = useAudioPlayer(msg.mediaUri!, { updateInterval: 200 });
  const status = useAudioPlayerStatus(player);

  const toggle = () => {
    if (!status.isLoaded) return;
    if (status.playing) player.pause();
    else player.play();
  };

  const fmtClock = (s = 0) => {
    const total = Math.max(0, Math.round(s));
    const mm = Math.floor(total / 60);
    const ss = total % 60;
    return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
  };

  const pos = status.currentTime ?? 0;
  const dur = status.duration ?? (msg.durationMs ? msg.durationMs / 1000 : 0);
  const pct = dur > 0 ? Math.min(1, pos / dur) : 0;

  return (
    <View className="mb-2 px-3 py-2 rounded-xl bg-white/60 border border-white/40">
      <View className="flex-row items-center">
        <Pressable onPress={toggle} className="mr-2">
          {status.playing ? (
            <PauseCircle size={22} color="#374151" />
          ) : (
            <PlayCircle size={22} color="#374151" />
          )}
        </Pressable>
        <Text className="text-[13px] text-gray-800 font-kumbh">
          {fmtClock(pos)} / {fmtClock(dur)}
        </Text>
      </View>
      <View className="mt-2 h-1.5 rounded-full bg-white/70 overflow-hidden">
        <View
          style={{ width: `${pct * 100}%` }}
          className="h-full bg-gray-500"
        />
      </View>
    </View>
  );
}
export default function MessageBubble({
  msg,
  isMe,
  onLongPress,
}: {
  msg: Message;
  isMe: boolean;
  onLongPress?: (m: Message) => void;
}) {
  const [imgOpen, setImgOpen] = useState(false);

  const BubbleCore = (
    <>
      <ReplyPreview msg={msg} />
      {isImage(msg) ? (
        <>
          <Pressable
            onPress={() => setImgOpen(true)}
            className="mb-2 overflow-hidden rounded-2xl"
          >
            <Image
              source={{ uri: msg.mediaUri! }}
              style={{
                width: 224,
                height: 168,
                borderRadius: 16,
                backgroundColor: "rgba(0,0,0,0.06)",
              }}
              resizeMode="cover"
            />
          </Pressable>
          {/* full screen modal */}
          {msg.mediaUri ? (
            <ImagePreviewModal
              uri={msg.mediaUri}
              visible={imgOpen}
              onClose={() => setImgOpen(false)}
            />
          ) : null}
        </>
      ) : isAudio(msg) ? (
        <AudioPlayer msg={msg} />
      ) : isDocument(msg) ? (
        <DocumentPill msg={msg} />
      ) : null}

      {!!msg.text && (
        <Text className="text-gray-800">{renderWithMentions(msg.text)}</Text>
      )}
    </>
  );

  if (isMe) {
    return (
      <View className="px-5 mb-3 items-end">
        <Pressable
          onLongPress={() => onLongPress?.(msg)}
          className="max-w-[82%]"
        >
          <View className="bg-[#C9CEEA] rounded-3xl px-5 py-3">
            {BubbleCore}
          </View>
        </Pressable>

        <View className="flex-row items-center mt-1">
          <Text className="text-[11px] text-gray-400 mr-1">
            {formatTime(msg.createdAt)}
          </Text>
          <StatusTicks status={msg.status} />
        </View>

        {msg.status === "seen" && !!msg.seenBy?.length && (
          <Text className="text-[11px] text-gray-400 mt-0.5">
            Seen by {msg.seenBy.join(", ")}
          </Text>
        )}
      </View>
    );
  }

  return (
    <View className="px-5 mb-3 items-start">
      <View className="flex-row items-start">
        <View className="h-9 w-9 rounded-full bg-emerald-700 mr-3" />
        <Pressable onLongPress={() => onLongPress?.(msg)}>
          <View className="bg-gray-200 rounded-3xl px-5 py-3 max-w-[82%]">
            {BubbleCore}
          </View>
          <Text className="text-[11px] text-gray-400 mt-1">
            {formatTime(msg.createdAt)}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
