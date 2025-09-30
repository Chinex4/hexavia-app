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

// POST /api/channel → 201
export interface CreateChannelResponse {
  message: string;
  channel: Channel;
}

// GET /api/channel
export interface GetChannelsResponse {
  channels: Channel[];
}

// GET /api/channel/generate-code
export interface GenerateCodeResponse {
  code: string;
}

// GET /api/channel/{id}
export interface GetChannelByIdResponse {
  success: boolean;
  message: string;
  data: { channel: Channel };
}

// POST /api/channel/add-member
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

// POST /api/channel/update-member-role
export interface UpdateMemberRoleBody {
  channelId: string;
  userId: string;
  type: "pm" | "staff" | "client";
}
export interface UpdateMemberRoleResponse {
  message: string;
  channel: Channel;
}
