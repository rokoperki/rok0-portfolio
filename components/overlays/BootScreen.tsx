'use client';

import { useEffect, useRef, useState } from 'react';
import { BOOT_LINES, BOOT_PROCEED_LINES } from '@/lib/constants';
import { useNerv } from '@/components/context/NervContext';

type GateState = 'hidden' | 'visible' | 'aborted';

function lineHtml(txt: string, cls: string): string {
  const parts = txt.split('\x01');
  const clsName = cls === 'ok' ? 'ok' : cls === 'warn' ? 'warn' : cls === 'hot' ? 'hot' : '';
  let html = `<span class="${clsName}">${parts[0]}</span>`;
  if (parts[1]) html += `<span class="ok">${parts[1]}</span>`;
  return html + '\n';
}

export function BootScreen() {
  const { onBootDone } = useNerv();
  const preRef   = useRef<HTMLPreElement>(null);
  const bootRef  = useRef<HTMLDivElement>(null);
  const [gateState, setGateState] = useState<GateState>('hidden');
  const gateActiveRef = useRef(false);

  // Run boot sequence on mount
  useEffect(() => {
    const pre = preRef.current;
    if (!pre) return;
    const preEl = pre; // captured non-null
    preEl.innerHTML = '';
    let i = 0;

    function nextLine() {
      if (i >= BOOT_LINES.length) { setTimeout(showGate, 410); return; }
      const [txt, cls] = BOOT_LINES[i];
      preEl.innerHTML += lineHtml(txt, cls);
      bootRef.current && (bootRef.current.scrollTop = bootRef.current.scrollHeight);
      i++;
      let d = 66 + Math.random() * 60;
      if (txt === '') d = 187;
      if (txt.includes('POST COMPLETE')) d = 102;
      if (txt.includes('recalibrating') || txt.includes('diagnostic')) d = 272;
      setTimeout(nextLine, d);
    }

    function showGate() {
      preEl.innerHTML += `<span class="hot">&gt; <span class="cur">█</span></span>\n`;
      bootRef.current && (bootRef.current.scrollTop = bootRef.current.scrollHeight);
      gateActiveRef.current = true;
      setGateState('visible');
    }

    nextLine();
  }, []);

  // Keyboard handler for gate
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!gateActiveRef.current) return;
      if (e.key === 'Enter') { e.preventDefault(); proceed(); }
      else if (e.key === 'Escape') { e.preventDefault(); abort(); }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  function proceed() {
    if (!gateActiveRef.current) return;
    gateActiveRef.current = false;
    setGateState('hidden');
    const pre = preRef.current;
    if (!pre) return;
    const preEl = pre;
    let j = 0;
    function next() {
      if (j >= BOOT_PROCEED_LINES.length) { setTimeout(finish, 410); return; }
      const [t, c] = BOOT_PROCEED_LINES[j];
      preEl.innerHTML += lineHtml(t, c);
      bootRef.current && (bootRef.current.scrollTop = bootRef.current.scrollHeight);
      j++;
      setTimeout(next, t.includes('SYSTEM ONLINE') ? 221 : 128);
    }
    next();
  }

  function abort() {
    setGateState('aborted');
    const pre = preRef.current;
    if (!pre) return;
    pre.innerHTML += `<span class="warn">! STARTUP ABORTED — standby</span>\n<span class="hot">&gt; <span class="cur">█</span></span>\n`;
  }

  function reAuth() {
    gateActiveRef.current = true;
    setGateState('visible');
  }

  function finish() {
    const el = bootRef.current;
    if (el) el.classList.add('faded');
    document.body.classList.add('online');
    const pwrEls = document.querySelectorAll('.pwr');
    pwrEls.forEach((el, idx) => setTimeout(() => el.classList.add('on'), idx * 110));
    setTimeout(() => {
      if (bootRef.current) bootRef.current.style.display = 'none';
      onBootDone();
    }, 620);
  }

  return (
    <div id="boot" ref={bootRef}>
      <pre id="bootpre" ref={preRef} />
      {gateState !== 'hidden' && (
        <div id="boot-gate" className={`show${gateState === 'aborted' ? ' aborted' : ''}`}>
          <div className="gh">
            <svg className="hexmark" viewBox="0 0 18 20">
              <polygon points="9,1 17,5.5 17,14.5 9,19 1,14.5 1,5.5" fill="none" stroke="#ffae3b" strokeWidth="1.4" />
              <polygon points="9,6 13,8 13,12 9,14 5,12 5,8" fill="#ffae3b" opacity="0.25" />
            </svg>
            {gateState === 'aborted' ? (
              <><span className="t">STARTUP ABORTED · STANDBY</span><span className="jp">中止 待機</span></>
            ) : (
              <><span className="t">SYSTEM HALT · AUTH REQUIRED</span><span className="jp">警告 確認</span></>
            )}
          </div>
          <div className="gb">
            {gateState === 'aborted' ? (
              <>
                <p style={{ color: 'var(--amber)' }}>Authorization withheld. Link not established — holding in standby.</p>
                <div className="gactions" style={{ marginTop: '14px' }}>
                  <button className="b-go" onClick={reAuth}>RE-AUTHORIZE</button>
                </div>
                <div className="ghint"><b>ENTER</b> to retry</div>
              </>
            ) : (
              <>
                <p>POST complete. All subsystems nominal.</p>
                <p>Establishing the monitoring link spins up live processes and hands operator control to you.</p>
                <div className="meta">LINK 0x0000 · CLEARANCE <b>OVERSEER</b> · SESSIONS <b>0</b></div>
                <div className="gactions">
                  <button className="b-go" id="gate-go" onClick={proceed} autoFocus>AUTHORIZE STARTUP</button>
                  <button className="b-no" id="gate-no" onClick={abort}>ABORT — HOLD STANDBY</button>
                </div>
                <div className="ghint">CONFIRM — <b>ENTER</b> proceed · <b>ESC</b> abort</div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
