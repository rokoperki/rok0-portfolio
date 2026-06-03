'use client';

import { useEffect, useRef, useState, useImperativeHandle, useCallback, type Ref } from 'react';
import type { TopBarHandle } from '@/lib/types';
import { useNerv } from '@/components/context/NervContext';
import { Sound } from '@/lib/sound';

export function TopBar({ handle }: { handle?: Ref<TopBarHandle> }) {
  const { soundOn, setSoundOn } = useNerv();
  const clockRef  = useRef<HTMLDivElement>(null);
  const syncRef   = useRef<HTMLDivElement>(null);
  const statusEl  = useRef<HTMLDivElement>(null);
  const statusTxt = useRef<HTMLSpanElement>(null);
  const dotEl     = useRef<HTMLSpanElement>(null);
  const statusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const syncBoostTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const syncValRef = useRef(99.97);

  // Clock tick
  useEffect(() => {
    function tick() {
      const d = new Date();
      const p = (n: number) => String(n).padStart(2, '0');
      if (clockRef.current) {
        clockRef.current.textContent = `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
      }
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Initialise sound preference
  useEffect(() => {
    const pref = Sound.loadPreference();
    setSoundOn(pref);
    Sound.on = pref;
    if (pref) {
      const resume = () => { Sound.enable(true); };
      window.addEventListener('pointerdown', resume, { once: true });
      window.addEventListener('keydown', resume, { once: true });
    }
  }, [setSoundOn]);

  function toggleSound() {
    Sound.enable(!Sound.on);
    setSoundOn(Sound.on);
  }

  const flashStatus = useCallback((text: string, warn: boolean) => {
    if (statusTimer.current) clearTimeout(statusTimer.current);
    const el = statusEl.current;
    const t  = statusTxt.current;
    const d  = dotEl.current;
    if (!el || !t || !d) return;
    el.classList.remove('ok', 'warn');
    if (warn) { el.classList.add('warn'); d.className = 'dot hot'; }
    else { d.className = 'dot live'; }
    t.textContent = text;
    statusTimer.current = setTimeout(() => {
      el.classList.remove('warn');
      if (d) d.className = 'dot live';
      if (t) t.textContent = 'NOMINAL';
    }, warn ? 2600 : 1600);
  }, []);

  const boostSync = useCallback(() => {
    flashStatus('SYNC RISING', false);
    const el = syncRef.current;
    if (el) { el.style.color = 'var(--cyan)'; el.style.textShadow = '0 0 12px rgba(51,231,210,.6)'; }
    if (syncBoostTimer.current) clearInterval(syncBoostTimer.current);
    let step = 0;
    syncBoostTimer.current = setInterval(() => {
      step++;
      syncValRef.current += (99.999 - syncValRef.current) * 0.4 + Math.random() * 0.02;
      if (syncValRef.current > 99.999) syncValRef.current = 99.999;
      if (syncRef.current) syncRef.current.textContent = 'SYNC ' + syncValRef.current.toFixed(2) + '%';
      if (step >= 14) {
        clearInterval(syncBoostTimer.current!);
        if (syncRef.current) syncRef.current.textContent = 'SYNC 100.00%';
        flashStatus('SYNCHRONIZED', false);
        setTimeout(() => {
          syncValRef.current = 99.97;
          if (syncRef.current) { syncRef.current.textContent = 'SYNC 99.97%'; syncRef.current.style.color = ''; syncRef.current.style.textShadow = ''; }
        }, 4200);
      }
    }, 90);
  }, [flashStatus]);

  useImperativeHandle(handle, () => ({ flashStatus, boostSync }));

  return (
    <header className="topbar pwr">
      <div className="brand">
        <div className="hex-badge">
          <svg width="30" height="34" viewBox="0 0 30 34">
            <polygon points="15,1 29,9 29,25 15,33 1,25 1,9" fill="none" stroke="#b52200" strokeWidth="1.5" />
            <polygon points="15,8 22,12 22,22 15,26 8,22 8,12" fill="#b52200" />
          </svg>
        </div>
        <div className="wm">
          <b id="wm-name" />
          <span id="wm-role" />
        </div>
      </div>
      <div className="tb-cell hide-m">
        <div className="tb-label">Local Time <span className="jp">現時刻</span></div>
        <div className="tb-val" id="clock" ref={clockRef}>--:--:--</div>
      </div>
      <div className="tb-cell">
        <div className="tb-label">Sync Rate <span className="jp">同期率</span></div>
        <div className="tb-val" id="sync" ref={syncRef}>SYNC 99.97%</div>
      </div>
      <div className="tb-spacer tb-cell hide-m" style={{ justifyContent: 'center', alignItems: 'flex-end', borderRight: 0 }}>
        <div className="tb-jp">中央監視システム</div>
      </div>
      <div className="tb-cell tb-snd" id="snd-cell" role="button" tabIndex={0} style={{ cursor: 'pointer' }}
        title="Toggle audio"
        onClick={toggleSound}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSound(); } }}>
        <div className="tb-label">Audio <span className="jp">音響</span></div>
        <div className="tb-val">
          <span id="snd-ico">{soundOn ? '◉' : '▢'}</span> <span id="snd-txt">{soundOn ? 'ON' : 'MUTED'}</span>
        </div>
      </div>
      <div className="tb-cell" id="status" ref={statusEl} style={{ borderRight: 0, borderLeft: '1px solid var(--line)' }}>
        <div className="tb-label">System Status <span className="jp">状態</span></div>
        <div className="tb-val">
          <span className="dot live" ref={dotEl} /><span id="status-text" ref={statusTxt}>NOMINAL</span>
        </div>
      </div>
    </header>
  );
}
