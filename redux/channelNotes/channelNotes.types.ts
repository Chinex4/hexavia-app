export type ChannelNote = {
  _id: string;
  title: string;
  description: string;
  createdAt?: string;
  updatedAt?: string;
};

export interface CreateChannelNoteBody {
  channelId: string;
  title: string;
  description: string;
}

export interface UpdateChannelNoteBody {
  channelId: string;
  noteId: string;
  title: string;
  description: string;
}

export interface DeleteChannelNoteBody {
  channelId: string;
  noteId: string;
}
