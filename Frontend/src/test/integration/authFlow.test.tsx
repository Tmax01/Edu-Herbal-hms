import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import Login from '../../pages/Login';
import { AuthProvider } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';

vi.mock('../../services/authService', () => {
  return {
    authService: {
      login: vi.fn(),
      logout: vi.fn().mockResolvedValue({ message: 'Logged out' }),
      getStoredUser: vi.fn().mockReturnValue(null),
      isAuthenticated: vi.fn().mockReturnValue(false),
      getStoredToken: vi.fn().mockReturnValue(null),
      saveSession: vi.fn(),
      clearSession: vi.fn(),
    },
  };
});

// Mock logo asset to prevent canvas / base64 overhead
vi.mock('../../assets/logoData', () => ({
  default: 'mock-logo-url',
}));

describe('Login Page User Journey & Adversarial UI Validation', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    (authService.getStoredUser as any).mockReturnValue(null);
    (authService.isAuthenticated as any).mockReturnValue(false);
  });

  it('renders login form elements with accessible inputs and branding', () => {
    render(
      <AuthProvider>
        <Login />
      </AuthProvider>,
    );

    expect(screen.getAllByText('EduHMS').length).toBeGreaterThan(0);
    expect(screen.getByPlaceholderText('yourname@eduhms.gh')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
  });

  it('toggles password visibility between password and text type', () => {
    render(
      <AuthProvider>
        <Login />
      </AuthProvider>,
    );

    const passwordInput = screen.getByPlaceholderText('Enter your password') as HTMLInputElement;
    expect(passwordInput.type).toBe('password');

    // The eye toggle is the button next to the password input
    const buttons = screen.getAllByRole('button');
    // Role buttons + forgot + eye toggle + submit button
    const eyeToggle = passwordInput.parentElement?.querySelector('button');
    expect(eyeToggle).toBeDefined();

    if (eyeToggle) {
      fireEvent.click(eyeToggle);
      expect(passwordInput.type).toBe('text');

      fireEvent.click(eyeToggle);
      expect(passwordInput.type).toBe('password');
    }
  });

  it('ADVERSARIAL: Displays error banner when backend returns invalid credentials', async () => {
    (authService.login as any).mockRejectedValue(new Error('Invalid email or password'));

    render(
      <AuthProvider>
        <Login />
      </AuthProvider>,
    );

    const emailInput = screen.getByPlaceholderText('yourname@eduhms.gh');
    const passwordInput = screen.getByPlaceholderText('Enter your password');
    const submitBtn = screen.getByRole('button', { name: 'Sign In' });

    fireEvent.change(emailInput, { target: { value: 'unknown@eduhms.gh' } });
    fireEvent.change(passwordInput, { target: { value: 'WrongPass!' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Invalid email or password/i)).toBeInTheDocument();
    });
  });

  it('ADVERSARIAL: Displays server connectivity error banner when API is unreachable', async () => {
    (authService.login as any).mockRejectedValue(
      new Error('Database server is unreachable. Please ensure your PostgreSQL database server is running at localhost:5432.'),
    );

    render(
      <AuthProvider>
        <Login />
      </AuthProvider>,
    );

    const emailInput = screen.getByPlaceholderText('yourname@eduhms.gh');
    const passwordInput = screen.getByPlaceholderText('Enter your password');
    const submitBtn = screen.getByRole('button', { name: 'Sign In' });

    fireEvent.change(emailInput, { target: { value: 'admin@eduhms.gh' } });
    fireEvent.change(passwordInput, { target: { value: 'Secret#2026' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Database server is unreachable/i)).toBeInTheDocument();
    });
  });
});
