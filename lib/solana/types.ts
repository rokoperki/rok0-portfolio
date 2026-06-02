export interface OverseerRecord {
  pubkey: string;       // PDA base58
  authority: string;   // wallet base58
  codename: string;
  enrolledAt: number;  // unix seconds
  lastSeen: number;    // unix seconds
  visits: number;
  clearance: 0 | 1 | 2;
  message: string;
}

export const CLEARANCE_LABELS = ['OPERATIVE', 'OVERSEER', 'COMMANDER'] as const;
export type ClearanceLabel = (typeof CLEARANCE_LABELS)[number];

export const CLEARANCE_CSS = ['dim', 'sy', 'op'] as const; // maps to .ps CSS classes

export function relativeTime(unixSeconds: number): string {
  const delta = Math.floor(Date.now() / 1000) - unixSeconds;
  if (delta < 60)   return 'just now';
  if (delta < 3600) return `${Math.floor(delta / 60)}m ago`;
  if (delta < 86400) return `${Math.floor(delta / 3600)}h ago`;
  return `${Math.floor(delta / 86400)}d ago`;
}
