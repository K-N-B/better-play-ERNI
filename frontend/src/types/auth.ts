export interface User {
  id: number;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  isAdminUser: boolean;
  totalPoints: number;
  puzzlesCompleted: number;
  currentStreak: number;
  longestStreak: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
  password2: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  user: User;
  access: string;
  refresh: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
}