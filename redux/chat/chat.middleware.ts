// redux/chat/chat.middleware.ts
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

        socket.on("connect", () => {
          store.dispatch(wsConnected());
          socket.emit("joinChat", meId);
          // Re-join the current channel after reconnect
          const state = store.getState();
          const currentChannelId = state.chat.currentThreadId;
          if (
            currentChannelId &&
            state.chat.threads[currentChannelId]?.kind === "community"
          ) {
            socket.emit("joinChannel", {
              userId: meId,
              channelId: currentChannelId,
            });
            store.dispatch(joinedChannel(currentChannelId));
          }

          Object.keys(state.chat.joinedRooms.channels).forEach((chId) => {
            socket.emit("joinChannel", { userId: meId, channelId: chId });
          });
        });

        socket.on("disconnect", () => store.dispatch(wsDisconnected()));
        socket.on("connect_error", (err) =>
          store.dispatch(setError((err as any)?.message ?? "WS error"))
        );

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

        socket.on("receiveChannelMessage", (data: any) => {
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
          const threadId = data.channelId as string;
          store.dispatch(ensureThread({ id: threadId, kind: "community" }));
          store.dispatch(addMessageToThread({ threadId, message: msg }));
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
        if (socket?.connected)
          socket.emit("joinChannel", { userId: meId, channelId });
        store.dispatch(ensureThread({ id: channelId, kind: "community" }));
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
          socket.emit("sendDirectMessage", {
            senderId: meId,
            receiverId: otherUserId,
            message: text,
          });
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
          socket.on("receiveDirectMessage", once);
        } else {
          store.dispatch(setMessageStatus({ id: tempId, status: "failed" }));
        }
        return result;
      }

      case "chat/sendChannel": {
        const { meId, channelId, text } = a.payload as {
          meId: string;
          channelId: string;
          text: string;
        };
        const socket = getSocket();
        //   const tempId = `temp_${nanoid()}`;
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
            },
          })
        );

        if (socket?.connected) {
          socket.emit("sendChannelMessage", {
            senderId: meId,
            channelId,
            message: text,
          });
          const once = (data: any) => {
            if (data.channelId === channelId && data.sender === meId) {
              store.dispatch(replaceTempId({ tempId, realId: data._id }));
              store.dispatch(
                setMessageStatus({
                  id: data._id,
                  status: "delivered",
                  isRead: !!data.read,
                })
              );
              socket.off("receiveChannelMessage", once);
            }
          };
          socket.on("receiveChannelMessage", once);
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
