// types/channel.ts

export type ChannelId = string;

export interface Channel {
  _id: ChannelId;
  name: string;
  description?: string | null;
  code: string;              
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateChannelResponse {
  message: string;
  channel: Channel;
}

export interface GetChannelsResponse {
  channels: Channel[];
}

export interface GenerateCodeResponse {
  code: string;
}

export interface GetChannelByIdResponse {
  success: boolean;
  message: string;
  data: { channel: Channel };
}

export interface AddMemberBody {
  code: string; 
  userId: string;               
  type: "pm" | "staff" | "client"; 
}
export interface AddMemberResponse {
  message: string;
  channel: Channel;
}

export interface RemoveMemberBody {
  channelId: string;
  userId: string;
}
export interface RemoveMemberResponse {
  message: string;
  channel: Channel;
}

export interface UpdateMemberRoleBody {
  channelId: string;
  userId: string;
  type: "pm" | "staff" | "client";
}
export interface UpdateMemberRoleResponse {
  message: string;
  channel: Channel;
}

export interface CreateTaskBody {
  channelId: string;
  name: string;
  description?: string | null;
}
export interface CreateTaskResponse {
  message: string;
  channel: Channel;
}

export interface UpdateTaskBody {
  channelId: string;
  taskId: string;
  name?: string;
  description?: string | null;
}
export interface UpdateTaskResponse {
  message: string;
  channel: Channel;
}

export interface UploadResourcesBody {
  channelId: string;
  resources: Array<{
    name: string;
    description?: string | null;
    resourceUpload: string;
  }>;
}
export interface UploadResourcesResponse {
  message: string;
  channel: Channel;
}