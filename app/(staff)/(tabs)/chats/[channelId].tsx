import React, { useMemo, useRef, useState, useEffect } from "react";
import { View, FlatList, SafeAreaView, Platform } from "react-native";
import ChatHeader from "@/components/staff/chat/ChatHeader";
import MessageBubble from "@/components/staff/chat/MessageBubble";
import AttachmentTray from "@/components/staff/chat/AttachmentTray";
import Composer from "@/components/staff/chat/Composer";
import ActionSheet from "@/components/staff/chat/ActionSheet";
import BottomStack from "@/components/staff/chat/BottomStack";
import useFakeChat from "@/hooks/useFakeChat";
import type { AttachmentKind, Message, ReplyMeta } from "@/types/chat";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams } from "expo-router";
import * as Clipboard from "expo-clipboard";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { Audio } from "expo-av";
import { InteractionManager } from "react-native";

const ME = "me-001";

export default function ChatScreen() {
  const { channelId } = useLocalSearchParams<{ channelId: string }>();
  const { messages, send, isTyping, setMessages } = useFakeChat(ME);
  const [trayOpen, setTrayOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selected, setSelected] = useState<Message | null>(null);
  const [replyTo, setReplyTo] = useState<ReplyMeta | null>(null);
  const listRef = useRef<FlatList<Message>>(null);
  const insets = useSafeAreaInsets();

  const [isRecording, setIsRecording] = useState(false);
  const [recordDurationMs, setRecordDurationMs] = useState(0);
  const recordRef = useRef<Audio.Recording | null>(null);
  const tickRef = useRef<number | null>(null);

  const startRecording = async () => {
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) return;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });

      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      await rec.startAsync();
      recordRef.current = rec;
      setIsRecording(true);
      setRecordDurationMs(0);
      tickRef.current = setInterval(async () => {
        const s = await rec.getStatusAsync();
        if ("durationMillis" in s) setRecordDurationMs(s.durationMillis ?? 0);
      }, 200);
    } catch (e) {
      console.warn(e);
    }
  };

  const stopRecording = async (cancel = false) => {
    try {
      const rec = recordRef.current;
      if (!rec) return;
      await rec.stopAndUnloadAsync();
      const uri = rec.getURI() || undefined;
      recordRef.current = null;
      if (tickRef.current) clearInterval(tickRef.current);
      setIsRecording(false);

      if (!cancel && uri) {
        const duration = recordDurationMs;
        // send(`[Voice note ${Math.round(duration / 1000)}s]`);
        send(``);
        // attach prototype meta to the last message (mine)
        setMessages((prev) => {
          const copy = [...prev];
          for (let i = copy.length - 1; i >= 0; i--) {
            if (copy[i].senderId === ME) {
              copy[i] = {
                ...copy[i],
                mediaUri: uri,
                mimeType: "audio/m4a",
                durationMs: duration,
              };
              break;
            }
          }
          return copy;
        });
        scrollToEnd();
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setRecordDurationMs(0);
    }
  };

  const handleMicPress = async () => {
    if (isRecording) {
      await stopRecording(false);
    } else {
      await startRecording();
    }
  };

  const title = "Fin Team";
  const subtitle = "Mr Chiboy and 5 Others…";
  const avatar = "https://i.pravatar.cc/100?img=5";

  const data = useMemo(() => {
    const items = [...messages];
    if (isTyping) {
      items.push({
        id: "typing",
        text: "…",
        createdAt: Date.now(),
        senderId: "typing",
        senderName: "typing",
      });
    }
    return items;
  }, [messages, isTyping]);

  const scrollToEnd = () => {
    requestAnimationFrame(() =>
      listRef.current?.scrollToEnd({ animated: true })
    );
  };

  const sendWithReply = (text: string, meta: ReplyMeta | null) => {
    send(text);
    if (!meta) return;
    setTimeout(() => {
      setMessages((prev) => {
        const copy = [...prev];
        for (let i = copy.length - 1; i >= 0; i--) {
          if (copy[i].senderId === ME) {
            copy[i] = { ...copy[i], replyTo: meta };
            break;
          }
        }
        return copy;
      });
    }, 0);
    scrollToEnd();
  };

  const handleSend = (text: string) => {
    const meta = replyTo;
    sendWithReply(text, meta);
    setReplyTo(null);
    setTrayOpen(false);
    scrollToEnd();
  };

  const openSheetFor = (m: Message) => {
    setSelected(m);
    setSheetOpen(true);
  };

  const isMine = (m: Message) => m.senderId === ME;

  const items = [
    {
      key: "reply",
      label: "Reply",
      onPress: () => {
        if (!selected) return;
        setReplyTo({
          id: selected.id,
          preview: selected.text,
          senderName: selected.senderName,
        });
      },
    },
    {
      key: "copy",
      label: "Copy",
      onPress: () => selected && Clipboard.setStringAsync(selected.text),
    },
    ...(selected && isMine(selected)
      ? [
          {
            key: "delete",
            label: "Delete for me",
            danger: true,
            onPress: () =>
              setMessages((p) => p.filter((m) => m.id !== selected.id)),
          },
        ]
      : []),
    {
      key: "forward",
      label: "Forward",
      onPress: () => {
        if (!selected) return;
        sendWithReply(`↪️ ${selected.senderName}: ${selected.text}`, null);
        scrollToEnd();
      },
    },
  ];

  useEffect(() => {
    const lastRealId = getLastRealMsgId(messages);
    if (!lastRealId) return;

    if (lastRealId !== lastRealMsgIdRef.current) {
      // a NEW real message (sent by you OR received)
      const shouldAuto =
        ALWAYS_SNAP_TO_BOTTOM ||
        (atBottomRef.current && !isInteractingRef.current);

      if (shouldAuto) {
        pendingAutoScrollRef.current = true; // defer to onContentSizeChange
      }

      lastRealMsgIdRef.current = lastRealId;
    }
  }, [messages]);

  const handlePick = async (kind: AttachmentKind) => {
    try {
      if (kind === "gallery") {
        // No explicit permission needed just to launch the library per docs.
        const res = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"], // <- new API, replaces deprecated MediaTypeOptions
          quality: 0.7,
          allowsEditing: false,
        });
        if (!res.canceled && res.assets?.[0]) {
          const a = res.assets[0];
          send(``);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === prev[prev.length - 1].id
                ? {
                    ...m,
                    mediaUri: a.uri,
                    mimeType: a.mimeType ?? "image/jpeg",
                  }
                : m
            )
          );
          scrollToEnd();
        }
      }

      if (kind === "camera") {
        // Camera still requires permission.
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) return;

        const res = await ImagePicker.launchCameraAsync({
          quality: 0.7,
          allowsEditing: false,
        });
        if (!res.canceled && res.assets?.[0]) {
          const a = res.assets[0];
          send(`[Photo captured]`);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === prev[prev.length - 1].id
                ? {
                    ...m,
                    mediaUri: a.uri,
                    mimeType: a.mimeType ?? "image/jpeg",
                  }
                : m
            )
          );
          scrollToEnd();
        }
      }

      if (kind === "document") {
        const res = await DocumentPicker.getDocumentAsync({
          // Keep true if you plan to read the file with FileSystem right away.
          copyToCacheDirectory: true,
          multiple: false,
          type: "*/*",
        });
        if (!res.canceled && res.assets?.[0]) {
          const a = res.assets[0]; // { uri, name, mimeType, size, ... }
          send(`[Document: ${a.name}]`);
          // If you want to store uri/mimeType on the last message too:
          setMessages((prev) =>
            prev.map((m) =>
              m.id === prev[prev.length - 1].id
                ? { ...m, mediaUri: a.uri, mimeType: a.mimeType ?? "*/*" }
                : m
            )
          );
          scrollToEnd();
        }
      }

      if (kind === "audio") {
        const res = await DocumentPicker.getDocumentAsync({
          type: "audio/*",
          copyToCacheDirectory: true,
          multiple: false,
        });
        if (!res.canceled && res.assets?.[0]) {
          const a = res.assets[0];
          send(`[Audio file: ${a.name}]`);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === prev[prev.length - 1].id
                ? { ...m, mediaUri: a.uri, mimeType: a.mimeType ?? "audio/*" }
                : m
            )
          );
          scrollToEnd();
        }
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setTrayOpen(false);
    }
  };

  const ALWAYS_SNAP_TO_BOTTOM = true; // set false later if you want “smart” behavior

  const atBottomRef = useRef(true);
  const isInteractingRef = useRef(false);
  const lastRealMsgIdRef = useRef<string | null>(null);
  const pendingAutoScrollRef = useRef(false);
  const contentHeightRef = useRef(0);

  const BOTTOM_THRESHOLD = 80;

  const getLastRealMsgId = (arr: Message[]) => {
    for (let i = arr.length - 1; i >= 0; i--) {
      if (arr[i]?.id !== "typing") return arr[i].id;
    }
    return null;
  };

  const handleScroll = ({
    nativeEvent: { contentOffset, contentSize, layoutMeasurement },
  }: any) => {
    const distanceFromBottom =
      contentSize.height - (contentOffset.y + layoutMeasurement.height);
    atBottomRef.current = distanceFromBottom < BOTTOM_THRESHOLD;
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <ChatHeader title={title} subtitle={subtitle} avatar={avatar} />

      {/* Messages list fills the space; extra bottom padding so last message isn't hidden behind bottom stack */}
      <FlatList
        ref={listRef}
        contentContainerStyle={{
          paddingTop: 16,
          paddingBottom: trayOpen ? 220 : 100,
        }}
        data={data}
        keyExtractor={(m) => m.id}
        renderItem={({ item }) => {
          if (item.id === "typing") {
            return (
              <View className="px-5 mb-3">
                <View className="h-4 w-12 rounded-full bg-gray-200" />
              </View>
            );
          }
          return (
            <MessageBubble
              msg={item}
              isMe={isMine(item)}
              onLongPress={openSheetFor}
            />
          );
        }}
        // Keep initial jump only once if you like:
        onLayout={scrollToEnd}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        // NEW: these make Android reliable
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onScrollBeginDrag={() => {
          isInteractingRef.current = true;
        }}
        onScrollEndDrag={() => {
          isInteractingRef.current = false;
        }}
        onMomentumScrollEnd={() => {
          isInteractingRef.current = false;
        }}
        onContentSizeChange={(w, h) => {
          contentHeightRef.current = h;

          if (pendingAutoScrollRef.current) {
            pendingAutoScrollRef.current = false;

            // Do the scroll after layout settles
            requestAnimationFrame(() => {
              // Try the simple way first
              listRef.current?.scrollToEnd({ animated: true });

              // Android fallback: force to the exact bottom using height
              if (Platform.OS === "android") {
                // Give the UI thread a moment to finish measuring (prevents “no-op” scrolls)
                InteractionManager.runAfterInteractions(() => {
                  listRef.current?.scrollToOffset({
                    offset: Math.max(0, contentHeightRef.current),
                    animated: true,
                  });
                });
              }
            });
          }
        }}
      />

      {/* BottomStack animates with Android keyboard (and respects safe area). */}
      <BottomStack
        tray={
          trayOpen ? (
            <AttachmentTray
              onPick={(kind) => {
                handlePick(kind);
              }}
            />
          ) : null
        }
        composer={
          <Composer
            onSend={handleSend}
            trayOpen={trayOpen}
            onToggleTray={() => setTrayOpen((v) => !v)}
            replyTo={replyTo}
            onCancelReply={() => setReplyTo(null)}
            isRecording={isRecording}
            recordDurationMs={recordDurationMs}
            onMicPress={handleMicPress}
            onCancelRecording={() => stopRecording(true)}
          />
        }
      />

      <ActionSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        items={items}
      />
    </SafeAreaView>
  );
}
