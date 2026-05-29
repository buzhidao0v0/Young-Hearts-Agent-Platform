export interface User {
  id: number;
  username: string;
  email?: string;
  nickname?: string;
  avatar?: string;
  roles: string[];
  status: string;
  is_active: boolean;
  is_superuser: boolean;
}

export interface AuthContext {
  user: User;
  tenantId?: string;
  traceId?: string;
}

export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
}

export interface PaginatedResponse<T = unknown> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}
