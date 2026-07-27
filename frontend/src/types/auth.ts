export type Role = 'patient' | 'doctor' | 'admin' | 'caregiver' | 'pharmacist';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  tenantId?: string;
}

export interface AuthSession {
  token: string;
  user: User;
  isAuthenticated: boolean;
}
