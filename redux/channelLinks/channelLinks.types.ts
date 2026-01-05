export type ChannelLink = {
  _id: string;
  title?: string | null;
  url: string;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export interface CreateChannelLinkBody {
  channelId: string;
  title?: string | null;
  url: string;
  description?: string | null;
}

export interface UpdateChannelLinkBody {
  channelId: string;
  linkId: string;
  title?: string | null;
  url?: string | null;
  description?: string | null;
}

export interface DeleteChannelLinkBody {
  channelId: string;
  linkId: string;
}
