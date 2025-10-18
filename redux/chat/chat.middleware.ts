import type { Middleware, AnyAction } from "@reduxjs/toolkit";
import { nanoid } from "nanoid";
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
        console.log("[chat] wsConnecting…", { meId });

        const socket = connectSocket();

        if (!(socket as any).__hasOnAny) {
          (socket as any).__hasOnAny = true;
          socket.onAny((event, ...args) => {
            console.log("[chat] onAny:", event, args?.[0]); // <— do NOT filter
          });
          socket.on("error", (e: any) => console.log("[chat] socket error", e));
        }

        socket.on("connect", () => {
          console.log("[chat] wsConnected", { sid: socket.id });
          store.dispatch(wsConnected());
          socket.emit("joinChat", meId);

          const rooms = Object.keys(store.getState().chat.joinedRooms.channels);
          rooms.forEach((chId) => {
            console.log("[chat] re-joinChannel → emit (on connect)", { chId });
            socket.emit("joinChannel", { userId: meId, channelId: chId });
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

        socket.on("receiveChannelMessage", async (data: any) => {
          console.log("[chat] receiveChannelMessage", {
            meId: store.getState().chat.meId,
            from: data.sender,
            channelId: data.channelId,
            id: data._id,
            hasAttachment: !!data.attachment,
          });
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

          const threadId = data.channelId as string;
          store.dispatch(ensureThread({ id: threadId, kind: "community" }));
          store.dispatch(addMessageToThread({ threadId, message: msg }));

          const state = store.getState();
          const currentThreadId = state.chat.currentThreadId;

          const isFromMe = data.sender === state.chat.meId;
          const isOnThread = currentThreadId === threadId;

          if (!isFromMe && !isOnThread) {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: data.username ?? "New message",
                body: msg.mediaUri ? "📷 Image" : data.message || "New message",
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

        return result;
      }

      case "chat/disconnect": {
        const socket = getSocket();
        if (socket) socket.removeAllListeners();
        closeSocket();
        return result;
      }

      case "chat/joinChannel": {
        const { meId, channelId } = a.payload as {
          meId: string;
          channelId: string;
        };
        const socket = getSocket();
        console.log("[chat] joinChannel action", {
          meId,
          channelId,
          socketConnected: !!socket?.connected,
        });

        // local track + join
        store.dispatch(ensureThread({ id: channelId, kind: "community" }));
        store.dispatch(joinedChannel(channelId));

        const emitJoin = () => {
          console.log("[chat] joinChannel → emit", {
            meId,
            channelId,
            sid: socket?.id,
          });
          socket!.emit("joinChannel", { userId: meId, channelId });
        };

        if (socket?.connected) emitJoin();
        else {
          console.log("[chat] joinChannel queued (not connected)", {
            channelId,
          });
          const onConnectOnce = () => {
            console.log("[chat] joinChannel → emit (after connect)", {
              meId,
              channelId,
              sid: socket?.id,
            });
            emitJoin();
            socket!.off("connect", onConnectOnce);
          };
          socket?.on("connect", onConnectOnce);
        }
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
        // const tempId = `temp_${nanoid()}`;
        const tempId = `temp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

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
          console.log("[chat] sendDirect → emit");
          const once = (data: any) => {
            if (data.sender === meId && data.receiverId === otherUserId) {
              store.dispatch(replaceTempId({ tempId, realId: data._id }));
              store.dispatch(
                setMessageStatus({
                  id: data._id,
                  status: "delivered",
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
        const tempId = `temp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

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
          return result; // stop current; will be re-dispatched
        }
        lastEmitAt = now;

        if (socket?.connected) {
          socket.emit("joinChannel", { userId: meId, channelId });
          console.log("[chat] sendChannel → start", {
            channelId,
            meId,
            hasAttachment: !!attachment,
            textLen: text?.length,
          });

          socket.emit(
            "sendChannelMessage",
            {
              senderId: meId,
              channelId,
              message: text,
              attachment, // let server persist this if supported
            },
            (ack?: { _id?: string; read?: boolean }) => {
              console.log("[chat] sendChannel → ack", {
                channelId,
                ok: !!ack?._id,
                ack,
              });
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

          const once = (data: any) => {
            console.log("[chat] receiveChannelMessage (echo?)", {
              meId,
              from: data.sender,
              channelId: data.channelId,
              id: data._id,
            });
            if (data.channelId === channelId && data.sender === meId) {
              store.dispatch(replaceTempId({ tempId, realId: data._id }));
              store.dispatch(
                setMessageStatus({
                  id: data._id,
                  status: data.read ? "seen" : "delivered",
                  isRead: !!data.read,
                })
              );
              socket.off("receiveChannelMessage", once);
            }
          };
          socket.on("receiveChannelMessage", once);

          setTimeout(() => {
            const state = store.getState();
            if (state.chat.messages[tempId]?.status === "sending") {
              store.dispatch(
                setMessageStatus({ id: tempId, status: "failed" })
              );
              socket.off("receiveChannelMessage", once);
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
