'use client';

import { useEffect, useRef } from 'react';
import { SECTIONS } from '@/lib/constants';
import { hx } from '@/lib/utils';
import { useNerv } from '@/components/context/NervContext';
import { MagiPanel } from './MagiPanel';
import { useScramble } from '@/components/effects/useScramble';

export function MemoryMapNav() {
  const { active, cursor, selectSection, setCursor, magiRef } = useNerv();
  const navRef = useRef<HTMLDivElement>(null);
  useScramble(navRef, '.navitem .nm');

  const total = SECTIONS.reduce((a, s) => a + s.alloc, 0);

  return (
    <aside className="left ticks pwr">
      <div className="sec-head">
        <h2>Memory Map</h2><span className="jp">メモリ</span>
      </div>

      <nav className="nav" id="nav" ref={navRef}>
        {SECTIONS.map((s, i) => (
          <div
            key={s.id}
            className={`navitem${active === i ? ' sel' : ''}${cursor === i ? ' cursor' : ''}`}
            onClick={() => { setCursor(i); selectSection(i); }}
          >
            <span className="addr">{hx(s.addr)}</span>
            <span className="nm-wrap">
              <span className="nm">{s.name}</span>
              <span className="nm-jp">{s.jp}</span>
            </span>
            <span className="sz">{s.alloc}K</span>
          </div>
        ))}
      </nav>

      <div className="alloc">
        <div className="lbl">
          <span>Allocation</span>
          <span id="alloc-total">{total * 64} KB</span>
        </div>
        <div className="bar" id="alloc-bar">
          {SECTIONS.map((s, i) => (
            <div
              key={s.id}
              className={`seg${active === i ? ' sel' : ''}`}
              style={{ flex: s.alloc, background: s.color, opacity: 0.55 }}
              title={s.name}
              onClick={() => { setCursor(i); selectSection(i); }}
            />
          ))}
        </div>
        <div className="legend" id="alloc-legend">
          {SECTIONS.map((s) => (
            <span key={s.id}>
              <i style={{ background: s.color }} />
              {s.name} {Math.round(s.alloc / total * 100)}%
            </span>
          ))}
        </div>
      </div>

      <MagiPanel ref={magiRef} />
    </aside>
  );
}
