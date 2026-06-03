"use client";

import { useState, useEffect, useRef } from "react";
import { PublicKey } from "@solana/web3.js";
import type { Config } from "@/lib/types";
import type { OverseerRecord } from "@/lib/solana/types";
import {
  CLEARANCE_LABELS,
  CLEARANCE_CSS,
  relativeTime,
} from "@/lib/solana/types";
import {
  fetchOverseerRecord,
  fetchRoster,
  findOverseerPDA,
  buildRegisterTx,
  buildHeartbeatTx,
  buildUpdateMessageTx,
  buildDeregisterSelfTx,
  buildDeregisterCommanderTx,
  buildPromoteTx,
  sendAndConfirm,
} from "@/lib/solana/guestlist";
import { useNerv } from "@/components/context/NervContext";
import { Sound } from "@/lib/sound";

interface Props {
  config: Config;
  isActive: boolean;
}

const CHARS_DECRYPT = "0123456789ABCDEF░▒▓█";
const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

function rosterLine(r: OverseerRecord): string {
  return [
    r.codename || "???",
    CLEARANCE_LABELS[r.clearance],
    `visits ${r.visits + 1}`,
    relativeTime(r.lastSeen),
  ].join("  //  ");
}

function scrambleLine(s: string): string {
  return s
    .split("")
    .map((c) => {
      if (c === " " || c === "/") return c;
      return B58[Math.floor(Math.random() * B58.length)];
    })
    .join("");
}

function decryptAnimate(el: HTMLElement, target: string) {
  let f = 0;
  const frames = 24;
  const id = setInterval(() => {
    f++;
    const res = Math.floor((target.length * f) / frames);
    let out = "";
    for (let i = 0; i < target.length; i++) {
      out +=
        i < res || (target[i] === " " && Math.random() < 0.5)
          ? target[i]
          : CHARS_DECRYPT[Math.floor(Math.random() * CHARS_DECRYPT.length)];
    }
    el.textContent = out;
    if (f >= frames) {
      clearInterval(id);
      el.textContent = target;
    }
  }, 40);
}

type PubkeyLike = { toString: () => string; toBytes: () => Uint8Array };

type WalletProvider = {
  isSolflare?: boolean;
  isPhantom?: boolean;
  publicKey?: PubkeyLike | null;
  connect: () => Promise<{ publicKey?: PubkeyLike } | void | undefined>;
  signTransaction: (tx: unknown) => Promise<{ serialize: () => Uint8Array }>;
  // Solflare supports signAndSendTransaction — bypasses its own preflight simulation
  signAndSendTransaction?: (tx: unknown, opts?: { skipPreflight?: boolean }) => Promise<{ signature: string }>;
  disconnect?: () => Promise<void>;
};

function getProvider(): WalletProvider | null {
  const w = window as unknown as {
    solflare?: WalletProvider;
    solana?: WalletProvider;
    phantom?: { solana?: WalletProvider };
  };
  return w.solflare ?? w.solana ?? w.phantom?.solana ?? null;
}

async function connectAndGetPk(provider: WalletProvider): Promise<string> {
  const resp = await provider.connect();
  // Solflare stores publicKey on provider after connect; others return it in the response
  const pk = resp?.publicKey ?? provider.publicKey;
  if (!pk) throw new Error("wallet connected but publicKey unavailable");
  return pk.toString();
}

export function ContactView({ config, isActive }: Props) {
  const {
    emitJmp,
    flashStatus,
    triggerTribunal,
    setAuthed: ctxSetAuthed,
    triggerAtField,
  } = useNerv();

  // Channels state
  const [pktVal, setPktVal] = useState(0);
  const [latVal, setLatVal] = useState(24);
  const [sigBars, setSigBars] = useState([[3], [3], [3], [3]]);

  // Wallet / guestlist state
  const [walletPk, setWalletPk] = useState<string | null>(null);
  const [ownRecord, setOwnRecord] = useState<OverseerRecord | null>(null);
  const [roster, setRoster] = useState<OverseerRecord[]>([]);
  const [rosterLoaded, setRosterLoaded] = useState(false);

  // Register form
  const [showForm, setShowForm] = useState(false);
  const [editingMsg, setEditingMsg] = useState(false);
  const [editMsgInput, setEditMsgInput] = useState('');

  // Roster decrypt state
  const [hoveredRoster, setHoveredRoster] = useState<number | null>(null);
  const [decryptedRows, setDecryptedRows] = useState<boolean[]>([]);
  const [rosterTexts, setRosterTexts] = useState<string[]>([]);
  const animatingRef = useRef(new Set<number>());
  const [codenameInput, setCodenameInput] = useState("");
  const [messageInput, setMessageInput] = useState("");

  // TX status
  const [txStatus, setTxStatus] = useState<
    "idle" | "pending" | "finalized" | "err"
  >("idle");
  const [txMsg, setTxMsg] = useState("");


  // Classified
  const [classifiedOpen, setClassifiedOpen] = useState(false);
  const clLineRef = useRef<HTMLSpanElement>(null);
  const clNoteRef = useRef<HTMLSpanElement>(null);
  const clResumeRef = useRef<HTMLAnchorElement>(null);

  // Transmit
  const txMsgRef = useRef<HTMLTextAreaElement>(null);
  const txStatRef = useRef<HTMLSpanElement>(null);

  const c = config.contact;

  // Live uplink animation
  const chans = [
    {
      k: "EMAIL",
      v: c.email,
      href: `mailto:${c.email}`,
      sec: "OPEN",
      port: "0x19",
    },
    {
      k: "GITHUB",
      v: c.github.replace(/^https?:\/\//, ""),
      href: c.github,
      sec: "SECURE",
      port: "0x1BB",
    },
    {
      k: "X",
      v: c.x.replace(/^https?:\/\//, ""),
      href: c.x,
      sec: "SECURE",
      port: "0x1BB",
    },
    { k: "DISCORD", v: c.discord, href: null, sec: "OPEN", port: "0x0D" },
  ] as const;

  useEffect(() => {
    const id = setInterval(() => {
      setSigBars(chans.map(() => [3 + Math.floor(Math.random() * 3)]));
      setLatVal(18 + Math.floor(Math.random() * 22));
      setPktVal((v) => v + 1 + Math.floor(Math.random() * 40));
    }, 900);
    return () => clearInterval(id);
  }, []);

  // Fetch roster when view opens
  useEffect(() => {
    if (!isActive || rosterLoaded) return;
    fetchRoster()
      .then((r) => {
        setRoster(r);
        setRosterLoaded(true);
      })
      .catch(() => setRosterLoaded(true));
  }, [isActive, rosterLoaded]);

  // Initialise encrypted display texts when roster first loads
  useEffect(() => {
    if (roster.length === 0) return;
    setDecryptedRows(new Array(roster.length).fill(false));
    setRosterTexts(roster.map((r) => scrambleLine(rosterLine(r))));
  }, [roster.length]); // eslint-disable-line react-hooks/exhaustive-deps

  function startDecrypt(idx: number) {
    if (animatingRef.current.has(idx) || decryptedRows[idx]) return;
    animatingRef.current.add(idx);
    const target = rosterLine(roster[idx]);
    const STEPS = 22;
    let step = 0;
    const id = setInterval(() => {
      step++;
      const resolved = Math.floor((target.length * step) / STEPS);
      let out = "";
      for (let i = 0; i < target.length; i++) {
        if (target[i] === " " || target[i] === "/") {
          out += target[i];
          continue;
        }
        out +=
          i < resolved
            ? target[i]
            : B58[Math.floor(Math.random() * B58.length)];
      }
      setRosterTexts((prev) => prev.map((t, i) => (i === idx ? out : t)));
      if (step >= STEPS) {
        clearInterval(id);
        animatingRef.current.delete(idx);
        setDecryptedRows((prev) => prev.map((d, i) => (i === idx ? true : d)));
        setRosterTexts((prev) => prev.map((t, i) => (i === idx ? target : t)));
      }
    }, 42);
  }

  // ── Classified unlock ────────────────────────────────────────────────────────
  function unlockClassified() {
    const cf = config.classified;
    setClassifiedOpen(true);
    setTimeout(() => {
      if (clLineRef.current) decryptAnimate(clLineRef.current, cf.directLine);
      if (clNoteRef.current) decryptAnimate(clNoteRef.current, cf.note);
      if (clResumeRef.current) {
        clResumeRef.current.href = cf.resumeUrl;
        clResumeRef.current.setAttribute("download", "");
        clResumeRef.current.textContent = cf.resumeName + " ▸";
      }
    }, 50);
    emitJmp("CALL declassify   ; OVERSEER CLEARANCE GRANTED");
    flashStatus("DECLASSIFIED", false);
  }

  // ── Heartbeat ────────────────────────────────────────────────────────────────
  async function doHeartbeat(
    provider: WalletProvider,
    authority: PublicKey,
    record: OverseerRecord,
  ) {
    const [pda] = await findOverseerPDA(authority);
    const tx = await buildHeartbeatTx(authority, pda);
    const signed = (await provider.signTransaction(tx)) as {
      serialize: () => Uint8Array;
    };
    await sendAndConfirm(signed.serialize());
    // refresh own record
    const updated = await fetchOverseerRecord(authority);
    if (updated) {
      setOwnRecord(updated);
      setRoster((prev) => {
        const idx = prev.findIndex((r) => r.authority === updated.authority);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = updated;
          return next;
        }
        return prev;
      });
    }
    emitJmp("CALL heartbeat   ; VISIT " + (record.visits + 1));
    flashStatus("HEARTBEAT", false);
  }

  // ── Register ─────────────────────────────────────────────────────────────────
  async function submitRegister() {
    if (!codenameInput.trim() || !walletPk) return;
    const provider = getProvider();
    if (!provider) return;
    const authority = new PublicKey(walletPk);
    setTxStatus("pending");
    setTxMsg("building transaction…");
    try {
      const { tx, debugHex } = await buildRegisterTx(
        authority,
        codenameInput.trim(),
        messageInput.trim(),
      );

      // Run OUR simulation first — does this also return 0xC?
      const { getConnection } = await import("@/lib/solana/guestlist");
      const sim = await getConnection().simulateTransaction(tx, undefined, true);
      const simLogs = sim.value.logs?.join(' | ') ?? 'no logs';
      const simErr  = sim.value.err ? JSON.stringify(sim.value.err) : 'OK';
      setTxMsg(`disc:${debugHex.slice(0, 2)} sim:${simErr} | ${simLogs.slice(0, 80)}`);
      // Pause so you can read the message
      await new Promise(r => setTimeout(r, 3000));

      if (sim.value.err) {
        throw new Error(`sim failed: ${simErr} | ${simLogs}`);
      }

      setTxMsg("sign in Solflare…");
      const signed = (await provider.signTransaction(tx)) as { serialize: () => Uint8Array };
      setTxMsg("waiting for finalized confirmation…");
      const sig = await sendAndConfirm(signed.serialize());
      setTxStatus("finalized");
      setTxMsg("✓ registered · " + sig.slice(0, 8) + "…");
      setShowForm(false);
      emitJmp("CALL register   ; OVERSEER " + codenameInput.toUpperCase());
      flashStatus("ENROLLED", false);
      Sound.confirm();
      const record = await fetchOverseerRecord(authority);
      if (record) {
        setOwnRecord(record);
        setRoster((prev) => [record, ...prev]);
      }
      unlockClassified();
      ctxSetAuthed(true);
    } catch (e: unknown) {
      console.error("[register]", e);
      const msg = e instanceof Error ? e.message : String(e);
      setTxStatus("err");
      setTxMsg("✕ " + msg);
      flashStatus("TX FAILED", true);
      Sound.deny();
    }
  }

  // ── Deregister ────────────────────────────────────────────────────────────────
  async function submitDeregister(rosterIdx: number) {
    const r = roster[rosterIdx];
    const provider = getProvider();
    if (!provider || !walletPk) return;
    const isSelf = r.authority === walletPk;
    const isCommander = ownRecord?.clearance === 2;
    if (!isSelf && !isCommander) return;

    triggerTribunal(
      `DEREGISTER ${r.codename.toUpperCase() || r.authority.slice(0, 8)}`,
      async (ok) => {
        if (!ok) return;
        const authority = new PublicKey(walletPk);
        setTxStatus('pending');
        setTxMsg('building deregister transaction…');
        try {
          let tx;
          if (isSelf) {
            tx = await buildDeregisterSelfTx(authority);
          } else {
            tx = await buildDeregisterCommanderTx(
              authority,
              new PublicKey(ownRecord!.pubkey),
              new PublicKey(r.pubkey),
            );
          }
          setTxMsg('sign in Solflare…');
          const signed = (await provider.signTransaction(tx)) as { serialize: () => Uint8Array };
          setTxMsg('waiting for finalized confirmation…');
          const sig = await sendAndConfirm(signed.serialize());
          setTxStatus('finalized');
          setTxMsg('✓ deregistered · ' + sig.slice(0, 8) + '…');
          setRoster(prev => prev.filter((_, i) => i !== rosterIdx));
          if (isSelf) { setOwnRecord(null); setClassifiedOpen(false); ctxSetAuthed(false); }
          emitJmp('CALL deregister   ; ' + (r.codename || r.authority.slice(0, 8)).toUpperCase());
          flashStatus('DEREGISTERED', false);
          Sound.confirm();
        } catch (e: unknown) {
          console.error('[deregister]', e);
          setTxStatus('err');
          setTxMsg('✕ ' + (e instanceof Error ? e.message : 'deregister failed'));
          flashStatus('DEREG FAILED', true);
          Sound.deny();
        }
      },
      false,
    );
  }

  // ── Promote (commander → operative becomes overseer) ─────────────────────────
  async function submitPromote(rosterIdx: number) {
    const r = roster[rosterIdx];
    const provider = getProvider();
    if (!provider || !walletPk || ownRecord?.clearance !== 2) return;
    if (r.clearance !== 0) return; // only OPERATIVE can be promoted

    triggerTribunal(
      `PROMOTE ${r.codename.toUpperCase() || r.authority.slice(0, 8)} → OVERSEER`,
      async (ok) => {
        if (!ok) return;
        const commander = new PublicKey(walletPk);
        setTxStatus('pending');
        setTxMsg('building promote transaction…');
        try {
          const tx = await buildPromoteTx(
            commander,
            new PublicKey(ownRecord!.pubkey),
            new PublicKey(r.pubkey),
            new PublicKey(r.authority),
          );
          setTxMsg('sign in Solflare…');
          const signed = (await provider.signTransaction(tx)) as { serialize: () => Uint8Array };
          setTxMsg('waiting for finalized confirmation…');
          const sig = await sendAndConfirm(signed.serialize());
          setTxStatus('finalized');
          setTxMsg('✓ promoted · ' + sig.slice(0, 8) + '…');
          // Update clearance in roster
          setRoster(prev => prev.map((rec, i) =>
            i === rosterIdx ? { ...rec, clearance: 1 as const } : rec,
          ));
          // Update decrypted text for this row
          const updated = { ...r, clearance: 1 as const };
          setRosterTexts(prev => prev.map((t, i) => i === rosterIdx ? rosterLine(updated) : t));
          emitJmp(`CALL promote   ; ${r.codename.toUpperCase()} → OVERSEER`);
          flashStatus('PROMOTED', false);
          Sound.confirm();
        } catch (e: unknown) {
          console.error('[promote]', e);
          setTxStatus('err');
          setTxMsg('✕ ' + (e instanceof Error ? e.message : 'promote failed'));
          flashStatus('PROMOTE FAILED', true);
          Sound.deny();
        }
      },
      false,
    );
  }

  // ── Update message ───────────────────────────────────────────────────────────
  async function submitUpdateMessage() {
    if (!walletPk || !editMsgInput.trim()) return;
    const provider = getProvider();
    if (!provider) return;
    const authority = new PublicKey(walletPk);
    setTxStatus('pending');
    setTxMsg('building update transaction…');
    try {
      const tx = await buildUpdateMessageTx(authority, editMsgInput.trim());
      setTxMsg('sign in Solflare…');
      const signed = (await provider.signTransaction(tx)) as { serialize: () => Uint8Array };
      setTxMsg('waiting for finalized confirmation…');
      const sig = await sendAndConfirm(signed.serialize());
      setTxStatus('finalized');
      setTxMsg('✓ message updated · ' + sig.slice(0, 8) + '…');
      const newMsg = editMsgInput.trim();
      setOwnRecord(prev => prev ? { ...prev, message: newMsg } : prev);
      setRoster(prev => prev.map(r =>
        r.authority === walletPk ? { ...r, message: newMsg } : r,
      ));
      setEditingMsg(false);
      setEditMsgInput('');
      emitJmp('CALL update_msg   ; MESSAGE UPDATED');
      flashStatus('MSG UPDATED', false);
      Sound.confirm();
    } catch (e: unknown) {
      console.error('[update_msg]', e);
      setTxStatus('err');
      setTxMsg('✕ ' + (e instanceof Error ? e.message : 'update failed'));
      flashStatus('UPDATE FAILED', true);
      Sound.deny();
    }
  }

  // ── Disconnect ────────────────────────────────────────────────────────────────
  async function disconnectWallet() {
    const provider = getProvider();
    try { await provider?.disconnect?.(); } catch {}
    setWalletPk(null);
    setOwnRecord(null);
    setClassifiedOpen(false);
    setShowForm(false);
    setTxStatus('idle');
    setTxMsg('');
    ctxSetAuthed(false);
    emitJmp('CALL disconnect   ; SESSION TERMINATED');
    flashStatus('DISCONNECTED', false);
  }

  // ── Main wallet connect ───────────────────────────────────────────────────────
  async function connectWallet() {
    Sound.nav();
    triggerTribunal(
      "OVERSEER CREDENTIAL",
      async (ok) => {
        if (!ok) return;
        const provider = getProvider();
        if (!provider) {
          flashStatus("NO WALLET", true);
          triggerAtField();
          Sound.deny();
          setTxStatus("err");
          setTxMsg("✕ Solflare not detected — install solflare.com");
          return;
        }
        try {
          setTxMsg("connecting…");
          const pk = await connectAndGetPk(provider);
          setWalletPk(pk);
          const authority = new PublicKey(pk);
          setTxMsg("checking registry…");
          const record = await fetchOverseerRecord(authority);
          if (record) {
            setOwnRecord(record);
            setTxMsg("already enrolled — sending heartbeat…");
            await doHeartbeat(provider, authority, record);
            unlockClassified();
            ctxSetAuthed(true);
            // Show bootstrap button only for genesis wallet that hasn't been elevated yet
          } else {
            setTxMsg("");
            setCodenameInput(pk.slice(0, 6).toUpperCase());
            setShowForm(true);
            flashStatus("REGISTER", false);
          }
        } catch (e: unknown) {
          console.error("[connect/heartbeat]", e);
          setTxStatus("err");
          setTxMsg("✕ " + (e instanceof Error ? e.message : String(e)));
          flashStatus("AUTH DENIED", true);
          triggerAtField();
          Sound.deny();
        }
      },
      true,
    );
  }

  // ── Transmit form ────────────────────────────────────────────────────────────
  function transmit() {
    const msg = (txMsgRef.current?.value || "").trim();
    const st = txStatRef.current;
    if (st) {
      st.textContent = "● TRANSMITTING…";
      st.className = "t tx-busy";
    }
    flashStatus("TRANSMIT", true);
    const subj = encodeURIComponent(
      `UPLINK // transmission from ${config.handle}`,
    );
    const body = encodeURIComponent(msg || "// open channel");
    setTimeout(() => {
      window.location.href = `mailto:${c.email}?subject=${subj}&body=${body}`;
      if (st) {
        st.textContent = "● SENT";
        st.className = "t tx-ok";
      }
      setTimeout(() => {
        if (st) {
          st.textContent = "● IDLE";
          st.className = "t";
        }
      }, 2600);
    }, 520);
  }

  function copyDiscord() {
    if (navigator.clipboard)
      navigator.clipboard.writeText(c.discord).catch(() => {});
    flashStatus("COPIED", false);
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <section className={`view${isActive ? " active" : ""}`} id="v-contact">
      <div className="view-title">CHANNELS</div>
      <div className="view-sub">
        COMMS UPLINK <span className="jp">通信</span>
      </div>

      {/* Uplink bar */}
      <div className="uplink-bar">
        <span>
          <span className="dot live" />
          UPLINK <b>ESTABLISHED</b>
        </span>
        <span>
          ENCRYPTION <b>AES-256</b>
        </span>
        <span>
          LAT <b id="uplink-lat">{latVal}</b>ms
        </span>
        <span>
          PACKETS <b id="uplink-pkt">{pktVal.toLocaleString()}</b>
        </span>
      </div>

      {/* Channels */}
      <div className="channels" id="channels">
        {chans.map((ch, i) => {
          const lit = sigBars[i]?.[0] ?? 3;
          const bars = (
            <span className="sig">
              {[0, 1, 2, 3, 4].map((b) => (
                <i key={b} className={b < lit ? "on" : ""} />
              ))}
            </span>
          );
          const inner = (
            <>
              <span className="ck">{ch.k}</span>
              <span className="cv">{ch.v}</span>
              <span className="cport">PORT {ch.port}</span>
              {bars}
              <span
                className={`cstat ${ch.sec === "SECURE" ? "secure" : "open"}`}
              >
                {ch.sec}
              </span>
              <span className="cgo">{ch.href ? "CONNECT ▸" : "COPY ▸"}</span>
            </>
          );
          return ch.href ? (
            <a
              className="chan"
              href={ch.href}
              target="_blank"
              rel="noopener"
              key={ch.k}
            >
              {inner}
            </a>
          ) : (
            <div className="chan" key={ch.k} onClick={copyDiscord}>
              {inner}
            </div>
          );
        })}
      </div>

      {/* Transmit */}
      <div className="transmit">
        <div className="tx-top">
          <span className="l">
            Transmit · Open Channel <span className="jp">送信</span>
          </span>
          <span className="t" id="tx-stat" ref={txStatRef}>
            ● IDLE
          </span>
        </div>
        <div className="tx-body">
          <label className="tx-prompt" htmlFor="tx-msg">
            &gt; COMPOSE TRANSMISSION
          </label>
          <textarea
            id="tx-msg"
            rows={3}
            spellCheck={false}
            placeholder="type your message…"
            ref={txMsgRef}
          />
          <div className="tx-actions">
            <button id="tx-send" onClick={transmit}>
              ▸ TRANSMIT
            </button>
            <span className="tx-hint">
              routes to <b id="tx-addr">{c.email}</b> via your mail client
            </span>
          </div>
        </div>
      </div>

      {/* Overseer Auth */}
      <div className="auth">
        <div className="ah">
          <span className="t">Overseer Authentication</span>
          <span className="jp">認証</span>
        </div>
        <p>
          Connect Solflare to register on the{" "}
          <a
            href="https://github.com/rokoperki/rok0-guestlist"
            target="_blank"
            rel="noopener"
            className="cl-dl"
          >
            rok0-guestlist
          </a>{" "}
          — a Solana program deployed on devnet, written in raw sBPF assembly.
          Your codename and a message are stored on-chain as a PDA derived from
          your wallet. Only rent required — no extra SOL. Curious about the
          code?{" "}
          <a
            href="https://github.com/rokoperki/rok0-guestlist"
            target="_blank"
            rel="noopener"
            className="cl-dl"
          >
            Read the source on GitHub ▸
          </a>
        </p>

        {!walletPk && (
          <button id="wallet-btn" onClick={connectWallet}>
            CONNECT SOLFLARE
          </button>
        )}

        {walletPk && !showForm && !ownRecord && (
          <button className="linked">
            CONNECTED {walletPk.slice(0, 4)}…{walletPk.slice(-4)}
          </button>
        )}

        {walletPk && (
          <button
            className="pbtn"
            style={{ marginTop: '10px', fontSize: '12px', padding: '6px 14px', borderColor: 'var(--dim)', color: 'var(--dim2)' }}
            onClick={disconnectWallet}
          >
            ▸ DISCONNECT
          </button>
        )}

        {/* TX status line */}
        {txMsg && (
          <div
            className={`out${txStatus === "finalized" ? " ok" : txStatus === "err" ? " err" : ""}`}
          >
            {txMsg}
          </div>
        )}

        {/* Register form */}
        {showForm && (
          <div className="register-form">
            <div className="rf-row">
              <label className="rf-label">CODENAME</label>
              <input
                className="rf-input"
                maxLength={16}
                placeholder="max 16 chars"
                value={codenameInput}
                onChange={(e) => setCodenameInput(e.target.value.toUpperCase())}
                spellCheck={false}
                autoFocus
              />
            </div>
            <div className="rf-row">
              <label className="rf-label">MESSAGE</label>
              <textarea
                className="rf-input"
                rows={2}
                maxLength={700}
                placeholder="optional, max 700 chars"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                spellCheck={false}
              />
            </div>
            <div className="rf-actions">
              <button
                className="pbtn src"
                onClick={submitRegister}
                disabled={txStatus === "pending" || !codenameInput.trim()}
              >
                {txStatus === "pending" ? "⟳ PENDING…" : "▸ REGISTER ON-CHAIN"}
              </button>
              <button className="pbtn" onClick={() => setShowForm(false)}>
                CANCEL
              </button>
            </div>
          </div>
        )}

        {/* Own record */}
        {ownRecord && (
          <div className="own-record">
            <div className="or-head">
              <span className="or-codename">{ownRecord.codename || "???"}</span>
              <span
                className={`st ${ownRecord.clearance === 2 ? "run" : ownRecord.clearance === 1 ? "sync" : "halt"}`}
              >
                {CLEARANCE_LABELS[ownRecord.clearance]}
              </span>
            </div>
            <div className="or-meta">
              <span>
                visits <b>{ownRecord.visits + 1}</b>
              </span>
              <span>enrolled {relativeTime(ownRecord.enrolledAt)}</span>
              <span>last seen {relativeTime(ownRecord.lastSeen)}</span>
            </div>
            {ownRecord.message && !editingMsg && (
              <div className="or-msg">"{ownRecord.message}"</div>
            )}
            {editingMsg ? (
              <div className="register-form" style={{ marginTop: '10px' }}>
                <div className="rf-row">
                  <label className="rf-label">NEW MESSAGE</label>
                  <textarea
                    className="rf-input"
                    rows={2}
                    maxLength={700}
                    value={editMsgInput}
                    onChange={e => setEditMsgInput(e.target.value)}
                    placeholder="max 700 chars"
                    spellCheck={false}
                    autoFocus
                  />
                </div>
                <div className="rf-actions">
                  <button
                    className="pbtn src"
                    onClick={submitUpdateMessage}
                    disabled={txStatus === 'pending' || !editMsgInput.trim()}
                  >
                    {txStatus === 'pending' ? '⟳ PENDING…' : '▸ UPDATE ON-CHAIN'}
                  </button>
                  <button className="pbtn" onClick={() => { setEditingMsg(false); setEditMsgInput(''); }}>
                    CANCEL
                  </button>
                </div>
              </div>
            ) : (
              <button
                className="backbtn"
                style={{ fontSize: '11px', padding: '3px 12px', marginTop: '8px', display: 'inline-block' }}
                onClick={() => { setEditingMsg(true); setEditMsgInput(ownRecord.message); }}
              >
                ▸ {ownRecord.message ? 'EDIT MESSAGE' : 'ADD MESSAGE'}
              </button>
            )}
          </div>
        )}

      </div>

      {/* Classified */}
      <div
        className={`classified ${classifiedOpen ? "unlocked" : "locked"}`}
        id="classified"
      >
        <div className="cl-head">
          <span className="t">OVERSEER · EYES ONLY</span>
          <span className="jp">機密</span>
          <span className="cl-stat" id="cl-stat">
            {classifiedOpen ? "● DECRYPTED" : "● LOCKED"}
          </span>
        </div>
        <div className="cl-body">
          <div className="cl-row">
            <span className="cl-k">DIRECT LINE</span>
            <span className="cl-v" id="cl-line" ref={clLineRef}>
              {classifiedOpen ? "" : "████████████████"}
            </span>
          </div>
          <div className="cl-row">
            <span className="cl-k">DOSSIER</span>
            <span className="cl-v">
              <a id="cl-resume" className="cl-dl" ref={clResumeRef}>
                {classifiedOpen ? "" : "████████████████"}
              </a>
            </span>
          </div>
          <div className="cl-row note">
            <span className="cl-k">NOTE</span>
            <span className="cl-v" id="cl-note" ref={clNoteRef}>
              {classifiedOpen
                ? ""
                : "█████████ ████ ████████ ██ ████ ████ ████████ ████ ███ █████ ████."}
            </span>
          </div>
          {!classifiedOpen && (
            <div className="cl-lockmsg" id="cl-lockmsg">
              // AUTHENTICATE VIA OVERSEER WALLET TO DECRYPT
            </div>
          )}
        </div>
      </div>

      {/* Roster */}
      <div className="roster">
        <div
          className="sec-head"
          style={{
            margin: "-0px 0 12px",
            background: "transparent",
            borderBottom: "1px solid var(--line)",
          }}
        >
          <h2>Overseer Roster</h2>
          <span className="jp">登録者</span>
        </div>

        {!rosterLoaded && (
          <div className="roster-loading">fetching registry…</div>
        )}

        {/* Rank legend */}
        <div className="roster-ranks">
          {[
            { color: 'var(--accent)',  label: 'OPERATIVE',  desc: 'newly enrolled — wallet verified on-chain' },
            { color: 'var(--amber)',   label: 'OVERSEER',   desc: 'elevated by commander' },
            { color: 'var(--cyan)',    label: 'COMMANDER',  desc: 'genesis authority — program deployer' },
          ].map(({ color, label, desc }) => (
            <div className="rr-item" key={label}>
              <span className="rr-dot" style={{ background: color, boxShadow: `0 0 5px ${color}` }} />
              <span className="rr-label" style={{ color }}>{label}</span>
              <span className="rr-desc">— {desc}</span>
            </div>
          ))}
        </div>

        {rosterLoaded && roster.length === 0 && (
          <div className="roster-empty">
            // NO OVERSEERS ENROLLED YET — BE THE FIRST
          </div>
        )}

        {rosterLoaded && roster.length > 0 && (
          <div className="rc-list">
            {roster.map((r, i) => {
              const isDecrypted = decryptedRows[i] ?? false;
              const isHovered = hoveredRoster === i;
              return (
                <div
                  key={r.pubkey}
                  className={`rc-entry${r.authority === walletPk ? " rc-self" : ""}${isDecrypted ? " rc-unlocked" : ""}`}
                  onMouseEnter={() => {
                    setHoveredRoster(i);
                    startDecrypt(i);
                  }}
                  onMouseLeave={() => setHoveredRoster(null)}
                >
                  <span className="rc-idx">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {/* Show full decoded view only after decrypt + hover */}
                  {isDecrypted && isHovered ? (
                    <div className="rc-decoded">
                      <div className="rc-head">
                        <span className="rc-codename">
                          {r.codename || "???"}
                        </span>
                        <span
                          className={`st ${r.clearance === 2 ? "run" : r.clearance === 1 ? "sync" : "halt"}`}
                        >
                          {CLEARANCE_LABELS[r.clearance]}
                        </span>
                        <span className="rc-visits">
                          visits <b>{r.visits + 1}</b>
                        </span>
                        <span className="rc-time">
                          {relativeTime(r.lastSeen)}
                        </span>
                      </div>
                      {r.message && (
                        <div className="rc-msg">
                          &ldquo;{r.message}&rdquo;
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                        {/* Promote — commander only, on OPERATIVE rows that aren't self */}
                        {walletPk && ownRecord?.clearance === 2 && r.clearance === 0 && r.authority !== walletPk && (
                          <button
                            className="backbtn"
                            style={{ fontSize: '11px', padding: '3px 12px', borderColor: 'var(--cyan)', color: 'var(--cyan)' }}
                            onClick={(e) => { e.stopPropagation(); submitPromote(i); }}
                          >
                            ▸ PROMOTE
                          </button>
                        )}
                        {/* Deregister — own record (non-commander) OR commander deregistering others */}
                        {walletPk && (
                          (r.authority === walletPk && (ownRecord?.clearance ?? 0) < 2) ||
                          (ownRecord?.clearance === 2 && r.authority !== walletPk)
                        ) && (
                          <button
                            className="backbtn"
                            style={{ fontSize: '11px', padding: '3px 12px' }}
                            onClick={(e) => { e.stopPropagation(); submitDeregister(i); }}
                          >
                            ▸ DEREGISTER
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Encrypted (scrambling) or decrypted single-line */
                    <div className={isDecrypted ? "rc-line" : "rc-raw"}>
                      {isDecrypted ? rosterLine(r) : (rosterTexts[i] ?? scrambleLine(rosterLine(r)))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
