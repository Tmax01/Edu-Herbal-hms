import { apiClient } from './apiClient';

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

const TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'auth_user';
const BRANCH_KEY = 'active_branch_id';

export const authService = {
  /**
   * Authenticate staff user credentials & issue JWT tokens
   * POST /api/v1/auth/login
   */
  async login(credentials: LoginDto): Promise<LoginResponse> {
    const payload = {
      identifier: credentials.identifier || credentials.email || credentials.staffNumber,
      password: credentials.password,
    };

    const response = await apiClient.post<unknown, LoginResponse>('/auth/login', payload);

    if (response && response.tokens && response.user) {
      this.saveSession(response.user, response.tokens);
    }

    return response;
  },

  /**
   * Rotate refresh token and issue a fresh access token
   * POST /api/v1/auth/refresh
   */
  async refresh(refreshToken: string): Promise<RefreshTokenResponse> {
    const response = await apiClient.post<unknown, RefreshTokenResponse>('/auth/refresh', {
      refreshToken,
    });

    if (response && response.accessToken) {
      localStorage.setItem(TOKEN_KEY, response.accessToken);
      if (response.refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
      }
    }

    return response;
  },

  /**
   * Revoke active refresh session and log out
   * POST /api/v1/auth/logout
   */
  async logout(sessionId?: string): Promise<LogoutResponse> {
    try {
      const response = await apiClient.post<unknown, LogoutResponse>('/auth/logout', {
        sessionId,
      });
      return response;
    } finally {
      this.clearSession();
    }
  },

  /**
   * Store user profile, tokens, and active branch context in localStorage
   */
  saveSession(user: AuthUser, tokens: AuthTokens): void {
    localStorage.setItem(TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    if (user.primaryBranchId) {
      localStorage.setItem(BRANCH_KEY, user.primaryBranchId);
    }
  },

  /**
   * Clear session data from localStorage
   */
  clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(BRANCH_KEY);
  },

  /**
   * Get cached staff user from localStorage
   */
  getStoredUser(): AuthUser | null {
    const data = localStorage.getItem(USER_KEY);
    if (!data) return null;
    try {
      return JSON.parse(data) as AuthUser;
    } catch {
      return null;
    }
  },

  /**
   * Get cached access token from localStorage
   */
  getStoredToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  /**
   * Check if user session token exists in localStorage
   */
  isAuthenticated(): boolean {
    return !!this.getStoredToken();
  },

  /**
   * Update active branch ID in localStorage
   */
  setActiveBranchId(branchId: string): void {
    localStorage.setItem(BRANCH_KEY, branchId);
  },

  /**
   * Get active branch ID from localStorage
   */
  getActiveBranchId(): string | null {
    return localStorage.getItem(BRANCH_KEY);
  },
};
