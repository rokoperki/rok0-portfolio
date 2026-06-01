'use client';

import { useRef, useCallback, useEffect } from 'react';
import { CONFIG } from '@/lib/config';
import { NervProvider, useNerv } from './context/NervContext';
import { AtmosphericFx } from './overlays/AtmosphericFx';
import { Reticle } from './overlays/Reticle';
import { CorruptOverlay } from './overlays/CorruptOverlay';
import { AtField } from './overlays/AtField';
import { Sortie } from './overlays/Sortie';
import { Tribunal } from './overlays/Tribunal';
import { BootScreen } from './overlays/BootScreen';
import { TopBar } from './layout/TopBar';
import { MobileTabs } from './layout/MobileTabs';
import { HexTicker } from './layout/HexTicker';
import { MemoryMapNav } from './sidebar/MemoryMapNav';
import { ViewportCenter } from './viewport/ViewportCenter';
import { AsmStream } from './system/AsmStream';
import { RegistersPanel } from './system/RegistersPanel';
import { StackPanel } from './system/StackPanel';
import { useKonami } from './effects/useKonami';
import { useKeyboard } from './effects/useKeyboard';
import { useHoldAtField } from './effects/useHoldAtField';
import { useScramble } from './effects/useScramble';

function TerminalInner() {
  const {
    asmRef, reticleRef, atFieldRef, sortieRef, tribunalRef,
    corruptRef, topBarRef, emitJmp, flashStatus, triggerAtField,
  } = useNerv();

  const consoleRef = useRef<HTMLDivElement>(null);
  const brandRef   = useRef<HTMLDivElement>(null);
  useScramble(brandRef, '.wm b');

  // Populate wordmark from config on mount
  useEffect(() => {
    const nameEl = document.getElementById('wm-name');
    const roleEl = document.getElementById('wm-role');
    if (nameEl) nameEl.textContent = CONFIG.handle.replace(/^@/, '').toUpperCase() || 'NERV';
    if (roleEl) roleEl.textContent = CONFIG.role;
    document.title = `${CONFIG.handle} // MONITORING TERMINAL`;
  }, []);

  // Corruption easter egg
  useKonami(useCallback(() => { corruptRef.current?.trigger(); }, [corruptRef]));

  // Keyboard navigation
  const inDetail = useCallback(() => {
    return document.getElementById('proj-detail')?.style.display === 'block';
  }, []);
  const closeDetail = useCallback(() => {
    document.dispatchEvent(new Event('nerv:closeDetail'));
  }, []);
  useKeyboard(inDetail, closeDetail);

  // AT field hold gesture
  useHoldAtField(consoleRef);

  return (
    <>
      <AtmosphericFx />
      <Reticle ref={reticleRef} />
      <CorruptOverlay ref={corruptRef} />
      <AtField ref={atFieldRef} />
      <Sortie ref={sortieRef} />
      <Tribunal ref={tribunalRef} />
      <BootScreen />

      <div id="console" ref={consoleRef}>
        <TopBar handle={topBarRef} />
        <MobileTabs />
        <div className="rok0-tag" aria-hidden="true">rok0</div>

        <div className="body">
          <MemoryMapNav />
          <ViewportCenter config={CONFIG} />

          <aside className="right ticks pwr">
            <div className="sec-head">
              <h2>Instruction Stream</h2>
              <span className="jp">命令流</span>
            </div>
            <AsmStream ref={asmRef} />
            <RegistersPanel />
            <StackPanel />
          </aside>
        </div>

        <HexTicker />
      </div>
    </>
  );
}

export function NervTerminal() {
  return (
    <NervProvider>
      <TerminalInner />
    </NervProvider>
  );
}
