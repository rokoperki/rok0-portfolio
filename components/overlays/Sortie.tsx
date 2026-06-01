'use client';

import { useImperativeHandle, useRef, type Ref } from 'react';
import type { SortieHandle } from '@/lib/types';
import { Sound } from '@/lib/sound';
import { useNerv } from '@/components/context/NervContext';

export function Sortie({ ref }: { ref?: Ref<SortieHandle> }) {
  const elRef   = useRef<HTMLDivElement>(null);
  const timers  = useRef<ReturnType<typeof setTimeout>[]>([]);
  const { flashStatus, emitJmp, triggerAtField, triggerReticle } = useNerv();

  useImperativeHandle(ref, () => ({
    run(done) {
      const ov = elRef.current;
      if (!ov) { done?.(); return; }

      timers.current.forEach(clearTimeout);
      timers.current = [];
      ov.classList.remove('launch');
      ov.classList.add('show');

      const unitEl   = ov.querySelector<HTMLElement>('#srt-unit');
      const pidEl    = ov.querySelector<HTMLElement>('#srt-pid');
      const statusEl = ov.querySelector<HTMLElement>('#srt-status');
      const countEl  = ov.querySelector<HTMLElement>('#srt-count');
      const barsEl   = ov.querySelector<HTMLElement>('#srt-bars');

      if (unitEl)   unitEl.textContent   = 'ALL UNITS';
      if (pidEl)    pidEl.textContent    = '0x1000';
      if (statusEl) statusEl.textContent = '準備 // LAUNCH PREP';
      if (countEl)  countEl.textContent  = 'T-03';
      if (barsEl)   barsEl.innerHTML     = '<i></i><i></i><i></i><i></i><i></i><i></i>';
      const bars = barsEl ? [...barsEl.children] as HTMLElement[] : [];

      Sound.blip(330, 0.08, 'square', 0.4);
      flashStatus('SORTIE', true);
      emitJmp('SORTIE 0x1000   ; PROCESS TABLE LAUNCH');

      ['T-03', 'T-02', 'T-01'].forEach((t, k) => {
        timers.current.push(setTimeout(() => {
          if (countEl) countEl.textContent = t;
          bars.slice(0, (k + 1) * 2).forEach((b) => b.classList.add('on'));
          Sound.blip(440 + k * 120, 0.06, 'square', 0.35);
        }, 380 + k * 360));
      });

      timers.current.push(setTimeout(() => {
        if (statusEl) statusEl.textContent = '加圧 // PRESSURIZED';
      }, 760));

      timers.current.push(setTimeout(() => {
        if (countEl)  countEl.textContent  = '発進 // LAUNCH';
        if (statusEl) statusEl.textContent = '射出 // CATAPULT';
        bars.forEach((b) => b.classList.add('on'));
        ov.classList.add('launch');
        Sound.confirm();
        triggerAtField();
        triggerReticle();
      }, 1500));

      timers.current.push(setTimeout(() => {
        ov.classList.remove('show', 'launch');
        done?.();
      }, 2360));
    },
  }));

  return (
    <div id="sortie" ref={elRef} aria-hidden="true">
      <div className="srt-inner">
        <div className="srt-top">
          <span className="srt-h">LAUNCH SEQUENCE</span>
          <span className="jp">発進シークエンス</span>
        </div>
        <div className="srt-stage">
          <div className="srt-rail left"><span>射出</span><span>射出</span><span>射出</span></div>
          <div className="srt-cage" id="srt-cage">
            <div className="srt-cage-top">CATAPULT // 射出機構</div>
            <div className="srt-unit" id="srt-unit">UNIT-01</div>
            <div className="srt-pid" id="srt-pid">0x0000</div>
            <div className="srt-bars" id="srt-bars" />
            <div className="srt-status" id="srt-status">準備 // LAUNCH PREP</div>
          </div>
          <div className="srt-rail right"><span>射出</span><span>射出</span><span>射出</span></div>
        </div>
        <div className="srt-count" id="srt-count">T-03</div>
      </div>
    </div>
  );
}
