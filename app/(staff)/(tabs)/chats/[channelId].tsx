import ActionSheet from "@/components/staff/chat/ActionSheet";
import AttachmentTray from "@/components/staff/chat/AttachmentTray";
import BottomStack from "@/components/staff/chat/BottomStack";
import ChatHeader from "@/components/staff/chat/ChatHeader";
import Composer from "@/components/staff/chat/Composer";
import MessageBubble from "@/components/staff/chat/MessageBubble";
import useFakeChat from "@/hooks/useFakeChat";
import { selectChannelById } from "@/redux/channels/channels.slice";
import { fetchChannelById } from "@/redux/channels/channels.thunks";
import { Channel } from "@/redux/channels/channels.types";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import type { AttachmentKind, Message, ReplyMeta } from "@/types/chat";
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import * as Clipboard from "expo-clipboard";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  InteractionManager,
  Platform,
  SafeAreaView,
  View,
} from "react-native";

const ME = "me-001";

export default function ChatScreen() {
  const { channelId: rawId } = useLocalSearchParams<{ channelId: string }>();
  const { messages, send, isTyping, setMessages } = useFakeChat(ME);
  const [trayOpen, setTrayOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selected, setSelected] = useState<Message | null>(null);
  const [replyTo, setReplyTo] = useState<ReplyMeta | null>(null);
  const listRef = useRef<FlatList<Message>>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordDurationMs, setRecordDurationMs] = useState(0);
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder, 200);
  const recordRef = useRef<typeof audioRecorder | null>(null);
  const dispatch = useAppDispatch();
  const router = useRouter();
  // sanitize param
  const channelId = typeof rawId === "string" ? rawId : rawId?.[0];

  const channelSel = useMemo(() => selectChannelById(channelId), [channelId]);
  const channel = useAppSelector(channelSel);

  useEffect(() => {
    if (!channelId) return; // no id yet
    if (channel) return; // already in store, don't refetch
    dispatch(fetchChannelById(channelId)); // fire and forget; errors handled in thunk
  }, [dispatch, channelId, !!channel]);

  useEffect(() => {
    setRecordDurationMs(recorderState.durationMillis ?? 0);
  }, [recorderState.durationMillis]);

  const startRecording = async () => {
    try {
      const perm = await AudioModule.requestRecordingPermissionsAsync();
      if (!perm.granted) return;

      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
        shouldPlayInBackground: false,
      });

      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();

      recordRef.current = audioRecorder;
      setIsRecording(true);
      setRecordDurationMs(0);
    } catch (e) {
      console.warn(e);
    }
  };

  const stopRecording = async (cancel = false) => {
    try {
      const rec = recordRef.current ?? audioRecorder;
      if (!recorderState.isRecording) return;

      await rec.stop();
      const uri = rec.uri ?? undefined;

      recordRef.current = null;
      setIsRecording(false);

      if (!cancel && uri) {
        const duration = recorderState.durationMillis ?? 0;
        send("");
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
    if (recorderState.isRecording) {
      await stopRecording(false);
    } else {
      await startRecording();
    }
  };

  const title = channel.name ?? "Fin Team";
  const subtitle = channel.description ?? "Mr Chiboy and 5 Others…";
  // const avatar = "https://i.pravatar.cc/100?img=5";

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
      const shouldAuto =
        ALWAYS_SNAP_TO_BOTTOM ||
        (atBottomRef.current && !isInteractingRef.current);

      if (shouldAuto) {
        pendingAutoScrollRef.current = true;
      }

      lastRealMsgIdRef.current = lastRealId;
    }
  }, [messages]);

  const handlePick = async (kind: AttachmentKind) => {
    try {
      if (kind === "gallery") {
        const res = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
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

  const ALWAYS_SNAP_TO_BOTTOM = true;

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

  const handleOpenResources = () => {
    router.push({
      pathname: "/(staff)/(tabs)/channels/[channelId]/resources" as any,
      params: { channelId: channelId },
    });
  };
  const handleOpenTasks = () => {
    router.push({
      pathname: "/(staff)/(tabs)/channels/[channelId]/resources" as any,
      params: { channelId: channelId },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <ChatHeader
        title={title}
        subtitle={subtitle}
        onPress={handleOpenResources}
        onTaskOpen={handleOpenTasks}
      />

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
        onLayout={scrollToEnd}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
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
            requestAnimationFrame(() => {
              listRef.current?.scrollToEnd({ animated: true });
              if (Platform.OS === "android") {
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
