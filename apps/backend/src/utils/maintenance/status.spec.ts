import { describe, it, expect } from 'vitest';
import { MaintenanceStatus } from '../../models/MaintenanceRequest';
import { assertTransition, canTransition, isTerminal } from './status';

describe('maintenance status state machine', () => {
  describe('canTransition', () => {
    it('treats same-status as a valid no-op', () => {
      for (const status of Object.values(MaintenanceStatus)) {
        expect(canTransition(status, status)).toBe(true);
      }
    });

    it('allows open → in-progress and open → cancelled', () => {
      expect(
        canTransition(MaintenanceStatus.OPEN, MaintenanceStatus.IN_PROGRESS)
      ).toBe(true);
      expect(
        canTransition(MaintenanceStatus.OPEN, MaintenanceStatus.CANCELLED)
      ).toBe(true);
    });

    it('forbids open → completed (must pass through in-progress)', () => {
      expect(
        canTransition(MaintenanceStatus.OPEN, MaintenanceStatus.COMPLETED)
      ).toBe(false);
    });

    it('allows in-progress → completed and in-progress → cancelled', () => {
      expect(
        canTransition(
          MaintenanceStatus.IN_PROGRESS,
          MaintenanceStatus.COMPLETED
        )
      ).toBe(true);
      expect(
        canTransition(
          MaintenanceStatus.IN_PROGRESS,
          MaintenanceStatus.CANCELLED
        )
      ).toBe(true);
    });

    it('forbids in-progress → open (cannot move backwards)', () => {
      expect(
        canTransition(MaintenanceStatus.IN_PROGRESS, MaintenanceStatus.OPEN)
      ).toBe(false);
    });

    it('forbids any transition out of completed', () => {
      expect(
        canTransition(MaintenanceStatus.COMPLETED, MaintenanceStatus.OPEN)
      ).toBe(false);
      expect(
        canTransition(
          MaintenanceStatus.COMPLETED,
          MaintenanceStatus.IN_PROGRESS
        )
      ).toBe(false);
      expect(
        canTransition(MaintenanceStatus.COMPLETED, MaintenanceStatus.CANCELLED)
      ).toBe(false);
    });

    it('forbids any transition out of cancelled', () => {
      expect(
        canTransition(MaintenanceStatus.CANCELLED, MaintenanceStatus.OPEN)
      ).toBe(false);
      expect(
        canTransition(
          MaintenanceStatus.CANCELLED,
          MaintenanceStatus.IN_PROGRESS
        )
      ).toBe(false);
      expect(
        canTransition(MaintenanceStatus.CANCELLED, MaintenanceStatus.COMPLETED)
      ).toBe(false);
    });
  });

  describe('assertTransition', () => {
    it('returns silently on a legal transition', () => {
      expect(() =>
        assertTransition(MaintenanceStatus.OPEN, MaintenanceStatus.IN_PROGRESS)
      ).not.toThrow();
    });

    it('throws a 400 error on an illegal transition', () => {
      expect(() =>
        assertTransition(MaintenanceStatus.COMPLETED, MaintenanceStatus.OPEN)
      ).toThrow(/Invalid status transition/);
    });
  });

  describe('isTerminal', () => {
    it('returns true for completed and cancelled', () => {
      expect(isTerminal(MaintenanceStatus.COMPLETED)).toBe(true);
      expect(isTerminal(MaintenanceStatus.CANCELLED)).toBe(true);
    });

    it('returns false for open and in-progress', () => {
      expect(isTerminal(MaintenanceStatus.OPEN)).toBe(false);
      expect(isTerminal(MaintenanceStatus.IN_PROGRESS)).toBe(false);
    });
  });
});
