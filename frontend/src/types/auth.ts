export interface LoginRequest {
  usernameOrEmail: string;
  password: string;
}

export interface SignUpRequest {
  username: string;
  email: string;
  password: string;
  rating?: number;
}

export interface AuthResponse {
  token: string;
  username: string;
  email: string;
  rating: number;
  role: string;
}
