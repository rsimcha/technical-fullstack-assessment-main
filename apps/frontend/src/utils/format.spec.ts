import { describe, expect, it } from 'vitest';
import { formatEnumLabel } from './format';

describe('formatEnumLabel', () => {
  it('capitalizes a single word', () => {
    expect(formatEnumLabel('open')).toBe('Open');
  });

  it('splits hyphenated enum values and capitalizes each word', () => {
    expect(formatEnumLabel('in-progress')).toBe('In Progress');
  });

  it('handles empty strings without throwing', () => {
    expect(formatEnumLabel('')).toBe('');
  });
});
