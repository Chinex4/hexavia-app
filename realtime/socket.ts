import { io, Socket } from 'socket.io-client';
import { WS_URL } from '@/config/chat';

let socket: Socket | null = null;

export function getSocket() {
  return socket;
}

export function connectSocket() {
  if (socket?.connected) return socket;
  socket = io(WS_URL, { transports: ['websocket'], autoConnect: true });

  return socket;
}

export function closeSocket() {
  try { socket?.close(); } catch {}
  socket = null;
}
