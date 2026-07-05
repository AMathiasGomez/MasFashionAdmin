export interface UserSession {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  permissions: string[];
}

export type UserRole = 'administrator' | 'seller' | 'warehouse';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: 'Bearer';
  expiresAt: string;
  user: UserSession;
  sessionId: string;
}

