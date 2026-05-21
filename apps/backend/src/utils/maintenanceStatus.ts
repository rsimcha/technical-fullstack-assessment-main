import { createError } from '../middleware/errorHandler';
import { MaintenanceStatus } from '../models/MaintenanceRequest';

const TRANSITIONS: Record<MaintenanceStatus, MaintenanceStatus[]> = {
  [MaintenanceStatus.OPEN]: [
    MaintenanceStatus.IN_PROGRESS,
    MaintenanceStatus.CANCELLED,
  ],
  [MaintenanceStatus.IN_PROGRESS]: [
    MaintenanceStatus.COMPLETED,
    MaintenanceStatus.CANCELLED,
  ],
  [MaintenanceStatus.COMPLETED]: [],
  [MaintenanceStatus.CANCELLED]: [],
};

export const canTransition = (
  from: MaintenanceStatus,
  to: MaintenanceStatus
): boolean => {
  if (from === to) {
    return true;
  }
  return TRANSITIONS[from]?.includes(to) ?? false;
};

export const assertTransition = (
  from: MaintenanceStatus,
  to: MaintenanceStatus
): void => {
  if (!canTransition(from, to)) {
    throw createError(`Invalid status transition: "${from}" → "${to}"`, 400);
  }
};

export const isTerminal = (status: MaintenanceStatus): boolean =>
  TRANSITIONS[status].length === 0;
