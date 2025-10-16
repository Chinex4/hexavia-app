import ActionSheet from "@/components/staff/chat/ActionSheet";
import AttachmentTray from "@/components/staff/chat/AttachmentTray";
import BottomStack from "@/components/staff/chat/BottomStack";
import ChatHeader from "@/components/staff/chat/ChatHeader";
import Composer from "@/components/staff/chat/Composer";
import MessageBubble from "@/components/staff/chat/MessageBubble";

import { selectChannelById } from "@/redux/channels/channels.slice";
import { fetchChannelById } from "@/redux/channels/channels.thunks";

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

import { ensureThread, setCurrentThread } from "@/redux/chat/chat.slice";
import { selectMessagesForCurrent } from "@/redux/chat/chat.selectors";
import { selectUser } from "@/redux/user/user.slice";
import { uploadSingle } from "@/redux/upload/upload.thunks";
import { uploadChannelResources } from "@/redux/channels/channels.thunks";

export default function ChatScreen() {
  const { channelId: rawId } = useLocalSearchParams<{ channelId: string }>();
  const dispatch = useAppDispatch();
  const router = useRouter();

  const user = useAppSelector(selectUser);
  const meId = user?._id ?? "me-001";

  const channelId = typeof rawId === "string" ? rawId : rawId?.[0];

  const channelSel = useMemo(() => selectChannelById(channelId), [channelId]);
  const channel = useAppSelector(channelSel);

  useEffect(() => {
    if (!meId) return;
    dispatch({ type: "chat/connect", payload: { meId } });
    return () => {
      dispatch({ type: "chat/disconnect" });
    };
  }, [dispatch, meId]);

  useEffect(() => {
    if (!channelId) return;
    if (channel) return;
    dispatch(fetchChannelById(channelId));
  }, [dispatch, channelId, !!channel]);

  useEffect(() => {
    if (!channelId || !meId) return;
    dispatch(ensureThread({ id: channelId, kind: "community" }));
    dispatch(setCurrentThread(channelId));
    dispatch({ type: "chat/joinChannel", payload: { meId, channelId } });
  }, [dispatch, channelId, meId]);

  const messagesFromRedux = useAppSelector(selectMessagesForCurrent);

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

  const title = channel?.name ?? "Fin Team";
  const subtitle = channel?.description ?? "Mr Chiboy and 5 Others…";

  const data = useMemo<Message[]>(() => {
    return (messagesFromRedux || []).map((m) => ({
      id: m.id,
      text: m.text,
      createdAt: m.createdAt,
      senderId: m.senderId,
      senderName: m.senderName ?? "",
      avatar: m.avatar ?? undefined,
      status: m.status,
      isRead: m.isRead,
      mediaUri: (m as any).mediaUri,
      mimeType: (m as any).mimeType,
      durationMs: (m as any).durationMs,
      replyTo: (m as any).replyTo,
    }));
  }, [messagesFromRedux]);

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
        const name = `voice_${Date.now()}.m4a`;
        const type = "audio/m4a";
        const uploadAction = await dispatch(uploadSingle({ uri, name, type }));

        if (uploadSingle.fulfilled.match(uploadAction)) {
          const { url } = uploadAction.payload;
          const secs = Math.max(
            1,
            Math.round((recorderState.durationMillis ?? 0) / 1000)
          );

          if (channelId) {
            await dispatch(
              uploadChannelResources({
                channelId,
                resources: [
                  {
                    name,
                    description: `Voice note • ${secs}s`,
                    resourceUpload: url,
                  },
                ],
              })
            );
          }

          handleSend(`[Voice note • ${secs}s] ${url}`);
          scrollToEnd();
        }
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

  const sendChannel = (text: string) => {
    if (!text.trim() || !channelId) return;
    dispatch({
      type: "chat/sendChannel",
      payload: { meId, channelId, text },
    });
  };

  const sendWithReply = (text: string, meta: ReplyMeta | null) => {
    const textToSend = meta
      ? `${meta.senderName}: ${meta.preview}\n${text}`
      : text;
    sendChannel(textToSend);
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

  const isMine = (m: Message) => m.senderId === meId;

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
  ];

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

  useEffect(() => {
    const lastRealId = getLastRealMsgId(data);
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
  }, [data]);

  const scrollToEnd = () => {
    requestAnimationFrame(() =>
      listRef.current?.scrollToEnd({ animated: true })
    );
  };

  const handleScroll = ({
    nativeEvent: { contentOffset, contentSize, layoutMeasurement },
  }: any) => {
    const distanceFromBottom =
      contentSize.height - (contentOffset.y + layoutMeasurement.height);
    atBottomRef.current = distanceFromBottom < BOTTOM_THRESHOLD;
  };

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
          const name =
            (a as any).fileName ??
            `image_${Date.now()}.${a.mimeType?.split("/")?.[1] ?? "jpg"}`;
          const type = a.mimeType ?? "image/jpeg";

          const uploadAction = await dispatch(
            uploadSingle({ uri: a.uri, name, type })
          );
          if (uploadSingle.fulfilled.match(uploadAction)) {
            const { url } = uploadAction.payload;

            if (channelId) {
              await dispatch(
                uploadChannelResources({
                  channelId,
                  resources: [
                    {
                      name,
                      description: "Image shared in chat",
                      resourceUpload: url,
                    },
                  ],
                })
              );
            }

            handleSend(`${url}`);
            scrollToEnd();
          }
        }
      }

      if (kind === "camera") {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) return;

        const res = await ImagePicker.launchCameraAsync({
          quality: 0.7,
          allowsEditing: false,
        });
        if (!res.canceled && res.assets?.[0]) {
          const a = res.assets[0];
          const name = `photo_${Date.now()}.jpg`;
          const type = a.mimeType ?? "image/jpeg";

          const uploadAction = await dispatch(
            uploadSingle({ uri: a.uri, name, type })
          );
          if (uploadSingle.fulfilled.match(uploadAction)) {
            const { url } = uploadAction.payload;

            if (channelId) {
              await dispatch(
                uploadChannelResources({
                  channelId,
                  resources: [
                    {
                      name,
                      description: "Photo captured in chat",
                      resourceUpload: url,
                    },
                  ],
                })
              );
            }

            handleSend(`[Photo captured] ${url}`);
            scrollToEnd();
          }
        }
      }

      if (kind === "document") {
        const res = await DocumentPicker.getDocumentAsync({
          copyToCacheDirectory: true,
          multiple: false,
          type: "*/*",
        });
        if (!res.canceled && res.assets?.[0]) {
          const a = res.assets[0];
          const name = a.name ?? `document_${Date.now()}`;
          const type = a.mimeType ?? "application/octet-stream";

          const uploadAction = await dispatch(
            uploadSingle({ uri: a.uri, name, type })
          );
          if (uploadSingle.fulfilled.match(uploadAction)) {
            const { url } = uploadAction.payload;

            if (channelId) {
              await dispatch(
                uploadChannelResources({
                  channelId,
                  resources: [
                    {
                      name,
                      description: "Document shared in chat",
                      resourceUpload: url,
                    },
                  ],
                })
              );
            }

            handleSend(`[Document: ${name}] ${url}`);
            scrollToEnd();
          }
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
          const name = a.name ?? `audio_${Date.now()}.m4a`;
          const type = a.mimeType ?? "audio/m4a";

          const uploadAction = await dispatch(
            uploadSingle({ uri: a.uri, name, type })
          );
          if (uploadSingle.fulfilled.match(uploadAction)) {
            const { url } = uploadAction.payload;

            if (channelId) {
              await dispatch(
                uploadChannelResources({
                  channelId,
                  resources: [
                    {
                      name,
                      description: "Audio file shared in chat",
                      resourceUpload: url,
                    },
                  ],
                })
              );
            }

            handleSend(`[Audio file: ${name}] ${url}`);
            scrollToEnd();
          }
        }
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setTrayOpen(false);
    }
  };

  const markVisibleAsRead = () => {
    if (!meId || !channelId || !messagesFromRedux?.length) return;
    const unread = messagesFromRedux.filter((m) => !m.isRead).map((m) => m.id);
    if (unread.length) {
      dispatch({
        type: "chat/markAsRead",
        payload: { meId, messageIds: unread, kind: "community", channelId },
      });
    }
  };

  const handleOpenResources = () => {
    router.push({
      pathname: "/(staff)/channels/[channelId]/resources" as any,
      params: { channelId },
    });
  };
  const handleOpenTasks = () => {
    router.push({
      pathname: "/(staff)/channels/[channelId]/tasks" as any,
      params: { channelId },
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
              isMe={item.senderId === meId}
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
          markVisibleAsRead();
        }}
        onMomentumScrollEnd={() => {
          isInteractingRef.current = false;
          markVisibleAsRead();
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
