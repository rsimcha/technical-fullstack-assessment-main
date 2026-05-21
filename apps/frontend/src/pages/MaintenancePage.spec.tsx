import { describe, expect, it, vi, Mock } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import MaintenancePage from './MaintenancePage';
import { useAuth } from '../contexts/AuthContext';
import { maintenanceService } from '../services/maintenanceService';
import { userService } from '../services/userService';
import {
  MaintenancePriority,
  MaintenanceRequest,
  MaintenanceStatus,
  User,
} from '../types';

vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../services/maintenanceService', () => ({
  maintenanceService: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

vi.mock('../services/userService', () => ({
  userService: {
    listByRole: vi.fn(),
  },
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const useAuthMock = useAuth as unknown as Mock;
const maintenanceMock = maintenanceService as unknown as {
  list: Mock;
  create: Mock;
  update: Mock;
  remove: Mock;
};
const userServiceMock = userService as unknown as {
  listByRole: Mock;
};

const makeUser = (role: User['role']): User => ({
  _id: `${role}-1`,
  email: `${role}@x.com`,
  firstName: 'Test',
  lastName: role,
  role,
  isEmailVerified: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
});

const request: MaintenanceRequest = {
  _id: 'request-1',
  title: 'Leaky faucet',
  description: 'Drips overnight',
  status: MaintenanceStatus.OPEN,
  priority: MaintenancePriority.HIGH,
  propertyId: 'unit-101',
  createdBy: {
    _id: 'tenant-1',
    firstName: 'Test',
    lastName: 'Tenant',
    email: 'tenant@x.com',
    role: 'tenant',
  },
  assignedTo: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const emptyList = {
  items: [],
  pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
};

const listWithRequest = {
  items: [request],
  pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
};

const managers = [
  {
    _id: 'manager-1',
    firstName: 'Mary',
    lastName: 'Manager',
    email: 'manager@x.com',
  },
];

describe('MaintenancePage', () => {
  it('lets tenants open the create form and submit a maintenance request', async () => {
    useAuthMock.mockReturnValue({ user: makeUser('tenant') });
    maintenanceMock.list.mockResolvedValue(emptyList);
    maintenanceMock.create.mockResolvedValue({ request });
    userServiceMock.listByRole.mockResolvedValue({ users: managers });

    render(<MaintenancePage />);

    expect(
      await screen.findByText('No maintenance requests yet.')
    ).toBeInTheDocument();
    expect(screen.queryByLabelText('Assignee')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'New request' }));
    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'Broken heater' },
    });
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'The heater stopped working' },
    });
    fireEvent.change(screen.getByLabelText('Property'), {
      target: { value: 'unit-202' },
    });
    const priorityFields = screen.getAllByLabelText('Priority');
    fireEvent.change(priorityFields[priorityFields.length - 1], {
      target: { value: 'high' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create request' }));

    await waitFor(() => {
      expect(maintenanceMock.create).toHaveBeenCalledWith({
        title: 'Broken heater',
        description: 'The heater stopped working',
        propertyId: 'unit-202',
        priority: 'high',
      });
    });
    expect(maintenanceMock.list).toHaveBeenCalledTimes(2);
  });

  it('shows management controls and refetches when filters change for managers', async () => {
    useAuthMock.mockReturnValue({ user: makeUser('manager') });
    maintenanceMock.list.mockResolvedValue(listWithRequest);
    userServiceMock.listByRole.mockResolvedValue({ users: managers });

    render(<MaintenancePage />);

    expect(await screen.findByText('Leaky faucet')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'New request' })
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText('Assignee')).toBeInTheDocument();
    expect(screen.getByLabelText('Edit Leaky faucet')).toBeInTheDocument();
    expect(screen.getByLabelText('Delete Leaky faucet')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Status'), {
      target: { value: 'open' },
    });

    await waitFor(() => {
      expect(maintenanceMock.list).toHaveBeenLastCalledWith({
        page: 1,
        limit: 10,
        status: MaintenanceStatus.OPEN,
      });
    });
  });

  it('lets managers edit a request and submit only the form patch', async () => {
    useAuthMock.mockReturnValue({ user: makeUser('manager') });
    maintenanceMock.list.mockResolvedValue(listWithRequest);
    maintenanceMock.update.mockResolvedValue({ request });
    userServiceMock.listByRole.mockResolvedValue({ users: managers });

    render(<MaintenancePage />);

    await screen.findByText('Leaky faucet');
    fireEvent.click(screen.getByLabelText('Edit Leaky faucet'));
    const assigneeFields = screen.getAllByLabelText('Assignee');
    fireEvent.change(assigneeFields[assigneeFields.length - 1], {
      target: { value: 'manager-1' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => {
      expect(maintenanceMock.update).toHaveBeenCalledWith('request-1', {
        title: 'Leaky faucet',
        description: 'Drips overnight',
        priority: MaintenancePriority.HIGH,
        status: MaintenanceStatus.OPEN,
        assignedTo: 'manager-1',
      });
    });
    expect(maintenanceMock.list).toHaveBeenCalledTimes(2);
  });
});
