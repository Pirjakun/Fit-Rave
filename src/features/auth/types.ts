export interface Employee {
  id: string;
  name: string;
  email: string;
  avatarInitial: string;
}

export type UserRole = "employee" | "admin";

export interface UserProfile {
  name: string;
  email: string;
  avatarInitial: string;
  role: UserRole;
  createdAt: string;
}
