import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '../../services/apiClient';
import { authService } from '../../services/authService';

// Mock HTTP transport layer
vi.mock('../../services/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('Auth Service Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('POST /auth/login - authenticates staff user and returns JWT session tokens', async () => {
    const mockResponse = {
      message: 'Login successful',
      user: { id: 'USR-001', email: 'doctor@eduhms.gh', fullName: 'Dr. Kofi Mensah', role: 'doctor' },
      tokens: { accessToken: 'mock-jwt-token', refreshToken: 'mock-refresh-token', tokenType: 'Bearer', expiresIn: 3600 },
    };
    (apiClient.post as any).mockResolvedValue(mockResponse);

    const res = await authService.login({ email: 'doctor@eduhms.gh', password: 'SecureDoctorPass#2026!' });

    expect(apiClient.post).toHaveBeenCalledWith('/auth/login', {
      identifier: 'doctor@eduhms.gh',
      password: 'SecureDoctorPass#2026!',
    });
    expect(res.user.fullName).toBe('Dr. Kofi Mensah');
    expect(res.tokens.accessToken).toBe('mock-jwt-token');
  });

  it('POST /auth/logout - revokes refresh session and clears local session cache', async () => {
    (apiClient.post as any).mockResolvedValue({ message: 'Logged out' });

    const res = await authService.logout();

    expect(apiClient.post).toHaveBeenCalledWith('/auth/logout', { sessionId: undefined });
    expect(res.message).toBe('Logged out');
  });
});
