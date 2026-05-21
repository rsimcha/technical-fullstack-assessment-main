import { describe, expect, it } from 'vitest';
import { MaintenancePriority, MaintenanceStatus } from '../types';
import {
  descriptionField,
  priorityField,
  statusField,
  titleField,
} from './maintenanceSchemas';

describe('titleField', () => {
  it('trims surrounding whitespace before validating length', () => {
    const result = titleField.safeParse('  Leaky faucet  ');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe('Leaky faucet');
    }
  });

  it('rejects titles shorter than 3 characters after trimming', () => {
    const result = titleField.safeParse('   ab   ');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        'Title must be at least 3 characters'
      );
    }
  });

  it('rejects titles longer than 120 characters', () => {
    const result = titleField.safeParse('x'.repeat(121));
    expect(result.success).toBe(false);
  });
});

describe('descriptionField', () => {
  it('rejects empty / whitespace-only descriptions', () => {
    const result = descriptionField.safeParse('   ');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Description is required');
    }
  });

  it('accepts a non-empty description', () => {
    const result = descriptionField.safeParse('Water leaking under the sink.');
    expect(result.success).toBe(true);
  });
});

describe('priorityField', () => {
  it('accepts valid priority enum values', () => {
    expect(priorityField.safeParse(MaintenancePriority.URGENT).success).toBe(
      true
    );
  });

  it('rejects unknown priority values', () => {
    expect(priorityField.safeParse('catastrophic').success).toBe(false);
  });
});

describe('statusField', () => {
  it('accepts valid status enum values', () => {
    expect(statusField.safeParse(MaintenanceStatus.IN_PROGRESS).success).toBe(
      true
    );
  });

  it('rejects unknown status values', () => {
    expect(statusField.safeParse('archived').success).toBe(false);
  });
});
