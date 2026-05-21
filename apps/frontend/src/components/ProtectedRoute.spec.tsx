import { describe, expect, it, vi, Mock } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import { useAuth } from '../contexts/AuthContext';
import { User } from '../types';

vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const useAuthMock = useAuth as unknown as Mock;

const user: User = {
  _id: 'user-1',
  email: 'tenant@x.com',
  firstName: 'Test',
  lastName: 'Tenant',
  role: 'tenant',
  isEmailVerified: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const renderRoute = (requiredRoles: string[] = []) =>
  render(
    <MemoryRouter initialEntries={['/private']}>
      <Routes>
        <Route
          path="/private"
          element={
            <ProtectedRoute requiredRoles={requiredRoles}>
              <div>Private content</div>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<div>Login page</div>} />
      </Routes>
    </MemoryRouter>
  );

describe('ProtectedRoute', () => {
  it('redirects unauthenticated users to login', () => {
    useAuthMock.mockReturnValue({ user: null, loading: false });

    renderRoute();

    expect(screen.getByText('Login page')).toBeInTheDocument();
  });

  it('renders children for an authenticated user with an allowed role', () => {
    useAuthMock.mockReturnValue({ user, loading: false });

    renderRoute(['tenant']);

    expect(screen.getByText('Private content')).toBeInTheDocument();
  });

  it('shows access denied when the user role is not allowed', () => {
    useAuthMock.mockReturnValue({ user, loading: false });

    renderRoute(['manager']);

    expect(screen.getByText('Access Denied')).toBeInTheDocument();
  });
});
