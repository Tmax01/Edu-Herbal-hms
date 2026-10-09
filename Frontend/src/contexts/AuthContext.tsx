import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { StaffUser, Module, Branch, Role } from '../types';
import { authService, AuthUser } from '../services/authService';
import { defaultModulesByRole } from '../constants/system';

interface AuthContextValue {
  user: StaffUser | null;
  authUser: AuthUser | null;
  activeBranch: Branch;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; landingPage?: string }>;
  logout: () => Promise<void>;
  setActiveBranch: (b: Branch) => void;
  can: (module: Module) => boolean;
  isCTO: () => boolean;
  isAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const roleLandingPage: Record<string, string> = {
  cto: 'dashboard',
  admin: 'dashboard',
  doctor: 'consultation',
  nurse: 'nursing',
  pharmacist: 'pharmacy',
  lab_tech: 'lab',
  receptionist: 'appointments',
  accountant: 'accounting',
  call_centre: 'callcentre',
  store_officer: 'inventory',
  hr: 'hr',
};

// Map backend user structure to StaffUser format expected by existing frontend views
function mapAuthUserToStaffUser(backendUser: AuthUser): StaffUser {
  const role = backendUser.role as Role;
  const roleDefaults = defaultModulesByRole[role] || ['dashboard', 'chat', 'meetings', 'daily_reports', 'telemedicine'];
  const allowedModules: Module[] = [...roleDefaults];


  // Include custom permissions if explicitly provided from backend
  if (backendUser.modulePermissions && backendUser.modulePermissions.length > 0) {
    backendUser.modulePermissions.forEach((p) => {
      if (p.canAccess && !allowedModules.includes(p.moduleKey as Module)) {
        allowedModules.push(p.moduleKey as Module);
      }
    });
  }

  const branchName = backendUser.primaryBranch?.name?.includes('Mankessim') ? 'Mankessim' : 'Accra';

  return {
    id: backendUser.id || backendUser.staffNumber,
    name: backendUser.fullName || backendUser.email.split('@')[0],
    email: backendUser.email,
    password: '***',
    role: role || 'doctor',
    branch: branchName,
    department: backendUser.department?.name || 'General',
    phone: backendUser.phone || '',
    active: backendUser.isActive,
    allowedModules,
    createdAt: new Date().toISOString(),
    lastLogin: backendUser.lastLoginAt || new Date().toISOString(),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [user, setUser] = useState<StaffUser | null>(null);
  const [activeBranch, setActiveBranchState] = useState<Branch>('Accra');
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize session from stored token & user data on app mount
  useEffect(() => {
    const storedUser = authService.getStoredUser();
    if (storedUser && authService.isAuthenticated()) {
      setAuthUser(storedUser);
      const mapped = mapAuthUserToStaffUser(storedUser);
      setUser(mapped);
      const storedBranch = authService.getActiveBranchId();
      if (storedBranch) {
        setActiveBranchState(storedBranch.includes('mankessim') ? 'Mankessim' : 'Accra');
      }
    }
    setLoading(false);
  }, []);

  const setActiveBranch = (b: Branch) => {
    setActiveBranchState(b);
    authService.setActiveBranchId(b === 'Mankessim' ? 'mankessim-branch-002' : 'accra-main-branch-001');
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      // 1. Try real API Login
      const res = await authService.login({ identifier: email, password });
      setAuthUser(res.user);
      const mappedUser = mapAuthUserToStaffUser(res.user);
      setUser(mappedUser);
      setActiveBranch(mappedUser.branch);
      setLoading(false);

      const landing = roleLandingPage[res.user.role] ?? 'dashboard';
      return { success: true, landingPage: landing };
    } catch (apiError: any) {
      setLoading(false);
      let errorMessage =
        apiError?.message ||
        (Array.isArray(apiError?.message) ? apiError.message.join(', ') : null) ||
        'Invalid credentials. Please check your email and password.';

      if (
        typeof errorMessage === 'string' &&
        (errorMessage.includes('PrismaClient') ||
          errorMessage.includes('findFirst') ||
          errorMessage.includes('invocation in') ||
          errorMessage.includes("Can't reach database server"))
      ) {
        errorMessage = 'Database server is unreachable. Please ensure your PostgreSQL database server is running at localhost:5432.';
      }

      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authService.logout();
    } catch {
      authService.clearSession();
    } finally {
      setAuthUser(null);
      setUser(null);
      setActiveBranchState('Accra');
      setLoading(false);
    }
  };

  const can = (module: Module): boolean => {
    if (!user) return false;
    return user.allowedModules.includes(module);
  };

  const isCTO = () => user?.role === 'cto';
  const isAdmin = () => user?.role === 'admin' || user?.role === 'cto';

  return (
    <AuthContext.Provider
      value={{
        user,
        authUser,
        activeBranch,
        loading,
        login,
        logout,
        setActiveBranch,
        can,
        isCTO,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
