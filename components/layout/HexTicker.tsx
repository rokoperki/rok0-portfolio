'use client';

import { useEffect, useRef } from 'react';
import { hx, rhex } from '@/lib/utils';

export function HexTicker() {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let base = 0x00400000;
    let seg = '';
    for (let i = 0; i < 26; i++) {
      const bytes = Array.from({ length: 8 }, () => rhex(2).toLowerCase());
      const ascii = bytes
        .map((b) => { const n = parseInt(b, 16); return n >= 32 && n < 127 ? String.fromCharCode(n) : '.'; })
        .join('');
      seg += `<span>${hx(base + i * 8, 8)}  <span class="hx">${bytes.join(' ')}</span>  <span class="as">${ascii.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</span></span>`;
    }
    track.innerHTML = seg + seg; // duplicate for seamless loop
  }, []);

  return (
    <div className="ticker pwr">
      <div className="tag">
        0x7FFE // DUMP <span className="jp" style={{ color: 'var(--dim2)', marginLeft: '4px' }}>記憶</span>
      </div>
      <div className="track" id="ticker" ref={trackRef} />
    </div>
  );
}
