import { describe, expect, it, vi, Mock } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import { authService } from '../services/authService';
import { User } from '../types';
import toast from 'react-hot-toast';

vi.mock('../services/authService', () => ({
  authService: {
    getToken: vi.fn(),
    getUser: vi.fn(),
    refreshToken: vi.fn(),
    getProfile: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    setToken: vi.fn(),
    setUser: vi.fn(),
    logout: vi.fn(),
  },
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const authMock = authService as unknown as {
  getToken: Mock;
  getUser: Mock;
  refreshToken: Mock;
  getProfile: Mock;
  login: Mock;
  setToken: Mock;
  setUser: Mock;
  logout: Mock;
};

const toastMock = toast as unknown as {
  success: Mock;
  error: Mock;
};

const makeUser = (overrides: Partial<User> = {}): User => ({
  _id: 'user-1',
  email: 'user@x.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'tenant',
  isEmailVerified: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

const Probe = () => {
  const { user, loading, login, logout } = useAuth();

  return (
    <div>
      <div data-testid="loading">{String(loading)}</div>
      <div data-testid="email">{user?.email ?? 'none'}</div>
      <button
        type="button"
        onClick={() => login({ email: 'login@x.com', password: 'password' })}
      >
        Login
      </button>
      <button type="button" onClick={logout}>
        Logout
      </button>
    </div>
  );
};

const renderProvider = () =>
  render(
    <AuthProvider>
      <Probe />
    </AuthProvider>
  );

describe('AuthProvider', () => {
  it('initializes from stored auth and persists the refreshed user', async () => {
    const savedUser = makeUser({ email: 'saved@x.com' });
    const verifiedUser = makeUser({ email: 'verified@x.com' });
    authMock.getToken.mockReturnValue('token-1');
    authMock.getUser.mockReturnValue(savedUser);
    authMock.refreshToken.mockResolvedValue({ user: verifiedUser });

    renderProvider();

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });
    expect(screen.getByTestId('email')).toHaveTextContent('verified@x.com');
    expect(authMock.setUser).toHaveBeenCalledWith(verifiedUser);
  });

  it('login stores token and user, updates context, and shows success', async () => {
    const loggedInUser = makeUser({ email: 'login@x.com' });
    authMock.getToken.mockReturnValue(null);
    authMock.getUser.mockReturnValue(null);
    authMock.login.mockResolvedValue({
      user: loggedInUser,
      token: 'token-1',
    });

    renderProvider();
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => {
      expect(screen.getByTestId('email')).toHaveTextContent('login@x.com');
    });
    expect(authMock.setToken).toHaveBeenCalledWith('token-1');
    expect(authMock.setUser).toHaveBeenCalledWith(loggedInUser);
    expect(toastMock.success).toHaveBeenCalledWith('Login successful!');
  });

  it('logout clears auth state', async () => {
    const savedUser = makeUser({ email: 'saved@x.com' });
    authMock.getToken.mockReturnValue('token-1');
    authMock.getUser.mockReturnValue(savedUser);
    authMock.refreshToken.mockResolvedValue({ user: savedUser });

    renderProvider();
    await waitFor(() => {
      expect(screen.getByTestId('email')).toHaveTextContent('saved@x.com');
    });

    fireEvent.click(screen.getByRole('button', { name: 'Logout' }));

    expect(screen.getByTestId('email')).toHaveTextContent('none');
    expect(authMock.logout).toHaveBeenCalled();
    expect(toastMock.success).toHaveBeenCalledWith('Logged out successfully');
  });
});
