'use client';

import { useEffect, useRef } from 'react';

export function GlobeCanvas() {
  const hostRef = useRef<HTMLDivElement>(null);
  const cvRef   = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const cv   = cvRef.current;
    if (!host || !cv) return;
    const hostEl = host, cvEl = cv; // captured non-null for inner functions

    const ctx = cvEl.getContext('2d')!;
    let ang = 0.6;
    let dim = { w: 0, h: 0 };

    function size() {
      const w = Math.max(120, hostEl.clientWidth - 20);
      const h = Math.min(260, Math.max(200, Math.round(w * 0.92)));
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      cvEl.width = w * dpr; cvEl.height = h * dpr;
      cvEl.style.width = w + 'px'; cvEl.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return { w, h };
    }

    function proj(lat: number, lon: number, R: number, cx: number, cy: number) {
      const la = lat * Math.PI / 180;
      const lo = lon * Math.PI / 180 + ang;
      const x = Math.cos(la) * Math.sin(lo);
      const y = Math.sin(la);
      const z = Math.cos(la) * Math.cos(lo);
      return { x: cx + x * R, y: cy - y * R * 0.96, z };
    }

    function seg(p1: { x: number; y: number; z: number }, p2: typeof p1, base: number) {
      const z = (p1.z + p2.z) / 2;
      const a = z > 0 ? base * (0.35 + 0.65 * z) : base * 0.16;
      ctx.strokeStyle = `rgba(255,150,55,${a.toFixed(3)})`;
      ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
    }

    function draw() {
      const { w, h } = dim;
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2, cy = h / 2, R = Math.min(w, h) / 2 - 20;
      ctx.lineWidth = 1;

      for (let lat = -80; lat <= 80; lat += 10) {
        let prev: ReturnType<typeof proj> | null = null;
        const base = lat % 30 === 0 ? 1.0 : 0.62;
        for (let lon = 0; lon <= 360; lon += 6) {
          const p = proj(lat, lon, R, cx, cy);
          if (prev) seg(prev, p, base);
          prev = p;
        }
      }
      for (let lon = 0; lon < 360; lon += 20) {
        let prev: ReturnType<typeof proj> | null = null;
        for (let lat = -90; lat <= 90; lat += 5) {
          const p = proj(lat, lon, R, cx, cy);
          if (prev) seg(prev, p, 0.7);
          prev = p;
        }
      }

      ctx.strokeStyle = 'rgba(255,180,90,0.9)'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.ellipse(cx, cy, R, R * 0.96, 0, 0, Math.PI * 2); ctx.stroke();

      const rings = [
        { rx: R * 1.12, ry: R * 0.32, rot: -0.42, sp: 1.0,  col: 'rgba(125,255,122,0.55)' },
        { rx: R * 1.2,  ry: R * 0.18, rot: 0.5,   sp: -0.7, col: 'rgba(255,150,55,0.55)' },
      ];
      rings.forEach((rg, k) => {
        ctx.strokeStyle = rg.col; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.ellipse(cx, cy, rg.rx, rg.ry, rg.rot, 0, Math.PI * 2); ctx.stroke();
        const sa = ang * rg.sp * 2.4 + k * 2;
        const ex = Math.cos(sa) * rg.rx, ey = Math.sin(sa) * rg.ry;
        const sx = cx + ex * Math.cos(rg.rot) - ey * Math.sin(rg.rot);
        const sy = cy + ex * Math.sin(rg.rot) + ey * Math.cos(rg.rot);
        ctx.fillStyle = k ? 'rgba(255,170,70,0.95)' : 'rgba(160,255,150,0.95)';
        ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 6;
        ctx.beginPath(); ctx.arc(sx, sy, 2.2, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
      });

      ctx.strokeStyle = 'rgba(255,150,55,0.4)'; ctx.setLineDash([2, 5]);
      ctx.beginPath(); ctx.ellipse(cx, cy, R * 0.62, R * 0.6, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = 'rgba(255,170,70,0.9)';
      ctx.shadowColor = 'rgba(255,140,40,0.9)'; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.arc(cx, cy, 2.4, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;

      ctx.strokeStyle = 'rgba(255,150,55,0.5)'; ctx.lineWidth = 1;
      [[cx, cy - R * 0.96], [cx, cy + R * 0.96], [cx - R, cy], [cx + R, cy]].forEach(([x, y]) => {
        ctx.beginPath(); ctx.moveTo(x - 3, y); ctx.lineTo(x + 3, y);
        ctx.moveTo(x, y - 3); ctx.lineTo(x, y + 3); ctx.stroke();
      });
    }

    dim = size();
    draw();
    const timer = setInterval(() => { ang += 0.012; draw(); }, 55);
    const onResize = () => { dim = size(); draw(); };
    window.addEventListener('resize', onResize);
    const ro = new ResizeObserver(onResize);
    ro.observe(hostEl);

    return () => {
      clearInterval(timer);
      window.removeEventListener('resize', onResize);
      ro.disconnect();
    };
  }, []);

  return (
    <div className="unit-fig globe-fig" id="globe-host" ref={hostRef}>
      <canvas id="globe" ref={cvRef} />
      <div className="g-lbl tl">AF-64 ±A<br />X30-71</div>
      <div className="g-lbl tr">79:85·423<br />65:40·819<br />43:76·203</div>
      <div className="g-lbl ml">↙ TOWARDS<br />GALACTIC<br />ROTATION</div>
      <div className="g-lbl bl">N-1620</div>
      <div className="g-lbl br">EXELION·202<br />SYNC LOCK</div>
    </div>
  );
}
