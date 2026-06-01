'use client';

import { useImperativeHandle, type Ref } from 'react';
import type { CorruptHandle } from '@/lib/types';
import { rhex } from '@/lib/utils';
import { useNerv } from '@/components/context/NervContext';
import { Sound } from '@/lib/sound';

export function CorruptOverlay({ ref }: { ref?: Ref<CorruptHandle> }) {
  const { flashStatus, triggerAtField, emitJmp } = useNerv();

  useImperativeHandle(ref, () => ({
    trigger() {
      if (document.body.classList.contains('corrupt')) return;
      flashStatus('CRITICAL', true);
      document.body.classList.add('corrupt');
      triggerAtField();
      Sound.alarm(5);
      emitJmp('INT 0x06   ; INVALID OPCODE');

      const targets = [
        ...document.querySelectorAll<HTMLElement>(
          '#vp .view.active .bio, #vp .view.active .pname, #vp .view.active .pdesc, .navitem .nm, #ticker span .hx'
        ),
      ];
      const saved = targets.map((t) => t.textContent ?? '');
      let g = 0;
      const gt = setInterval(() => {
        targets.forEach((t) => {
          t.textContent = (t.textContent ?? '').split('').map((c) => c.trim() ? rhex(1) : c).join('');
        });
        g++;
        if (g > 12) {
          clearInterval(gt);
          targets.forEach((t, i) => { t.textContent = saved[i]; });
          document.body.classList.remove('corrupt');
          emitJmp('JMP recovery   ; STATE RESTORED');
          flashStatus('RECOVERED', false);
        }
      }, 90);
    },
  }));

  return (
    <>
      <div id="corrupt-overlay" />
      <div className="corrupt-banner">
        <div className="big">MEMORY CORRUPTION DETECTED</div>
        <div className="jp">警告 // SEGMENTATION FAULT</div>
      </div>
    </>
  );
}
