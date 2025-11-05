import { io } from "socket.io-client";
import { CHAT_SERVER_URL } from "@/config/chat";

let socket = null;

export function getSocket() {
  return socket;
}

export function connectSocket() {
  if (socket && socket.connected) return socket;

  socket = io(CHAT_SERVER_URL, {
    transports: ["websocket"],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 500,
    reconnectionDelayMax: 5000,
    timeout: 200000,
  });

  return socket;
}

export function disconnectSocket() {
  if (!socket) return;
  try {
    socket.close();
  } catch {}
  socket = null;
}
