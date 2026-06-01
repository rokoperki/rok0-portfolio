'use client';

import { useRef, useCallback } from 'react';
import type { Config } from '@/lib/types';
import { SECTIONS } from '@/lib/constants';
import { hx } from '@/lib/utils';
import { useNerv } from '@/components/context/NervContext';
import { useScramble } from '@/components/effects/useScramble';
import { AboutView } from './views/AboutView';
import { ProjectsView } from './views/ProjectsView';
import { ContactView } from './views/ContactView';

interface Props {
  config: Config;
}

export function ViewportCenter({ config }: Props) {
  const { active } = useNerv();
  const vpRef  = useRef<HTMLDivElement>(null);
  const inDetailRef = useRef(false);
  useScramble(vpRef, '.view-title, .part .pl, .pname, .channels .cv, .about-meta .v, .unit-word span, .check > span:first-child, .bn-nm');

  const inDetail = useCallback(() => inDetailRef.current, []);
  const closeDetail = useCallback(() => {
    document.dispatchEvent(new Event('nerv:closeDetail'));
  }, []);

  const s = SECTIONS[active];

  return (
    <main className="center pwr">
      <div className="tate" style={{ top: '50%', right: '6px', transform: 'translateY(-50%)' }}>中央監視装置</div>
      <div className="sec-head">
        <h2>Main Viewport</h2>
        <span className="jp" id="vp-addr">{hx(s.addr)}</span>
      </div>
      <div className="vp" id="vp" ref={vpRef}>
        <div className="vp-crumb" id="crumb">
          <span>MAP</span><span>/</span>
          <span className="seg2">{hx(s.addr)}</span>
          <span>/</span>
          <span className="blk">{s.name}</span>
        </div>

        <AboutView    config={config} isActive={active === 0} />
        <ProjectsView projects={config.projects} isActive={active === 1} onDetailOpen={(v) => { inDetailRef.current = v; }} />
        <ContactView  config={config} isActive={active === 2} />
      </div>

      {/* Moving targeting aim */}
      <div id="aim" aria-hidden="true">
        <svg viewBox="0 0 120 120" fill="none" stroke="var(--accent)" strokeWidth="1.5">
          <circle className="ar" cx="60" cy="60" r="46" strokeDasharray="5 9" />
          <circle cx="60" cy="60" r="30" stroke="var(--amber)" strokeOpacity="0.7" />
          <circle cx="60" cy="60" r="3" fill="var(--accent)" stroke="none" />
          <path d="M60 4 L60 26 M60 94 L60 116 M4 60 L26 60 M94 60 L116 60" />
          <path d="M16 16 L16 30 M16 16 L30 16" stroke="var(--amber)" />
          <path d="M104 16 L104 30 M104 16 L90 16" stroke="var(--amber)" />
          <path d="M16 104 L16 90 M16 104 L30 104" stroke="var(--amber)" />
          <path d="M104 104 L104 90 M104 104 L90 104" stroke="var(--amber)" />
        </svg>
        <span className="aim-tag" id="aim-tag">ACQUIRING</span>
      </div>
    </main>
  );
}
