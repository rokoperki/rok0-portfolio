'use client';

import { useEffect, useRef } from 'react';
import { REGNAMES } from '@/lib/constants';
import { rhex } from '@/lib/utils';

export function RegistersPanel() {
  const gridRef = useRef<HTMLDivElement>(null);

  // Initial render via ref to avoid React reconciliation
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    grid.innerHTML = REGNAMES.map((r) =>
      `<div class="r"><b>${r}</b><span class="v" data-r="${r}">0x${rhex()}</span></div>`
    ).join('');
  }, []);

  // Live flicker
  useEffect(() => {
    const id = setInterval(() => {
      const grid = gridRef.current;
      if (!grid) return;
      const vals = grid.querySelectorAll<HTMLSpanElement>('.v');
      const n = 1 + Math.floor(Math.random() * 2);
      for (let k = 0; k < n; k++) {
        const v = vals[Math.floor(Math.random() * vals.length)];
        if (!v || v.dataset.r === 'RIP') continue;
        v.textContent = (v.dataset.r === 'RSP' || v.dataset.r === 'RBP')
          ? '0x7FFEFF' + rhex(2)
          : '0x' + rhex();
        v.classList.add('chg');
        setTimeout(() => v.classList.remove('chg'), 340);
      }
    }, 620);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="regs">
      <div className="sec-head" style={{ margin: '-10px -12px 10px', background: 'transparent', borderBottom: '1px solid var(--line)' }}>
        <h2>Registers</h2><span className="jp">レジスタ</span>
      </div>
      <div className="grid" id="regs" ref={gridRef} />
    </div>
  );
}
