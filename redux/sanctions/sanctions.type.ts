// redux/sanctions/sanctions.types.ts
export type SanctionType = "warning" | "query" | "suspension" | "penalty" | "other";

export interface ApiSanction {
  _id: string;
  userId: string;
  reason: string;
  type: SanctionType;
  duration: number;         // days or hours (server-defined)
  isActive?: boolean;       // optional per docs
  createdAt?: string;       // optional but common
  updatedAt?: string;
  // if your API returns a nested user, keep it optional:
  user?: { _id: string; fullname?: string; name?: string; email?: string };
}

export interface CreateSanctionBody {
  userId: string;
  reason: string;
  type: SanctionType;
  duration: number;
}

export interface UpdateSanctionBody {
  sanctionId: string;
  reason?: string;
  type?: SanctionType;
  duration?: number;
  isActive?: boolean;
}

export type SanctionsQuery = { userId?: string };

export interface SanctionsState {
  items: ApiSanction[];
  loading: boolean;
  error?: string | null;
  creating: boolean;
  updating: boolean;
  fetchedFor: Record<string, boolean>;
}
