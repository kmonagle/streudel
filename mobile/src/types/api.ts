// API response and error types

export interface ApiError {
  error: string;
  details?: Array<{
    message: string;
    field?: string;
  }>;
}

export interface ApiResponse<T> {
  data: T;
  status: number;
}

// OAuth related types
export type OAuthProvider = 'google' | 'facebook' | 'apple';

export interface AuthSession {
  cookie: string;
  expiresAt?: string;
}
