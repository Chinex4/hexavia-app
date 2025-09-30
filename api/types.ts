export type ApiEnvelope<T = unknown> = {
  success?: boolean;
  message?: string;
  data?: T;
  user?: T;            
  token?: string | null;
  status?: boolean;
};

export type User = {
  id: number | string;
  fullname: string;
  email: string;
  role?: string | null;
  username?: string | null;
  phoneNumber?: string | null;
  channelCode?: string | null;
};
