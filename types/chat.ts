export type MessageStatus = "sending" | "sent" | "delivered" | "seen";

export type ReplyMeta = {
  id: string;
  preview: string; // short preview of the parent message
  senderName: string;
};

export type Message = {
  id: string;
  text: string;
  createdAt: number;
  senderId: string;
  senderName: string;
  avatar?: string;
  status?: string;
  seenBy?: string[];
  replyTo?: ReplyMeta; // <- NEW
  // optional attachment prototypes
  mediaUri?: string;
  mimeType?: string;
  durationMs?: number; // for audio
};

export type AttachmentKind = "gallery" | "audio" | "camera" | "document";
