'use client';

import { useImperativeHandle, useRef, type Ref } from 'react';
import type { AtFieldHandle } from '@/lib/types';
import { Sound } from '@/lib/sound';

export function AtField({ ref }: { ref?: Ref<AtFieldHandle> }) {
  const cvRef = useRef<HTMLCanvasElement>(null);

  useImperativeHandle(ref, () => ({
    trigger(cx?: number, cy?: number) {
      const cv = cvRef.current;
      if (!cv) return;
      const ctx = cv.getContext('2d')!;
      const w = cv.width = window.innerWidth;
      const h = cv.height = window.innerHeight;
      const fcx = cx ?? w / 2;
      const fcy = cy ?? h * 0.46;
      cv.classList.add('show');
      Sound.blip(170, 0.32, 'sine', 0.5);

      const hr = 32, dx = hr * 1.5, dy = hr * Math.sqrt(3), band = 150;
      const diag = Math.hypot(w, h);

      function hex(hx: number, hy: number, r: number) {
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = Math.PI / 3 * i;
          const px = hx + r * Math.cos(a), py = hy + r * Math.sin(a);
          i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
        }
        ctx.closePath();
      }

      let e = 0;
      const timer = setInterval(() => {
        e += 0.05;
        if (e >= 1) { clearInterval(timer); ctx.clearRect(0, 0, w, h); cv.classList.remove('show'); return; }
        ctx.clearRect(0, 0, w, h);
        const ring = e * diag * 0.85, fade = 1 - e;
        for (let col = 0; col * dx <= w + hr; col++) {
          const x = col * dx;
          for (let row = 0; row * dy <= h + hr; row++) {
            const y = row * dy + (col % 2 ? dy / 2 : 0);
            const d = Math.hypot(x - fcx, y - fcy);
            const prox = 1 - Math.min(1, Math.abs(d - ring) / band);
            if (prox <= 0.02) continue;
            const a = prox * fade;
            hex(x, y, hr - 3);
            ctx.fillStyle = `rgba(255,120,40,${(a * 0.16).toFixed(3)})`; ctx.fill();
            ctx.lineWidth = 1.3;
            ctx.strokeStyle = `rgba(255,${150 + Math.floor(60 * prox)},70,${(a * 0.85).toFixed(3)})`;
            ctx.stroke();
          }
        }
      }, 38);
    },
  }));

  return (
    <>
      <canvas id="atfield" ref={cvRef} aria-hidden="true" />
      <div id="atf-hold" aria-hidden="true">
        <span className="atf-t">A.T. FIELD</span>
        <span className="atf-jp">絶対領域 展開</span>
        <i className="atf-meter"><b /></i>
      </div>
    </>
  );
}
