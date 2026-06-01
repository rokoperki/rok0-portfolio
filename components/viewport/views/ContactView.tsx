'use client';

import { useEffect, useRef, useState } from 'react';
import type { Config } from '@/lib/types';
import { useNerv } from '@/components/context/NervContext';
import { Sound } from '@/lib/sound';

interface Props {
  config: Config;
  isActive: boolean;
}

const CHARS_DECRYPT = '0123456789ABCDEF░▒▓█';

function decryptAnimate(el: HTMLElement, target: string) {
  let f = 0;
  const frames = 24;
  const id = setInterval(() => {
    f++;
    const res = Math.floor(target.length * f / frames);
    let out = '';
    for (let i = 0; i < target.length; i++) {
      out += (i < res || (target[i] === ' ' && Math.random() < 0.5))
        ? target[i]
        : CHARS_DECRYPT[Math.floor(Math.random() * CHARS_DECRYPT.length)];
    }
    el.textContent = out;
    if (f >= frames) { clearInterval(id); el.textContent = target; }
  }, 40);
}

export function ContactView({ config, isActive }: Props) {
  const { emitJmp, flashStatus, triggerTribunal, setAuthed: ctxSetAuthed, triggerAtField } = useNerv();
  const [walletStatus, setWalletStatus] = useState<'idle' | 'ok' | 'err'>('idle');
  const [walletMsg, setWalletMsg]       = useState('');
  const [walletLinked, setWalletLinked] = useState(false);
  const [classifiedOpen, setClassifiedOpen] = useState(false);
  const [pktVal, setPktVal] = useState(0);
  const [latVal, setLatVal] = useState(24);
  const [sigBars, setSigBars] = useState([[3], [3], [3], [3], [3]]);
  const clLineRef  = useRef<HTMLSpanElement>(null);
  const clNoteRef  = useRef<HTMLSpanElement>(null);
  const clResumeRef = useRef<HTMLAnchorElement>(null);
  const txMsgRef   = useRef<HTMLTextAreaElement>(null);
  const txStatRef  = useRef<HTMLSpanElement>(null);
  const c = config.contact;

  // Live comms uplink updates
  useEffect(() => {
    const id = setInterval(() => {
      setSigBars(chans.map(() => [3 + Math.floor(Math.random() * 3)]));
      setLatVal(18 + Math.floor(Math.random() * 22));
      setPktVal((v) => v + 1 + Math.floor(Math.random() * 40));
    }, 900);
    return () => clearInterval(id);
  }, [sigBars]);

  function unlockClassified() {
    const cf = config.classified;
    setClassifiedOpen(true);
    setTimeout(() => {
      if (clLineRef.current)   decryptAnimate(clLineRef.current, cf.directLine);
      if (clNoteRef.current)   decryptAnimate(clNoteRef.current, cf.note);
      if (clResumeRef.current) {
        clResumeRef.current.href = cf.resumeUrl;
        clResumeRef.current.setAttribute('download', '');
        clResumeRef.current.textContent = cf.resumeName + ' ▸';
      }
    }, 50);
    emitJmp('CALL declassify   ; OVERSEER CLEARANCE GRANTED');
    flashStatus('DECLASSIFIED', false);
    const statEl = document.getElementById('cl-stat');
    if (statEl) statEl.textContent = '● DECRYPTED';
    const lockEl = document.getElementById('cl-lockmsg');
    if (lockEl) lockEl.style.display = 'none';
  }

  async function connectWallet() {
    Sound.nav();
    triggerTribunal('OVERSEER CREDENTIAL', async (ok) => {
      if (!ok) return;
      const provider = (window as unknown as { solana?: { isPhantom?: boolean; connect: () => Promise<{ publicKey: { toString: () => string } }> }; phantom?: { solana?: { isPhantom?: boolean; connect: () => Promise<{ publicKey: { toString: () => string } }> } } }).solana
        || (window as unknown as { phantom?: { solana?: { isPhantom?: boolean; connect: () => Promise<{ publicKey: { toString: () => string } }> } } }).phantom?.solana;
      if (!provider?.isPhantom) {
        setWalletStatus('err');
        setWalletMsg('✕ NO INJECTED WALLET DETECTED — install Phantom to authenticate.');
        flashStatus('AUTH FAILED', true);
        triggerAtField();
        Sound.deny();
        return;
      }
      try {
        setWalletMsg('… requesting handshake');
        const resp = await provider.connect();
        const pk = resp.publicKey.toString();
        const trunc = pk.slice(0, 4) + '…' + pk.slice(-4);
        setWalletStatus('ok');
        setWalletMsg('✓ OVERSEER VERIFIED — welcome, ' + trunc);
        setWalletLinked(true);
        emitJmp('CALL auth   ; OVERSEER ' + trunc);
        flashStatus('AUTHENTICATED', false);
        Sound.confirm();
        unlockClassified();
        ctxSetAuthed(true);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'connection denied';
        setWalletStatus('err');
        setWalletMsg('✕ HANDSHAKE REJECTED — ' + msg);
        flashStatus('AUTH DENIED', true);
        triggerAtField();
        Sound.deny();
      }
    }, true);
  }

  function transmit() {
    const msg = (txMsgRef.current?.value || '').trim();
    const st = txStatRef.current;
    if (st) { st.textContent = '● TRANSMITTING…'; st.className = 't tx-busy'; }
    flashStatus('TRANSMIT', true);
    const subj = encodeURIComponent(`UPLINK // transmission from ${config.handle}`);
    const body = encodeURIComponent(msg || '// open channel');
    setTimeout(() => {
      window.location.href = `mailto:${c.email}?subject=${subj}&body=${body}`;
      if (st) { st.textContent = '● SENT'; st.className = 't tx-ok'; }
      setTimeout(() => { if (st) { st.textContent = '● IDLE'; st.className = 't'; } }, 2600);
    }, 520);
  }

  function copyDiscord() {
    if (navigator.clipboard) navigator.clipboard.writeText(c.discord).catch(() => {});
    flashStatus('COPIED', false);
  }

  const chans = [
    { k: 'EMAIL',     v: c.email,                              href: `mailto:${c.email}`,            sec: 'OPEN',   port: '0x19'  },
    { k: 'GITHUB',    v: c.github.replace(/^https?:\/\//, ''), href: c.github,                       sec: 'SECURE', port: '0x1BB' },
    { k: 'TELEGRAM',  v: '@' + c.telegram,                     href: `https://t.me/${c.telegram}`,   sec: 'SECURE', port: '0x3F' },
    { k: 'X',         v: c.x.replace(/^https?:\/\//, ''),      href: c.x,                            sec: 'SECURE', port: '0x1BB' },
    { k: 'DISCORD',   v: c.discord,                             href: null,                           sec: 'OPEN',   port: '0x0D'  },
  ] as const;

  return (
    <section className={`view${isActive ? ' active' : ''}`} id="v-contact">
      <div className="view-title">CHANNELS</div>
      <div className="view-sub">COMMS UPLINK <span className="jp">通信</span></div>

      <div className="uplink-bar">
        <span><span className="dot live" />UPLINK <b>ESTABLISHED</b></span>
        <span>ENCRYPTION <b>AES-256</b></span>
        <span>LAT <b id="uplink-lat">{latVal}</b>ms</span>
        <span>PACKETS <b id="uplink-pkt">{pktVal.toLocaleString()}</b></span>
      </div>

      <div className="channels" id="channels">
        {chans.map((ch, i) => {
          const lit = sigBars[i]?.[0] ?? 3;
          const bars = (
            <span className="sig">
              {[0, 1, 2, 3, 4].map((b) => <i key={b} className={b < lit ? 'on' : ''} />)}
            </span>
          );
          const inner = (
            <>
              <span className="ck">{ch.k}</span>
              <span className="cv">{ch.v}</span>
              <span className="cport">PORT {ch.port}</span>
              {bars}
              <span className={`cstat ${ch.sec === 'SECURE' ? 'secure' : 'open'}`}>{ch.sec}</span>
              <span className="cgo">{ch.href ? 'CONNECT ▸' : 'COPY ▸'}</span>
            </>
          );
          return ch.href
            ? <a className="chan" href={ch.href} target="_blank" rel="noopener" key={ch.k}>{inner}</a>
            : <div className="chan" key={ch.k} onClick={copyDiscord}>{inner}</div>;
        })}
      </div>

      <div className="transmit">
        <div className="tx-top">
          <span className="l">Transmit · Open Channel <span className="jp">送信</span></span>
          <span className="t" id="tx-stat" ref={txStatRef}>● IDLE</span>
        </div>
        <div className="tx-body">
          <label className="tx-prompt" htmlFor="tx-msg">&gt; COMPOSE TRANSMISSION</label>
          <textarea id="tx-msg" rows={3} spellCheck={false} placeholder="type your message…" ref={txMsgRef} />
          <div className="tx-actions">
            <button id="tx-send" onClick={transmit}>▸ TRANSMIT</button>
            <span className="tx-hint">routes to <b id="tx-addr">{c.email}</b> via your mail client</span>
          </div>
        </div>
      </div>

      <div className="auth">
        <div className="ah">
          <span className="t">Overseer Authentication</span>
          <span className="jp">認証</span>
        </div>
        <p>Optional. Connect an injected Solana wallet (Phantom) to verify overseer credentials. No transaction is requested — read-only handshake.</p>
        <button id="wallet-btn" className={walletLinked ? 'linked' : ''} onClick={connectWallet}>
          {walletLinked ? 'AUTHENTICATED ✓' : 'CONNECT WALLET'}
        </button>
        <div className={`out${walletStatus === 'ok' ? ' ok' : walletStatus === 'err' ? ' err' : ''}`} id="wallet-out">
          {walletMsg}
        </div>
      </div>

      <div className={`classified ${classifiedOpen ? 'unlocked' : 'locked'}`} id="classified">
        <div className="cl-head">
          <span className="t">OVERSEER · EYES ONLY</span>
          <span className="jp">機密</span>
          <span className="cl-stat" id="cl-stat">{classifiedOpen ? '● DECRYPTED' : '● LOCKED'}</span>
        </div>
        <div className="cl-body">
          <div className="cl-row">
            <span className="cl-k">DIRECT LINE</span>
            <span className="cl-v" id="cl-line" ref={clLineRef}>
              {classifiedOpen ? '' : '████████████████'}
            </span>
          </div>
          <div className="cl-row">
            <span className="cl-k">DOSSIER</span>
            <span className="cl-v">
              <a id="cl-resume" className="cl-dl" ref={clResumeRef}>
                {classifiedOpen ? '' : '████████████████'}
              </a>
            </span>
          </div>
          <div className="cl-row note">
            <span className="cl-k">NOTE</span>
            <span className="cl-v" id="cl-note" ref={clNoteRef}>
              {classifiedOpen ? '' : '█████████ ████ ████████ ██ ████ ████ ████████ ████ ███ █████ ████.'}
            </span>
          </div>
          {!classifiedOpen && (
            <div className="cl-lockmsg" id="cl-lockmsg">// AUTHENTICATE VIA OVERSEER WALLET TO DECRYPT THIS RECORD</div>
          )}
        </div>
      </div>
    </section>
  );
}
