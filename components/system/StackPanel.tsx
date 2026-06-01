'use client';

import { useEffect, useRef } from 'react';
import { rhex } from '@/lib/utils';

function buildStackHtml(): string {
  let rows = '';
  for (let i = 0; i < 6; i++) {
    const top = i === 0;
    const tag = top ? '← RSP' : i === 1 ? 'ret' : i === 2 ? 'arg0' : i === 3 ? 'arg1' : '';
    rows += `<div class="row${top ? ' top' : ''}"><span class="sa">0x7FFEFF${(0x80 - i * 8).toString(16).toUpperCase().padStart(2, '0')}</span><span>0x${rhex()}</span><span class="tag">${tag}</span></div>`;
  }
  return rows;
}

export function StackPanel() {
  const stackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = stackRef.current;
    if (el) el.innerHTML = buildStackHtml();
  }, []);

  // Live churn of top stack values
  useEffect(() => {
    const id = setInterval(() => {
      const el = stackRef.current;
      if (!el) return;
      const rows = el.querySelectorAll<HTMLDivElement>('.row');
      if (!rows.length) return;
      const row = rows[Math.floor(Math.random() * rows.length)];
      const spans = row.querySelectorAll('span');
      if (spans[1]) spans[1].textContent = '0x' + rhex();
    }, 1400);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="stack">
      <div className="sec-head" style={{ margin: '-10px -12px 10px', background: 'transparent', borderBottom: '1px solid var(--line)' }}>
        <h2>Stack</h2><span className="jp">スタック</span>
      </div>
      <div id="stack" ref={stackRef} />
    </div>
  );
}
