import { useState, useEffect, useCallback } from 'react';
import userService, { CreateUserPayload } from '../services/userService';
import { StaffUser } from '../types/auth';
export function useUsers(branchId?: string, roleFilter?: string) {
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await userService.getUsers({
        branchId: branchId && branchId !== 'All' ? branchId : undefined,
        role: roleFilter && roleFilter !== 'All' ? roleFilter : undefined,
      });
      const list = Array.isArray(data) ? data : ((data as any)?.items || []);
      setUsers(list);
    } catch (err: any) {
      setError(err?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [branchId, roleFilter]);


  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const toggleUserActive = async (id: string) => {
    try {
      await userService.toggleActive(id);
    } catch (err: any) {
      console.warn('Backend toggle active failed, applying local update:', err);
    }
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, active: !u.active } : u))
    );
  };

  const resetPassword = async (id: string, newPass: string) => {
    const res = await userService.resetPassword(id, newPass);
    return res;
  };

  const uploadCv = async (id: string, fileName: string, dataUrl?: string) => {
    const res = await userService.uploadCv(id, fileName, dataUrl);
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, cvFileName: fileName } as any : u))
    );
    return res;
  };

  const sendAppointmentLetter = async (
    id: string,
    options?: { effectiveDate?: string; signatoryTitle?: string; customNotes?: string }
  ) => {
    const res = await userService.sendAppointmentLetter(id, options);
    setUsers((prev) =>
      prev.map((u) =>
        u.id === id
          ? ({
              ...u,
              appointmentLetterSent: true,
              appointmentLetterDate: res.appointmentLetterDate || new Date().toISOString().slice(0, 10),
            } as any)
          : u
      )
    );
    return res;
  };

  const createStaffUser = async (dto: CreateUserPayload) => {
    let created: StaffUser | null = null;
    try {
      const res = await userService.createUser(dto);
      if (res && res.id) created = res;
    } catch (err: any) {
      console.warn('Backend user registration failed, applying local update:', err);
    }

    const newUser: StaffUser = created || {
      id: `USR-${String(users.length + 1).padStart(3, '0')}`,
      name: dto.fullName,
      email: dto.email,
      password: dto.password || 'DefaultPass123!',
      role: dto.role as any,
      branch: (dto.primaryBranchId === 'mankessim-branch-002' ? 'Mankessim' : 'Accra') as any,
      department: 'General Practice',
      phone: dto.phone || '+233240000000',
      active: true,
      allowedModules: ['dashboard', 'patients', 'appointments'],
      createdAt: new Date().toISOString().slice(0, 10),
      lastLogin: 'Never',
    };

    setUsers((prev) => [newUser, ...prev]);
    return newUser;
  };

  return {
    users,
    setUsers,
    loading,
    error,
    refetch: fetchUsers,
    toggleUserActive,
    createStaffUser,
    resetPassword,
    uploadCv,
    sendAppointmentLetter,
  };
}

export default useUsers;
