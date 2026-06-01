'use client';

import { useEffect, useRef } from 'react';

export function PsychographCanvas({ casper }: { casper: string }) {
  const cvRef   = useRef<HTMLCanvasElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cv   = cvRef.current;
    const host = hostRef.current;
    if (!cv || !host) return;
    const cvEl = cv, hostEl = host; // captured non-null for inner functions

    const ctx = cvEl.getContext('2d')!;
    let W = 0, H = 0, psyT = 0;
    const H_FIXED = 184;

    function size() {
      const w = Math.max(140, hostEl.clientWidth);
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      cvEl.width = w * dpr; cvEl.height = H_FIXED * dpr;
      cvEl.style.width = w + 'px'; cvEl.style.height = H_FIXED + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      W = w; H = H_FIXED;
      ctx.fillStyle = '#070907'; ctx.fillRect(0, 0, W, H);
    }

    function grid() {
      ctx.strokeStyle = 'rgba(125,255,122,0.22)'; ctx.lineWidth = 1;
      for (let gx = 24; gx < W; gx += 42) {
        for (let gy = 22; gy < H; gy += 34) {
          ctx.beginPath();
          ctx.moveTo(gx - 3, gy); ctx.lineTo(gx + 3, gy);
          ctx.moveTo(gx, gy - 3); ctx.lineTo(gx, gy + 3);
          ctx.stroke();
        }
      }
      ctx.strokeStyle = 'rgba(255,150,55,0.35)';
      for (let x = 8; x < W - 6; x += 16) {
        ctx.beginPath(); ctx.moveTo(x, H - 6); ctx.lineTo(x, (x / 16) % 4 === 0 ? H - 13 : H - 9); ctx.stroke();
      }
      for (let y = 10; y < H - 8; y += 14) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo((y / 14) % 4 === 0 ? 9 : 5, y); ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(255,150,55,0.55)';
      ctx.beginPath(); ctx.moveTo(8, H - 6); ctx.lineTo(W - 8, H - 6); ctx.stroke();
      ctx.fillStyle = 'rgba(125,255,122,0.5)'; ctx.font = "9px 'JetBrains Mono',monospace";
      ctx.fillText('調和 HARMONICS', 8, 12);
      ctx.fillStyle = 'rgba(255,170,70,0.45)';
      ctx.fillText('AMP ' + (0.6 + 0.4 * Math.sin(psyT * 0.05)).toFixed(2), W - 72, 12);
    }

    function draw() {
      ctx.fillStyle = 'rgba(7,9,7,0.30)'; ctx.fillRect(0, 0, W, H);
      grid();
      const cx = W * 0.42, cy = H * 0.48;
      ctx.lineWidth = 1.4; ctx.shadowColor = 'rgba(255,120,40,0.6)'; ctx.shadowBlur = 5;
      for (let layer = 0; layer < 3; layer++) {
        ctx.strokeStyle = `rgba(255,${120 + layer * 30},${40 + layer * 10},${0.9 - layer * 0.18})`;
        ctx.beginPath();
        const a = 2 + layer, b = 3 + layer, ph = psyT * 0.02 + layer * 1.3;
        const RX = W * 0.16 + layer * 6, RY = H * 0.32 - layer * 4;
        for (let i = 0; i <= 260; i++) {
          const t = (i / 260) * Math.PI * 2;
          const wobble = Math.sin(t * 7 + ph * 2) * 6 + Math.sin(t * 13 - ph) * 3;
          const x = cx + Math.sin(a * t + ph) * (RX + wobble) + Math.sin(t * 3 + ph * 1.7) * 10;
          const y = cy + Math.sin(b * t + ph * 1.3) * (RY + wobble * 0.6);
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(255,170,70,0.7)'; ctx.beginPath();
      let px = cx + W * 0.18, py = cy; ctx.moveTo(px, py);
      for (let i = 0; i < 26; i++) {
        px += W * 0.018 + Math.random() * 3;
        py += Math.sin(i * 0.7 + psyT * 0.05) * 9 + (Math.random() - 0.5) * 6;
        if (px > W - 10) px = W - 10;
        ctx.lineTo(px, py);
      }
      ctx.stroke(); ctx.shadowBlur = 0;

      const sx = (psyT * 2.4) % (W + 40) - 20;
      const g = ctx.createLinearGradient(sx - 18, 0, sx + 4, 0);
      g.addColorStop(0, 'rgba(51,231,210,0)'); g.addColorStop(1, 'rgba(51,231,210,0.5)');
      ctx.fillStyle = g; ctx.fillRect(sx - 18, 0, 22, H);
      ctx.strokeStyle = 'rgba(120,255,235,0.8)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(sx, 0); ctx.lineTo(sx, H); ctx.stroke();

      const lx = cx + Math.sin(psyT * 0.03) * 10, ly = cy + Math.cos(psyT * 0.025) * 8;
      const pr = 6 + 2 * Math.sin(psyT * 0.18);
      ctx.strokeStyle = 'rgba(255,59,31,0.9)'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(lx, ly, pr, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(lx - pr - 4, ly); ctx.lineTo(lx - pr, ly);
      ctx.moveTo(lx + pr, ly); ctx.lineTo(lx + pr + 4, ly);
      ctx.moveTo(lx, ly - pr - 4); ctx.lineTo(lx, ly - pr);
      ctx.moveTo(lx, ly + pr); ctx.lineTo(lx, ly + pr + 4);
      ctx.stroke();
    }

    size(); draw();
    const timer = setInterval(() => { psyT++; draw(); }, 60);
    const onResize = () => { size(); draw(); };
    window.addEventListener('resize', onResize);
    const ro = new ResizeObserver(onResize);
    ro.observe(hostEl);

    return () => { clearInterval(timer); window.removeEventListener('resize', onResize); ro.disconnect(); };
  }, []);

  return (
    <div className="psy" ref={hostRef}>
      <div className="psy-top">
        <span className="l">Psychographic Display · LINK A <span className="jp">心理図</span></span>
        <span className="t" id="psy-phase">PHASE 4</span>
      </div>
      <canvas id="psy-canvas" ref={cvRef} />
      <div className="psy-foot">DATA ANALYZED BY <b id="psy-by">{casper}</b></div>
    </div>
  );
}
