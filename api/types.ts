export type ApiEnvelope<T = unknown> = {
  message?: string;
  user?: T;
  token?: string;
};

export type User = {
  id: number | string;
  fullName: string;
  email: string;
  username?: string | null;
  phoneNumber?: string | null;
  clientDeptCode?: string | null;
};
