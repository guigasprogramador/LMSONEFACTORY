// Definiu00e7u00e3o de tipos para usuu00e1rios

// Interface para o tipo de usuu00e1rio
export interface User {
  id: string;
  email: string;
  role: 'admin' | 'student';
  username?: string;
  created_at?: string;
  updated_at?: string;
  last_sign_in_at?: string;
  confirmed_at?: string;
  user_metadata?: {
    name?: string;
    avatar?: string;
    [key: string]: any;
  };
}

// Interface para credenciais de login
export interface LoginCredentials {
  email: string;
  password: string;
}

// Interface para dados de registro
export interface RegisterData extends LoginCredentials {
  username?: string;
  role?: 'admin' | 'student';
  metadata?: {
    name?: string;
    avatar?: string;
    [key: string]: any;
  };
}

// Interface para resposta de autenticau00e7u00e3o
export interface AuthResponse {
  user: User;
  token: string;
  expires_at?: string;
}

// Interface para erro de autenticau00e7u00e3o
export interface AuthError {
  message: string;
  code?: string;
  status?: number;
}
