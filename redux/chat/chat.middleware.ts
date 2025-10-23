import type { Middleware, AnyAction } from "@reduxjs/toolkit";
import {
  wsConnecting,
  wsConnected,
  wsDisconnected,
  joinedChannel,
  ensureThread,
  addMessageToThread,
  replaceTempId,
  setMessageStatus,
  markReadBulk,
  setError,
  setMe,
} from "./chat.slice";
import { connectSocket, closeSocket, getSocket } from "@/realtime/socket";
import type { RootState } from "@/store";
import type { ChatMessage } from "@/types/chat-model";
import * as Notifications from "expo-notifications";

let lastEmitAt = 0;
const EMIT_GAP = 250;

export const chatMiddleware: Middleware<{}, RootState> =
  (store) => (next) => (action) => {
    const result = next(action);
    const a = action as AnyAction;

    switch (a.type) {
      case "chat/connect": {
        const { meId } = a.payload as { meId: string };
        store.dispatch(setMe(meId));
        store.dispatch(wsConnecting());

        const socket = connectSocket();

        if (!(socket as any).__handlersBound) {
          (socket as any).__handlersBound = true;

          socket.onAny((event, ...args) => {
            console.log("[chat] onAny:", event, args?.[0]);
          });

          socket.on("connect", () => {
            console.log("[chat] wsConnected", { sid: socket.id });
            store.dispatch(wsConnected());
            socket.emit("joinChat", store.getState().chat.meId);
            const rooms = Object.keys(
              store.getState().chat.joinedRooms.channels
            );
            rooms.forEach((chId) => {
              socket.emit("joinChannel", {
                userId: store.getState().chat.meId,
                channelId: chId,
              });
            });
          });

          socket.on("disconnect", (reason) => {
            console.log("[chat] wsDisconnected", { reason });
            store.dispatch(wsDisconnected());
          });

          socket.on("connect_error", (err) => {
            console.log("[chat] wsError", err?.message ?? err);
            store.dispatch(setError((err as any)?.message ?? "WS error"));
          });

          socket.on("receiveDirectMessage", (data: any) => {
            const msg: ChatMessage = {
              id: data._id,
              text: data.message,
              createdAt: new Date(data.createdAt).valueOf(),
              senderId: data.sender,
              senderName: data.username,
              avatar: data.profilePicture,
              isRead: !!data.read,
              status: data.read ? "seen" : "delivered",
            };
            const meIdNow = store.getState().chat.meId;
            const threadId =
              data.sender === meIdNow ? data.receiverId : data.sender;
            store.dispatch(ensureThread({ id: threadId, kind: "direct" }));
            store.dispatch(addMessageToThread({ threadId, message: msg }));
          });

          // ✅ replace with this
          socket.on("receiveChannelMessage", async (data: any) => {
            const stateBefore = store.getState();
            const isFromMe = data.sender === stateBefore.chat.meId; // <-- compute first
            const threadId = String(data.channelId);

            // If it's my own message, we ALREADY handled it with ack (replaceTempId).
            // Do NOT add again.
            if (isFromMe) {
              return;
            }

            const isUrl =
              typeof data.message === "string" &&
              /^https?:\/\//i.test(data.message);
            const looksImage =
              isUrl && /\.(png|jpe?g|gif|webp)(\?|$)/i.test(data.message);

            const msg: ChatMessage = {
              id: data._id,
              text: data.message,
              createdAt: new Date(data.createdAt).valueOf(),
              senderId: data.sender,
              senderName: data.username,
              avatar: data.profilePicture,
              isRead: !!data.read,
              status: data.read ? "seen" : "delivered",
              mediaUri:
                data.attachment?.mediaUri ??
                (looksImage ? data.message : undefined),
              mimeType:
                data.attachment?.mimeType ??
                (looksImage ? "image/jpeg" : undefined),
              durationMs: data.attachment?.durationMs,
            };

            store.dispatch(ensureThread({ id: threadId, kind: "community" }));
            store.dispatch(addMessageToThread({ threadId, message: msg }));

            const state = store.getState();
            const isOnThread = state.chat.currentThreadId === threadId;

            if (!isOnThread) {
              await Notifications.scheduleNotificationAsync({
                content: {
                  title: data.username ?? "New message",
                  body: msg.mediaUri
                    ? "📷 Image"
                    : data.message || "New message",
                  data: { channelId: threadId },
                },
                trigger: null,
              });
            }
          });
          socket.on("messagesRead", (data: any) => {
            const ids: string[] = data.messageIds || [];
            store.dispatch(markReadBulk(ids));
            ids.forEach((id) =>
              store.dispatch(
                setMessageStatus({ id, status: "seen", isRead: true })
              )
            );
          });
        }

        return result;
      }

      case "chat/disconnect": {
        const socket = getSocket();
        if (socket) {
          socket.removeAllListeners();
          (socket as any).__handlersBound = false;
        }
        closeSocket();
        return result;
      }

      case "chat/joinChannel": {
        const { meId, channelId } = a.payload as {
          meId: string;
          channelId: string;
        };
        const socket = getSocket();

        const wasJoined =
          !!store.getState().chat.joinedRooms.channels[channelId];
        if (wasJoined) return result;

        store.dispatch(ensureThread({ id: channelId, kind: "community" }));
        const emitJoin = () =>
          socket?.emit("joinChannel", { userId: meId, channelId });

        if (socket?.connected) emitJoin();
        else socket?.once("connect", emitJoin);

        store.dispatch(joinedChannel(channelId));
        return result;
      }

      case "chat/sendDirect": {
        const { meId, otherUserId, text, attachment } = a.payload as {
          meId: string;
          otherUserId: string;
          text: string;
          attachment?: {
            mediaUri: string;
            mimeType: string;
            durationMs?: number;
          };
        };
        const socket = getSocket();
        const tempId = `temp_${Date.now().toString(36)}_${Math.random()
          .toString(36)
          .slice(2, 8)}`;

        store.dispatch(ensureThread({ id: otherUserId, kind: "direct" }));
        store.dispatch(
          addMessageToThread({
            threadId: otherUserId,
            message: {
              id: tempId,
              temp: true,
              text,
              createdAt: Date.now(),
              senderId: meId,
              senderName: "You",
              status: "sending",
              mediaUri: attachment?.mediaUri,
              mimeType: attachment?.mimeType,
              durationMs: attachment?.durationMs,
            },
          })
        );

        if (socket?.connected) {
          const once = (data: any) => {
            if (data.sender === meId && data.receiverId === otherUserId) {
              store.dispatch(replaceTempId({ tempId, realId: data._id }));
              store.dispatch(
                setMessageStatus({
                  id: data._id,
                  status: data.read ? "seen" : "delivered",
                  isRead: !!data.read,
                })
              );
              socket.off("receiveDirectMessage", once);
            }
          };
          socket.emit("sendDirectMessage", {
            senderId: meId,
            receiverId: otherUserId,
            message: text,
          });
          socket.on("receiveDirectMessage", once);

          setTimeout(() => {
            const state = store.getState();
            if (state.chat.messages[tempId]?.status === "sending") {
              store.dispatch(
                setMessageStatus({ id: tempId, status: "failed" })
              );
              socket.off("receiveDirectMessage", once);
            }
          }, 10000);
        } else {
          store.dispatch(setMessageStatus({ id: tempId, status: "failed" }));
        }
        return result;
      }

      case "chat/sendChannel": {
        const { meId, channelId, text, attachment } = a.payload as {
          meId: string;
          channelId: string;
          text: string;
          attachment?: {
            mediaUri: string;
            mimeType: string;
            durationMs?: number;
          };
        };
        const socket = getSocket();
        const tempId = `temp_${Date.now().toString(36)}_${Math.random()
          .toString(36)
          .slice(2, 8)}`;

        store.dispatch(ensureThread({ id: channelId, kind: "community" }));
        store.dispatch(
          addMessageToThread({
            threadId: channelId,
            message: {
              id: tempId,
              temp: true,
              text,
              createdAt: Date.now(),
              senderId: meId,
              senderName: "You",
              status: "sending",
              mediaUri: attachment?.mediaUri,
              mimeType: attachment?.mimeType,
              durationMs: attachment?.durationMs,
            },
          })
        );

        const now = Date.now();
        if (now - lastEmitAt < EMIT_GAP) {
          setTimeout(() => store.dispatch(a), EMIT_GAP - (now - lastEmitAt));
          return result;
        }
        lastEmitAt = now;

        if (socket?.connected) {
          console.log("[send] ch", { meId, channelId, text });
          socket.emit(
            "sendChannelMessage",
            { senderId: meId, channelId, message: text, attachment },
            (ack?: { _id?: string; read?: boolean }) => {
              if (ack?._id) {
                store.dispatch(replaceTempId({ tempId, realId: ack._id }));
                store.dispatch(
                  setMessageStatus({
                    id: ack._id,
                    status: ack.read ? "seen" : "delivered",
                    isRead: !!ack.read,
                  })
                );
              } else {
                store.dispatch(
                  setMessageStatus({ id: tempId, status: "failed" })
                );
              }
            }
          );

          setTimeout(() => {
            const state = store.getState();
            if (state.chat.messages[tempId]?.status === "sending") {
              store.dispatch(
                setMessageStatus({ id: tempId, status: "failed" })
              );
            }
          }, 10000);
        } else {
          store.dispatch(setMessageStatus({ id: tempId, status: "failed" }));
        }
        return result;
      }

      case "chat/markAsRead": {
        const { meId, messageIds, kind, otherUserId, channelId } =
          a.payload as {
            meId: string;
            messageIds: string[];
            kind: "direct" | "community";
            otherUserId?: string;
            channelId?: string;
          };
        const socket = getSocket();
        if (socket?.connected) {
          socket.emit("markAsRead", {
            userId: meId,
            messageIds,
            type: kind,
            ...(kind === "direct" ? { otherUserId } : { channelId }),
          });
        }
        store.dispatch(markReadBulk(messageIds));
        return result;
      }
    }

    return result;
  };
