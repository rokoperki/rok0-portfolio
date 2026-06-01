'use client';

import { useImperativeHandle, useRef, type Ref } from 'react';
import type { TribunalHandle } from '@/lib/types';
import { Sound } from '@/lib/sound';
import { useNerv } from '@/components/context/NervContext';

export function Tribunal({ ref }: { ref?: Ref<TribunalHandle> }) {
  const elRef = useRef<HTMLDivElement>(null);
  const { flashStatus, triggerAtField } = useNerv();

  useImperativeHandle(ref, () => ({
    run(query, cb, forceOk) {
      const ov = elRef.current;
      if (!ov) { cb?.(true); return; }
      const ovEl = ov;

      ovEl.classList.add('show');
      const qEl = ovEl.querySelector<HTMLElement>('#tb-query');
      const vEl = ovEl.querySelector<HTMLElement>('#tb-verdict');
      if (qEl) qEl.textContent = 'QUERY: ' + query;
      if (vEl) { vEl.textContent = 'DELIBERATING…'; vEl.className = 'tb-verdict'; }

      const nodes = [...ovEl.querySelectorAll<HTMLElement>('.tnode')];
      nodes.forEach((n) => { n.className = 'tnode'; const st = n.querySelector('.tst'); if (st) st.textContent = 'STANDBY'; });

      flashStatus('TRIBUNAL', true);
      Sound.blip(523, 0.06, 'triangle', 0.4);

      const votes = forceOk ? [true, true, true] : [true, Math.random() < 0.9, Math.random() < 0.8];
      let done = 0;

      nodes.forEach((n, i) => {
        setTimeout(() => {
          n.classList.add('think');
          const st = n.querySelector('.tst'); if (st) st.textContent = 'DELIBERATING';
          Sound.blip(600 + i * 40, 0.04, 'square', 0.25);
        }, 350 + i * 180);

        setTimeout(() => {
          n.classList.remove('think');
          const aff = votes[i];
          n.classList.add(aff ? 'aff' : 'neg');
          const st = n.querySelector('.tst'); if (st) st.textContent = aff ? 'AFFIRMATIVE' : 'NEGATIVE';
          Sound.blip(aff ? 720 : 240, 0.07, aff ? 'triangle' : 'sawtooth', 0.4);
          if (++done === nodes.length) finish();
        }, 1100 + i * 520);
      });

      function finish() {
        const aff = votes.filter(Boolean).length;
        const ok = aff >= 2;
        setTimeout(() => {
          if (vEl) { vEl.textContent = `CONSENSUS ${aff}/3 · ${ok ? 'APPROVED' : 'DENIED'}`; vEl.className = 'tb-verdict ' + (ok ? 'ok' : 'no'); }
          if (ok) { Sound.confirm(); } else { Sound.deny(); triggerAtField(); }
          flashStatus(ok ? 'APPROVED' : 'DENIED', !ok);
          setTimeout(() => { ovEl.classList.remove('show'); cb?.(ok); }, 1250);
        }, 380);
      }
    },
  }));

  return (
    <div id="tribunal" ref={elRef} aria-hidden="true">
      <div className="tb-shell ticks">
        <div className="tb-head">
          <span className="t">TRIBUNAL · 3-CORE CONSENSUS</span>
          <span className="jp">三賢者</span>
        </div>
        <div className="tb-query" id="tb-query">QUERY: —</div>
        <div className="tb-nodes">
          {[['01', 'GNOSIS'], ['02', 'PATHOS'], ['03', 'LOGOS']].map(([code, name], i) => (
            <div className="tnode" data-n={String(i)} key={name}>
              <div className="thex"><span>{code}</span></div>
              <div className="tnm">{name}</div>
              <div className="tst">STANDBY</div>
            </div>
          ))}
        </div>
        <div className="tb-verdict" id="tb-verdict">DELIBERATING…</div>
      </div>
    </div>
  );
}
