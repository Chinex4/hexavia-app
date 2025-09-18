export type Role = "client" | "staff" | "admin";

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: Role;
};

export type AuthState = {
  user: AuthUser | null;
  bootstrapped: boolean; 
};
