export type ChannelResourceCategory =
  | "image"
  | "document"
  | "audio"
  | "folder"
  | "other";

export type ChannelResource = {
  _id?: string;
  name: string;
  description?: string | null;
  resourceUpload: string;
  mime?: string | null;
  category?: ChannelResourceCategory;
};
export type ApiResource = {
  name: string;
  description: string;
  category: ChannelResourceCategory;
  resourceUpload: string;
};

export type UploadResourcesBody = {
  channelId: string;
  resources: ApiResource[];
};
