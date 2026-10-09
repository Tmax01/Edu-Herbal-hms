export interface UserModulePermission {
  id: string;
  userId: string;
  moduleKey: string;
  canAccess: boolean;
}

export interface UserBranch {
  id: string;
  name: string;
  code: string;
}

export interface UserDepartment {
  id: string;
  name: string;
  code: string;
}

export interface AuthUser {
  id: string;
  staffNumber: string;
  email: string;
  fullName: string;
  role: string;
  primaryBranchId?: string | null;
  departmentId?: string | null;
  phone?: string | null;
  isActive: boolean;
  lastLoginAt?: string | null;
  primaryBranch?: UserBranch | null;
  department?: UserDepartment | null;
  modulePermissions?: UserModulePermission[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface LoginDto {
  email?: string;
  identifier?: string;
  staffNumber?: string;
  password?: string;
}

export interface LoginResponse {
  message: string;
  user: AuthUser;
  tokens: AuthTokens;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface LogoutResponse {
  message: string;
}

export type Role =
  | 'cto'
  | 'admin'
  | 'doctor'
  | 'nurse'
  | 'pharmacist'
  | 'lab_tech'
  | 'receptionist'
  | 'accountant'
  | 'call_centre'
  | 'store_officer'
  | 'hr';

export type Branch = 'Accra' | 'Mankessim' | 'All';

export type Module =
  | 'dashboard'
  | 'patients'
  | 'appointments'
  | 'consultation'
  | 'pharmacy'
  | 'lab'
  | 'billing'
  | 'ward'
  | 'nursing'
  | 'callcentre'
  | 'followups'
  | 'production'
  | 'inventory'
  | 'suppliers'
  | 'reports'
  | 'accounting'
  | 'hr'
  | 'meetings'
  | 'chat'
  | 'daily_reports'
  | 'telemedicine'
  | 'analytics'
  | 'ai_assistant'
  | 'user_management'
  | 'access_control'
  | 'audit_log';

export interface StaffUser {
  id: string;
  staffId?: string;
  name: string;
  email: string;
  password?: string;
  role: Role;
  branch: Branch;
  department?: string;
  phone?: string;
  active: boolean;
  allowedModules: Module[];
  modules?: Module[];
  createdAt?: string;
  lastLogin?: string;
}

