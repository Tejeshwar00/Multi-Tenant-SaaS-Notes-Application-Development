export interface User {
  id: string;
  email: string;
  password_hash: string;
  role: 'admin' | 'member';
  tenant_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  subscription_plan: 'free' | 'pro';
  created_at: Date;
  updated_at: Date;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  user_id: string;
  tenant_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface AuthToken {
  userId: string;
  email: string;
  role: 'admin' | 'member';
  tenantId: string;
  tenantSlug: string;
}

export interface CreateNoteRequest {
  title: string;
  content: string;
}

export interface UpdateNoteRequest {
  title?: string;
  content?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    role: string;
    tenant: {
      id: string;
      name: string;
      slug: string;
      subscription_plan: string;
    };
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}