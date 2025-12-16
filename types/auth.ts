export interface User {
  id: number;
  user_name: string;
  email: string;
  picture_url?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}
