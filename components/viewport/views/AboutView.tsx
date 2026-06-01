'use client';

import { useEffect, useRef } from 'react';
import type { Config } from '@/lib/types';
import { partClass } from '@/lib/utils';
import { GlobeCanvas } from '@/components/canvases/GlobeCanvas';
import { PsychographCanvas } from '@/components/canvases/PsychographCanvas';
import { BioportsCanvas } from '@/components/canvases/BioportsCanvas';

interface Props {
  config: Config;
  isActive: boolean;
}

export function AboutView({ config, isActive }: Props) {
  const bioRef   = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const unitTimeRef = useRef<HTMLSpanElement>(null);

  // Decrypt bio text when this view becomes active
  useEffect(() => {
    if (!isActive) return;
    const el = bioRef.current;
    if (!el) return;
    if (timerRef.current) clearInterval(timerRef.current);
    el.classList.add('scramble');
    const target = config.about;
    const chars = '0123456789ABCDEF ';
    let frame = 0;
    const totalFrames = 28;
    timerRef.current = setInterval(() => {
      frame++;
      const resolved = Math.floor(target.length * (frame / totalFrames));
      let out = '';
      for (let i = 0; i < target.length; i++) {
        if (i < resolved || (target[i] === ' ' && Math.random() < 0.6)) out += target[i];
        else out += chars[Math.floor(Math.random() * chars.length)];
      }
      el.textContent = out;
      if (frame >= totalFrames) {
        clearInterval(timerRef.current!);
        el.textContent = target;
        el.classList.remove('scramble');
      }
    }, 42);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isActive, config.about]);

  // Session uptime counter
  useEffect(() => {
    const t0 = Date.now();
    const id = setInterval(() => {
      const s = Math.floor((Date.now() - t0) / 1000);
      const p = (n: number) => String(n).padStart(2, '0');
      if (unitTimeRef.current) {
        unitTimeRef.current.textContent = `${p(Math.floor(s / 3600))}:${p(Math.floor(s / 60) % 60)}:${p(s % 60)}`;
      }
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const word = (config.unitLabel || 'UNIT 01').toUpperCase().split('').slice(0, 8);
  while (word.length < 8) word.push('');

  return (
    <section className={`view${isActive ? ' active' : ''}`} id="v-about">
      <div className="view-title" id="about-name">{config.name}</div>
      <div className="view-sub">DOSSIER · PRESENT STATUS <span className="jp">人事記録</span></div>
      <div className="bio" id="bio" ref={bioRef} />
      <div className="about-meta" id="about-meta">
        {config.aboutMeta.map((m) => (
          <div className="m" key={m.k}>
            <div className="k">{m.k}</div>
            <div className="v">{m.v}</div>
          </div>
        ))}
      </div>

      <div className="status-head">UNIT STATUS · OPERATING PARTS <span className="jp">稼働部位</span></div>
      <div className="status-wrap">
        <div className="status-col">
          <h3>Operating Parts <span className="jp">部位状態</span></h3>
          <div className="parts" id="parts">
            {config.unitParts.map((p, i) => (
              <div className="part" key={p.name}>
                <span className="pn">{String(i + 1).padStart(4, '0')}</span>
                <span className="pl">{p.name}</span>
                <span className={`ps ${partClass(p.status)}`}>{p.status}</span>
              </div>
            ))}
          </div>
          <h3 style={{ marginTop: '20px' }}>Diagnostics <span className="jp">診断</span></h3>
          <div className="checks" id="checks">
            {config.unitChecks.map((c) => (
              <div className="check" key={c}>
                <span>{c}</span><span className="ok">CHECK</span>
              </div>
            ))}
          </div>
        </div>
        <div className="status-col">
          <h3>Orbital Plot <span className="jp">軌道図</span></h3>
          <GlobeCanvas />
          <div className="status-tags" id="status-tags">
            {config.unitTags.map((t) => (
              <div className="row" key={t.k}>
                <span>{t.k}</span><span>{t.v}</span>
              </div>
            ))}
            <div className="row">
              <span>SESSION</span><span ref={unitTimeRef} id="unit-time">00:00:00</span>
            </div>
          </div>
          <PsychographCanvas casper={config.casper} />
        </div>
      </div>

      <BioportsCanvas layers={config.bioLayers} />

      <div className="unit-word" id="unit-word">
        {word.map((ch, i) => (
          <span key={i}>{ch === ' ' ? ' ' : ch || ' '}</span>
        ))}
      </div>
    </section>
  );
}
