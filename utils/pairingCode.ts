const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generatePairingCode(
  length = 6,
  rng: () => number = Math.random
) {
  if (!Number.isFinite(length) || length <= 0) {
    throw new Error('length must be a positive number');
  }

  let code = '';
  for (let i = 0; i < length; i++) {
    const r = rng();
    const normalized = Number.isFinite(r) ? r : 0;
    const index =
      Math.floor(Math.abs(normalized) * ALPHABET.length) % ALPHABET.length;
    code += ALPHABET[index];
  }
  return code;
}

export function makeSeededRng(seed: number) {
  // LCG: deterministic and good enough for tests
  let state = (seed >>> 0) || 1;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

