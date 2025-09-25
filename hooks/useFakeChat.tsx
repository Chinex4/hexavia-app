import { useEffect, useRef, useState } from "react";
import type { Message, MessageStatus } from "@/types/chat";

const BOT_ID = "fin-bot";
const BOT_NAME = "Fin Bot";

const BOT_LINES = [
  "Are you done with Opay Wallet?",
  "Everyone cherishes a good challenge while playing games...",
  "Nice! Please @Nm start writing the flutter code.",
];

function updateMsg(
  list: Message[],
  id: string,
  patch: Partial<Message>
): Message[] {
  return list.map((m) => (m.id === id ? { ...m, ...patch } : m));
}

export default function useFakeChat(currentUserId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const msgIdx = useRef(0);

  useEffect(() => {
    // Seed two bot messages
    const now = Date.now();
    setMessages([
      {
        id: "seed-1",
        text: BOT_LINES[0],
        createdAt: now,
        senderId: BOT_ID,
        senderName: BOT_NAME,
        avatar: "https://i.pravatar.cc/100?img=12",
        status: "delivered",
      },
      {
        id: "seed-2",
        text: "Everyone cherishes a good challenge while playing games, but it can be frustrating if they are meaningless. Titles are supposed to be fun, and for relaxation, every player should feel a sense of reward after",
        createdAt: now + 500,
        senderId: BOT_ID,
        senderName: BOT_NAME,
        avatar: "https://i.pravatar.cc/100?img=12",
        status: "delivered",
      },
    ]);
  }, []);

  const advance = (id: string, status: MessageStatus, seenBy?: string[]) => {
    setMessages((prev) => updateMsg(prev, id, { status, seenBy }));
  };

  const send = (text: string) => {
    const id = `m-${Date.now()}`;
    const myMsg: Message = {
      id,
      text,
      createdAt: Date.now(),
      senderId: currentUserId,
      senderName: "You",
      status: "sending",
    };
    setMessages((prev) => [...prev, myMsg]);

    // Status progression
    setTimeout(() => advance(id, "sent"), 250);
    setTimeout(() => advance(id, "delivered"), 900);
    setTimeout(() => advance(id, "seen", ["Fin Bot"]), 1500);

    // Bot “typing” and reply
    setIsTyping(true);
    const replyDelay = 1100 + Math.random() * 900;
    setTimeout(() => {
      const botText = BOT_LINES[msgIdx.current++ % BOT_LINES.length];
      const botMsg: Message = {
        id: `b-${Date.now()}`,
        text: botText,
        createdAt: Date.now(),
        senderId: BOT_ID,
        senderName: BOT_NAME,
        avatar: "https://i.pravatar.cc/100?img=12",
        status: "delivered",
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, replyDelay);
  };

  return { messages, send, isTyping, setMessages };
}
