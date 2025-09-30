// types/channel.ts

export type ChannelId = string;

export interface Channel {
  id: ChannelId;
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
