import { describe, it, expect } from 'vitest';
import { calculateSpeedBonus } from '../SpeedBonus';

describe('calculateSpeedBonus', () => {
  const MAX_TIME = 60000; // 60 seconds

  it('returns 100 points for tier 1 speed (<= 25%)', () => {
    expect(calculateSpeedBonus(15000, MAX_TIME)).toBe(100);
  });

  it('returns 50 points for tier 2 speed (25% - 50%)', () => {
    expect(calculateSpeedBonus(30000, MAX_TIME)).toBe(50);
  });

  it('returns 0 if time spent exceeds max time', () => {
    expect(calculateSpeedBonus(60001, MAX_TIME)).toBe(0);
  });

  it('handles edge case of 0 max time safely', () => {
    expect(calculateSpeedBonus(100, 0)).toBe(0);
  });
});
