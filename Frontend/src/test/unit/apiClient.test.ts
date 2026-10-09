import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { apiClient } from '../../services/apiClient';

describe('apiClient Transport Layer & 401 Auto-Refresh Invariants', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Request Interceptor Invariants', () => {
    it('INVARIANT: Injects Authorization Bearer and X-Branch-ID headers when set in localStorage', async () => {
      localStorage.setItem('access_token', 'valid-jwt-token-xyz');
      localStorage.setItem('active_branch_id', 'branch-accra-001');

      // Interceptor handler
      const requestHandler = (apiClient.interceptors.request as any).handlers[0].fulfilled;

      const config = { headers: {} };
      const modifiedConfig = requestHandler(config);

      expect(modifiedConfig.headers.Authorization).toBe('Bearer valid-jwt-token-xyz');
      expect(modifiedConfig.headers['X-Branch-ID']).toBe('branch-accra-001');
    });

    it('leaves headers unchanged when localStorage is empty', async () => {
      const requestHandler = (apiClient.interceptors.request as any).handlers[0].fulfilled;
      const config = { headers: {} };
      const modifiedConfig = requestHandler(config);

      expect(modifiedConfig.headers.Authorization).toBeUndefined();
      expect(modifiedConfig.headers['X-Branch-ID']).toBeUndefined();
    });
  });

  describe('Response Envelope Unpacking Invariants', () => {
    it('INVARIANT: Unpacks backend envelope { statusCode, message, data: { ... } }', () => {
      const responseHandler = (apiClient.interceptors.response as any).handlers[0].fulfilled;

      const backendEnvelope = {
        data: {
          statusCode: 200,
          message: 'Operation executed successfully',
          data: { patientId: 'PAT-001', name: 'Ama Darko' },
          timestamp: '2026-10-09T10:00:00.000Z',
        },
      };

      const result = responseHandler(backendEnvelope);
      expect(result).toEqual({ patientId: 'PAT-001', name: 'Ama Darko' });
    });

    it('returns data directly if not wrapped in nested data property', () => {
      const responseHandler = (apiClient.interceptors.response as any).handlers[0].fulfilled;

      const rawResponse = {
        data: { id: 'item-101', count: 5 },
      };

      const result = responseHandler(rawResponse);
      expect(result).toEqual({ id: 'item-101', count: 5 });
    });
  });

  describe('Adversarial 401 Session Expiry & Auto-Refresh Resilience', () => {
    it('ADVERSARIAL: When no refresh token exists, 401 wipes auth state from localStorage', async () => {
      localStorage.setItem('access_token', 'expired-token');
      // No refresh_token in storage

      const errorHandler = (apiClient.interceptors.response as any).handlers[0].rejected;

      const mockError = {
        response: { status: 401, data: { message: 'Token expired' } },
        config: { url: '/patients', headers: {} },
      };

      await expect(errorHandler(mockError)).rejects.toBeDefined();

      expect(localStorage.getItem('access_token')).toBeNull();
      expect(localStorage.getItem('refresh_token')).toBeNull();
      expect(localStorage.getItem('auth_user')).toBeNull();
    });

    it('ADVERSARIAL: Rejects without refresh attempts on auth routes to prevent loops', async () => {
      const errorHandler = (apiClient.interceptors.response as any).handlers[0].rejected;

      const loginError = {
        response: { status: 401, data: { message: 'Invalid credentials' } },
        config: { url: '/auth/login', headers: {} },
      };

      await expect(errorHandler(loginError)).rejects.toEqual({ message: 'Invalid credentials' });
    });
  });
});
