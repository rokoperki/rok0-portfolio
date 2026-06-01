'use client';

import { useEffect, useRef } from 'react';
import { partClass } from '@/lib/utils';
import type { BioLayer } from '@/lib/types';

interface Props {
  layers: BioLayer[];
}

export function BioportsCanvas({ layers }: Props) {
  const hostRef  = useRef<HTMLDivElement>(null);
  const cvRef    = useRef<HTMLCanvasElement>(null);
  const layersRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const cv   = cvRef.current;
    if (!host || !cv) return;

    const hostEl = host; // captured non-null refs for closures
    const cvEl   = cv;
    const ctx = cvEl.getContext('2d')!;
    const CELL_H = 4, GAP = 1.6, PAD = 10;
    let W = 0, H = 0, NCOL = 8, colW = 0, nCells = 0;
    let cols: { fill: number; seed: number }[] = [];
    let t = 0;

    function setup() {
      NCOL = Math.max(6, Math.min(10, Math.floor((hostEl.clientWidth || 300) / 30)));
      cols = Array.from({ length: NCOL }, (_, c) => ({
        fill: Math.min(1, 0.22 + (c / (NCOL - 1)) ** 1.3 * 0.95),
        seed: Math.random() * 100,
      }));
    }

    function size() {
      const w = Math.max(160, hostEl.clientWidth);
      const h = Math.max(190, hostEl.clientHeight || 216);
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      cvEl.width = w * dpr; cvEl.height = h * dpr;
      cvEl.style.width = w + 'px'; cvEl.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      W = w; H = h;
      colW = (w - PAD * 2) / NCOL;
      nCells = Math.floor((h - PAD * 2) / (CELL_H + GAP));
    }

    function cellColor(r: number, bright: number): string {
      const band = 5, m = (r % band) / (band - 1), edge = Math.abs(m - 0.5) * 2;
      let rC, gC, bC;
      if (edge > 0.6)       { rC = 255; gC = 42 + (1 - edge) * 60; bC = 18; }
      else if (edge > 0.28) { rC = 255; gC = 130; bC = 22; }
      else                  { rC = 255; gC = 210; bC = 74; }
      const k = 0.55 + bright * 0.45;
      return `rgba(${rC | 0},${(gC * k) | 0},${(bC * k) | 0},${(0.8 + bright * 0.2).toFixed(2)})`;
    }

    function draw() {
      ctx.fillStyle = '#080503'; ctx.fillRect(0, 0, W, H);
      const bg = ctx.createRadialGradient(W * 0.16, H * 0.74, 4, W * 0.16, H * 0.74, H * 0.7);
      bg.addColorStop(0, 'rgba(255,90,30,0.18)'); bg.addColorStop(1, 'rgba(255,90,30,0)');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

      cols.forEach((col, c) => {
        const x = PAD + c * colW, cw = colW - 3;
        const filled = Math.round(nCells * col.fill);
        for (let r = 0; r < nCells; r++) {
          const yTop = H - PAD - (r + 1) * (CELL_H + GAP);
          let on: boolean, bright: number;
          if (r < filled) {
            on = Math.random() > 0.05;
            bright = 0.5 + 0.5 * Math.abs(Math.sin(t * 0.12 + r * 0.5 + col.seed));
          } else {
            const frag = (Math.sin(r * 1.3 + col.seed * 2) + 1) / 2;
            on = frag > 0.72 && Math.random() > 0.25;
            bright = 0.4 + Math.random() * 0.4;
          }
          if (!on) continue;
          ctx.fillStyle = cellColor(r, bright);
          ctx.fillRect(x, yTop, cw, CELL_H);
        }
      });

      ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1;
      for (let c = 1; c < NCOL; c++) {
        const x = PAD + c * colW - 1.5;
        ctx.beginPath(); ctx.moveTo(x, PAD); ctx.lineTo(x, H - PAD); ctx.stroke();
      }
    }

    setup(); size(); draw();
    const timer = setInterval(() => {
      if (hostEl.clientHeight > 2 && Math.abs(hostEl.clientHeight - H) > 2) size();
      t++; draw();
    }, 110);
    const onResize = () => { setup(); size(); draw(); };
    window.addEventListener('resize', onResize);
    const ro = new ResizeObserver(onResize);
    ro.observe(hostEl);

    return () => { clearInterval(timer); window.removeEventListener('resize', onResize); ro.disconnect(); };
  }, []);

  const layerRows = layers.map((l, i) => {
    const sec = Math.floor(i / 4);
    return { l, sec };
  });

  const lvlFor = (s: string) => s.startsWith('OP') ? 0.92 : s.startsWith('SYNC') ? 0.66 : 0.34;

  return (
    <div className="bioports">
      <div className="bio-top">
        <span className="l">Bioports · Neural Layers <span className="jp">生体接続</span></span>
        <span className="t" id="bio-clock">HEMS REV 14.0</span>
      </div>
      <div className="bio-body">
        <div className="bio-wave-host" id="bio-wave-host" ref={hostRef}>
          <canvas id="bio-wave" ref={cvRef} />
        </div>
        <div className="bio-layers" ref={layersRef}>
          {layerRows.map(({ l, sec }, i) => {
            const prevSec = i > 0 ? Math.floor((i - 1) / 4) : -1;
            return (
              <div key={l.id}>
                {sec !== prevSec && (
                  <div className="bio-sec">
                    LAYER 0{2 - sec} <span className="bsj">{sec === 0 ? '応用' : '基盤'}</span>
                  </div>
                )}
                <div
                  className={`bio-layer${l.status.startsWith('SYNC') ? ' hot' : ''}`}
                  style={{ '--lv': `${Math.round(lvlFor(l.status) * 100)}%` } as React.CSSProperties}
                >
                  <span className="bn"><span className="bn-nm">{l.name}</span><small>{l.sub}</small></span>
                  <span className={`bs ${partClass(l.status)}`}><span className="bdot"></span>{l.status}</span>
                  <span className="bnum">{l.id}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
