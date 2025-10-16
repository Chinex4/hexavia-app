export type WSDirectIn = {
  _id: string;
  message: string;
  sender: string;
  username: string;
  profilePicture: string | null;
  receiverId: string;
  read: boolean;
  createdAt: string | number | Date;
};

export type WSChannelIn = {
  _id: string;
  message: string;
  sender: string;
  username: string;
  profilePicture: string | null;
  channelId: string;
  read: boolean;
  createdAt: string | number | Date;
};

export type WSReadReceiptIn = {
  messageIds: string[];
  readBy: string;
  channelId?: string;
};
