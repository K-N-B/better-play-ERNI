import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isValidWord } from '../wordValidator';

// FIX: Correct path from "src/services/__tests__" to "src/wordLists"
vi.mock('../../wordLists/words_5.json', () => ({
  default: ['APPLE', 'BERRY', 'CHERRY']
}));

describe('isValidWord', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('returns true for a valid word existing in the list', async () => {
    const result = await isValidWord('APPLE');
    expect(result).toBe(true);
  });

  it('returns false for a word not in the list', async () => {
    const result = await isValidWord('ZEBRA');
    expect(result).toBe(false);
  });

  it('is case insensitive', async () => {
    const result = await isValidWord('apple');
    expect(result).toBe(true);
  });

  it('returns false immediately for invalid length words', async () => {
    expect(await isValidWord('A')).toBe(false); 
    expect(await isValidWord('SUPERCALIFRAGILISTIC')).toBe(false); 
  });
});