export type UserRole = "customer" | "admin" | "superadmin" | "staff";

export interface VrixPlusMembership {
  isMember: boolean;
  joinedDate?: string | null;
  tier?: "Silver" | "Gold" | "Platinum" | "Atelier";
  discountRate?: number;
}

export interface User {
  id: string;
  email: string;
  name?: string | null;
  phone?: string | null;
  role?: UserRole | string | null;
  isVrixPlusMember: boolean;
  vrixPlusJoinedDate?: string | null;
  dateOfBirth?: string | null;
  createdAt?: string | Date;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
  error?: string;
}
