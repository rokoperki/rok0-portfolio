'use client';

import { useImperativeHandle, useRef, type Ref } from 'react';
import type { ReticleHandle } from '@/lib/types';

export function Reticle({ ref }: { ref?: Ref<ReticleHandle> }) {
  const elRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    trigger() {
      const el = elRef.current;
      if (!el) return;
      el.classList.remove('show');
      void el.offsetWidth;
      el.classList.add('show');
      setTimeout(() => el.classList.remove('show'), 1150);
    },
  }));

  return (
    <div id="reticle" ref={elRef}>
      <svg viewBox="0 0 300 300" fill="none" stroke="#ff3b1f" strokeWidth="1.5">
        <circle cx="150" cy="150" r="120" strokeDasharray="6 10" />
        <circle cx="150" cy="150" r="84" />
        <circle cx="150" cy="150" r="30" stroke="#ffb000" />
        <line x1="150" y1="6" x2="150" y2="60" />
        <line x1="150" y1="240" x2="150" y2="294" />
        <line x1="6" y1="150" x2="60" y2="150" />
        <line x1="240" y1="150" x2="294" y2="150" />
        <path d="M40 40 L40 70 M40 40 L70 40" stroke="#ffb000" />
        <path d="M260 40 L260 70 M260 40 L230 40" stroke="#ffb000" />
        <path d="M40 260 L40 230 M40 260 L70 260" stroke="#ffb000" />
        <path d="M260 260 L260 230 M260 260 L230 260" stroke="#ffb000" />
      </svg>
      <div className="ret-txt">PATTERN ANALYSIS</div>
    </div>
  );
}
