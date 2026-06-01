'use client';

import { useImperativeHandle, useRef, useEffect, type Ref } from 'react';
import type { MagiHandle } from '@/lib/types';

export function MagiPanel({ ref }: { ref?: Ref<MagiHandle> }) {
  const panelRef  = useRef<HTMLDivElement>(null);
  const verdictRef = useRef<HTMLSpanElement>(null);
  const sealRef   = useRef<HTMLSpanElement>(null);

  // Idle blink on random node
  useEffect(() => {
    const id = setInterval(() => {
      const panel = panelRef.current;
      if (!panel) return;
      const nodes = panel.querySelectorAll<HTMLElement>('.magi-node');
      nodes.forEach((n) => n.classList.remove('blink'));
      if (Math.random() < 0.7) {
        nodes[Math.floor(Math.random() * nodes.length)]?.classList.add('blink');
      }
    }, 1700);
    return () => clearInterval(id);
  }, []);

  useImperativeHandle(ref, () => ({
    setAuthed(on) {
      const panel = panelRef.current;
      if (!panel) return;
      panel.classList.toggle('authed', on);
      if (verdictRef.current) verdictRef.current.textContent = on ? 'CONSENSUS 3/3' : 'AWAITING AUTH';
      if (sealRef.current)   sealRef.current.textContent   = on ? '可決' : '待機';
    },
  }));

  return (
    <div className="magi" id="magi-panel" ref={panelRef}>
      <div className="magi-head">
        <span>MAGI · 3-CORE</span><span className="jp">三賢者</span>
      </div>
      <div className="magi-fig">
        <svg viewBox="0 0 230 150" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
          <g stroke="rgba(255,120,40,0.35)" strokeWidth="1" fill="none">
            <path d="M115 44 L115 75" /><path d="M60 120 L115 75" />
            <path d="M170 120 L115 75" /><path d="M60 120 L170 120" />
          </g>
          <circle cx="115" cy="75" r="3.5" fill="#ff6a00" />
          {[
            { n: 0, pts: '115,12 141,27 141,57 115,72 89,57 89,27',  tx: 115, ty: [38, 52], code: '01', name: 'GNOSIS' },
            { n: 1, pts: '60,90 86,105 86,135 60,150 34,135 34,105', tx:  60, ty: [116, 130], code: '02', name: 'PATHOS' },
            { n: 2, pts: '170,90 196,105 196,135 170,150 144,135 144,105', tx: 170, ty: [116, 130], code: '03', name: 'LOGOS' },
          ].map(({ n, pts, tx, ty, code, name }) => (
            <g className="magi-node" data-n={String(n)} key={n}>
              <polygon points={pts} fill="rgba(255,120,40,0.06)" stroke="currentColor" strokeWidth="1.4" />
              <text x={tx} y={ty[0]} textAnchor="middle" className="mn-code">{code}</text>
              <text x={tx} y={ty[1]} textAnchor="middle" className="mn-name">{name}</text>
            </g>
          ))}
        </svg>
      </div>
      <div className="magi-foot">
        <span id="magi-verdict" ref={verdictRef}>AWAITING AUTH</span>
        <span className="magi-seal" id="magi-seal" ref={sealRef}>待機</span>
      </div>
    </div>
  );
}
