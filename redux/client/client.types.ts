export type ClientStatus =
  | "pending"
  | "current"
  | "completed"
  | "archived"
  | string;

export interface Client {
  _id: string;
  name: string;
  projectName?: string;
  engagement?: string;
  industry?: string;
  staffSize?: number;
  description?: string;
  problems?: string;
  deliverables?: string;
  payableAmount?: number;
  status?: ClientStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface ClientFilters {
  status?: string;
  industry?: string;
  engagement?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface Pagination {
  currentPage: number;
  totalPages: number;
  totalClients: number;
  limit: number;
}

export interface ClientListResponse {
  success: boolean;
  clients: Client[];
  pagination: Pagination;
}

export interface ClientCreateInput {
  name: string;
  projectName?: string;
  engagement?: string;
  industry?: string;
  staffSize?: number;
  description?: string;
  problems?: string;
  deliverables?: string;
  payableAmount?: number;
  status?: ClientStatus;
}

export type ClientUpdateInput = Partial<ClientCreateInput>;

export interface ClientStats {
  total: number;
  totalPayable: number;
  averagePayable: number;
  byStatus: Array<{ _id: string; count: number }>;
  byIndustry: Array<{ _id: string; count: number }>;
}

export interface ClientState {
  byId: Record<string, Client>;
  allIds: string[];
  listLoading: boolean;
  detailLoading: boolean;
  mutationLoading: boolean;
  pagination: Pagination | null;
  filters: ClientFilters;
  current?: Client | null;
  stats?: ClientStats | null;
  statsLoading: boolean;
  error?: string | null;
}
