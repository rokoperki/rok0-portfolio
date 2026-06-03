'use client';

import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
} from '@solana/web3.js';
import type { OverseerRecord } from './types';

export const PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PROGRAM_ID ?? '8ftm3ruaXh2sbrTeozPDmTQk8iJbG8SoUZtyYPFiq7jS',
);
export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL ?? 'https://api.devnet.solana.com';

const HEADER_SIZE = 72; // fixed record header, message starts at 0x48

let _conn: Connection | null = null;
export function getConnection(): Connection {
  if (!_conn) _conn = new Connection(RPC_URL, 'finalized');
  return _conn;
}

// ── Parsing ──────────────────────────────────────────────────────────────────

function u8View(data: Buffer | Uint8Array): { u8: Uint8Array; dv: DataView } {
  const u8 = data instanceof Uint8Array ? data : new Uint8Array(data);
  return { u8, dv: new DataView(u8.buffer, u8.byteOffset, u8.byteLength) };
}

export function parseRecord(pubkey: string, data: Buffer | Uint8Array): OverseerRecord {
  const { u8, dv } = u8View(data);
  const authority  = new PublicKey(u8.slice(0x00, 0x20)).toBase58();
  const codename   = new TextDecoder().decode(u8.slice(0x20, 0x30)).replace(/\0/g, '').trim();
  const enrolledAt = Number(dv.getBigInt64(0x30, true));
  const lastSeen   = Number(dv.getBigInt64(0x38, true));
  const visits     = dv.getUint32(0x40, true);
  const clearance  = u8[0x44] as 0 | 1 | 2;
  const msgLen     = dv.getUint16(0x46, true);
  const message    = msgLen > 0 ? new TextDecoder().decode(u8.slice(0x48, 0x48 + msgLen)) : '';
  return { pubkey, authority, codename, enrolledAt, lastSeen, visits, clearance, message };
}

// ── PDA ───────────────────────────────────────────────────────────────────────

export async function findOverseerPDA(authority: PublicKey): Promise<[PublicKey, number]> {
  return PublicKey.findProgramAddress(
    [Buffer.from('overseer'), authority.toBuffer()],
    PROGRAM_ID,
  );
}

// ── Fetch ─────────────────────────────────────────────────────────────────────

export async function fetchOverseerRecord(authority: PublicKey): Promise<OverseerRecord | null> {
  const conn = getConnection();
  const [pda] = await findOverseerPDA(authority);
  const info  = await conn.getAccountInfo(pda, 'finalized');
  if (!info || info.owner.toBase58() !== PROGRAM_ID.toBase58()) return null;
  try { return parseRecord(pda.toBase58(), info.data); } catch { return null; }
}

export async function fetchRoster(): Promise<OverseerRecord[]> {
  const conn = getConnection();
  const accounts = await conn.getProgramAccounts(PROGRAM_ID, { commitment: 'finalized' });
  return accounts
    .filter(({ account }) => account.data.length >= HEADER_SIZE)
    .map(({ pubkey, account }) => {
      try { return parseRecord(pubkey.toBase58(), account.data); } catch { return null; }
    })
    .filter((r): r is OverseerRecord => r !== null)
    .sort((a, b) => b.visits - a.visits);
}

// ── Build transactions ────────────────────────────────────────────────────────

export async function buildRegisterTx(
  authority: PublicKey,
  codename: string,
  message: string,
): Promise<{ tx: Transaction; debugHex: string }> {
  const conn = getConnection();
  const [pda, bump] = await findOverseerPDA(authority);

  const codenameBytes = new Uint8Array(16);
  const encoded = new TextEncoder().encode(codename.slice(0, 16));
  codenameBytes.set(encoded);

  const msgBytes  = new TextEncoder().encode(message.slice(0, 700));
  const lamports  = await conn.getMinimumBalanceForRentExemption(HEADER_SIZE + msgBytes.length, 'finalized');

  // Build LE u64 for lamports without DataView to avoid any polyfill issues
  const lamBytes = new Uint8Array(8);
  const lamDv = new DataView(lamBytes.buffer);
  lamDv.setBigUint64(0, BigInt(lamports), true /* little-endian */);

  // Build LE u16 for msg_len
  const msgLenBytes = new Uint8Array(2);
  msgLenBytes[0] = msgBytes.length & 0xff;
  msgLenBytes[1] = (msgBytes.length >> 8) & 0xff;

  // Concatenate all fields explicitly — no DataView, no alignment surprises
  const parts = [
    new Uint8Array([0]),          // discriminator = IX_REGISTER
    codenameBytes,                // 16 bytes
    new Uint8Array([bump]),       // 1 byte
    lamBytes,                     // 8 bytes LE
    msgLenBytes,                  // 2 bytes LE
    msgBytes,                     // 0-700 bytes
  ];
  const totalLen = parts.reduce((s, p) => s + p.length, 0);
  const data = new Uint8Array(totalLen);
  let pos = 0;
  for (const p of parts) { data.set(p, pos); pos += p.length; }

  const hexStr = Array.from(data).map(b => b.toString(16).padStart(2, '0')).join('');
  console.log('[register] pda:', pda.toBase58(), 'bump:', bump, 'lamports:', lamports);
  console.log('[register] ix data (first 28 bytes):', hexStr.slice(0, 56));
  // byte 0 must be 00 (IX_REGISTER), bytes 1-16 = codename, byte 17 = bump
  if (data[0] !== 0) console.error('[register] BUG: discriminator is', data[0], 'not 0!');

  const ix = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: authority,                isSigner: true,  isWritable: true  },
      { pubkey: pda,                      isSigner: false, isWritable: true  },
      { pubkey: SystemProgram.programId,  isSigner: false, isWritable: false },
    ],
    data: Buffer.from(data),
  });

  const { blockhash } = await conn.getLatestBlockhash('finalized');
  const tx = new Transaction({ recentBlockhash: blockhash, feePayer: authority });
  tx.add(ix);
  return { tx, debugHex: hexStr };
}

export async function buildHeartbeatTx(
  authority: PublicKey,
  pda: PublicKey,
): Promise<Transaction> {
  const conn = getConnection();
  const ix = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: authority, isSigner: true,  isWritable: false },
      { pubkey: pda,       isSigner: false, isWritable: true  },
    ],
    data: Buffer.from([1]),
  });
  const { blockhash } = await conn.getLatestBlockhash('finalized');
  const tx = new Transaction({ recentBlockhash: blockhash, feePayer: authority });
  tx.add(ix);
  return tx;
}

// ── Send & confirm ────────────────────────────────────────────────────────────

export async function sendAndConfirm(serialized: Uint8Array): Promise<string> {
  const conn = getConnection();
  const sig  = await conn.sendRawTransaction(serialized, { skipPreflight: false });
  await conn.confirmTransaction(sig, 'finalized');
  return sig;
}

// ── Deregister ────────────────────────────────────────────────────────────────

export async function buildPromoteTx(
  commander: PublicKey,
  commanderPda: PublicKey,
  targetPda: PublicKey,
  targetWallet: PublicKey,
): Promise<Transaction> {
  const conn = getConnection();
  // IX data: discriminator(1) + target_wallet(32)
  const data = new Uint8Array(33);
  data[0] = 2; // IX_PROMOTE
  data.set(targetWallet.toBytes(), 1);
  const ix = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: commander,    isSigner: true,  isWritable: true  },
      { pubkey: commanderPda, isSigner: false, isWritable: false },
      { pubkey: targetPda,    isSigner: false, isWritable: true  },
    ],
    data: Buffer.from(data),
  });
  const { blockhash } = await conn.getLatestBlockhash('finalized');
  const tx = new Transaction({ recentBlockhash: blockhash, feePayer: commander });
  tx.add(ix);
  return tx;
}

export async function buildUpdateMessageTx(
  authority: PublicKey,
  newMessage: string,
): Promise<Transaction> {
  const conn = getConnection();
  const [pda] = await findOverseerPDA(authority);
  const msgBytes = new TextEncoder().encode(newMessage.slice(0, 700));
  const data = new Uint8Array(1 + 2 + msgBytes.length);
  data[0] = 5; // IX_UPDATE_MESSAGE
  data[1] = msgBytes.length & 0xff;
  data[2] = (msgBytes.length >> 8) & 0xff;
  data.set(msgBytes, 3);
  const ix = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: authority, isSigner: true,  isWritable: false },
      { pubkey: pda,       isSigner: false, isWritable: true  },
    ],
    data: Buffer.from(data),
  });
  const { blockhash } = await conn.getLatestBlockhash('finalized');
  const tx = new Transaction({ recentBlockhash: blockhash, feePayer: authority });
  tx.add(ix);
  return tx;
}

export async function buildDeregisterSelfTx(authority: PublicKey): Promise<Transaction> {
  const conn = getConnection();
  const [pda] = await findOverseerPDA(authority);
  const ix = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: authority, isSigner: true,  isWritable: true },
      { pubkey: pda,       isSigner: false, isWritable: true },
    ],
    data: Buffer.from([3]), // IX_DEREGISTER
  });
  const { blockhash } = await conn.getLatestBlockhash('finalized');
  const tx = new Transaction({ recentBlockhash: blockhash, feePayer: authority });
  tx.add(ix);
  return tx;
}

export async function buildDeregisterCommanderTx(
  commander: PublicKey,
  commanderPda: PublicKey,
  targetPda: PublicKey,
): Promise<Transaction> {
  const conn = getConnection();
  const ix = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: commander,    isSigner: true,  isWritable: true  },
      { pubkey: commanderPda, isSigner: false, isWritable: false },
      { pubkey: targetPda,    isSigner: false, isWritable: true  },
    ],
    data: Buffer.from([3]), // IX_DEREGISTER
  });
  const { blockhash } = await conn.getLatestBlockhash('finalized');
  const tx = new Transaction({ recentBlockhash: blockhash, feePayer: commander });
  tx.add(ix);
  return tx;
}

export const GENESIS = '22kQ9csvmpgtaUxR92dsFRtQ6zDEMuT8wwngtBQs21Q2';

export async function buildBootstrapTx(authority: PublicKey): Promise<Transaction> {
  const conn = getConnection();
  const [pda] = await findOverseerPDA(authority);
  const ix = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: authority, isSigner: true,  isWritable: true  },
      { pubkey: pda,       isSigner: false, isWritable: true  },
    ],
    data: Buffer.from([4]), // IX_BOOTSTRAP
  });
  const { blockhash } = await conn.getLatestBlockhash('finalized');
  const tx = new Transaction({ recentBlockhash: blockhash, feePayer: authority });
  tx.add(ix);
  return tx;
}
