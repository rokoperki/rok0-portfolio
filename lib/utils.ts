export const hx = (n: number, p = 4): string =>
  '0x' + n.toString(16).toUpperCase().padStart(p, '0');

export const rnd = <T>(a: T[]): T => a[Math.floor(Math.random() * a.length)];

export const rhex = (len = 8): string => {
  let s = '';
  for (let i = 0; i < len; i++) s += '0123456789ABCDEF'[Math.floor(Math.random() * 16)];
  return s;
};

const B58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

export function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function b58target(s: string): string {
  let h = hashStr(s);
  let out = '';
  for (let i = 0; i < s.length; i++) {
    if (s[i] === ' ') { out += ' '; continue; }
    h = Math.imul(h ^ (i * 0x9e3779b1), 2654435761) >>> 0;
    out += B58[h % 58];
  }
  return out;
}

export function scrambleStep(
  orig: string,
  target: string,
  step: number,
  totalSteps: number,
): string {
  const lock = Math.floor(orig.length * (step / totalSteps));
  let out = '';
  for (let i = 0; i < orig.length; i++) {
    if (orig[i] === ' ') { out += ' '; continue; }
    out += i < lock ? target[i] : B58[Math.floor(Math.random() * B58.length)];
  }
  return out;
}

export function partClass(status: string): string {
  const s = (status || '').toUpperCase();
  if (s.startsWith('OPERATING')) return 'op';
  if (s.startsWith('DORMANT') || s.startsWith('OFFLINE')) return 'dim';
  return s.startsWith('SYNC') ? 'sy' : 'dm';
}
