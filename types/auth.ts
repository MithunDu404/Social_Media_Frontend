export interface User {
  id: number;
  user_name: string;
  email: string;
  picture_url?: string | null;
  phone?: string | null;
  dob?: string | null;
  location?: string | null;
  about?: string | null;
}

export interface AuthResponse {
  token: string;
  user: User;
}
