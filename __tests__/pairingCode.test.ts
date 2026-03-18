import { describe, expect, it } from '@jest/globals';
import { generatePairingCode, makeSeededRng } from '../utils/pairingCode';

describe('generatePairingCode', () => {
  it('generates a 6-char code using the expected alphabet', () => {
    const rng = makeSeededRng(123);
    const code = generatePairingCode(6, rng);
    expect(code).toHaveLength(6);
    expect(code).toMatch(/^[A-Z2-9]{6}$/);
  });

  it('is deterministic for a seeded RNG', () => {
    const a = generatePairingCode(6, makeSeededRng(42));
    const b = generatePairingCode(6, makeSeededRng(42));
    expect(a).toBe(b);
  });

  it('does not collide across many generations (seeded)', () => {
    const rng = makeSeededRng(999);
    const seen = new Set<string>();
    for (let i = 0; i < 5000; i++) {
      const code = generatePairingCode(6, rng);
      expect(seen.has(code)).toBe(false);
      seen.add(code);
    }
  });
});

