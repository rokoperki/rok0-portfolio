'use client';

import { useEffect, useImperativeHandle, useRef, type Ref } from 'react';
import { MNEMS } from '@/lib/constants';
import { hx, rnd, rhex } from '@/lib/utils';
import type { AsmHandle } from '@/lib/types';

const MAX_LINES = 90;
let asmAddr = 0x401000;

function makeLineEl(mn: string, opnd: string, cls = ''): HTMLDivElement {
  asmAddr += 3 + Math.floor(Math.random() * 5);
  const el = document.createElement('div');
  el.className = 'ln ' + cls;
  el.innerHTML = `<span class="a">${hx(asmAddr, 6).slice(2)}</span> <span class="op">${rhex(2).toLowerCase()} ${rhex(2).toLowerCase()}</span> <span class="mn">${mn}</span> ${opnd ? `<span class="cm">${opnd}</span>` : ''}`;
  return el;
}

function makeJmpEl(text: string): HTMLDivElement {
  asmAddr += 4;
  const el = document.createElement('div');
  el.className = 'ln jmp';
  el.innerHTML = `<span class="a">${hx(asmAddr, 6).slice(2)}</span> <span class="mn">${text}</span>`;
  return el;
}

function appendToBox(box: HTMLDivElement, el: HTMLElement) {
  box.appendChild(el);
  while (box.children.length > MAX_LINES) box.removeChild(box.firstChild!);
  box.scrollTop = box.scrollHeight;
}

export function AsmStream({ ref }: { ref?: Ref<AsmHandle> }) {
  const boxRef  = useRef<HTMLDivElement>(null);
  const cycRef  = useRef<HTMLSpanElement>(null);
  const lbRef   = useRef<HTMLElement>(null);
  const lpRef   = useRef<HTMLElement>(null);
  const regRefs = useRef<HTMLSpanElement[]>([]);

  useImperativeHandle(ref, () => ({
    appendLine(html: string) {
      const box = boxRef.current;
      if (!box) return;
      const el = document.createElement('div');
      el.innerHTML = html;
      if (el.firstChild) appendToBox(box, el.firstChild as HTMLElement);
    },
    appendJmp(text: string) {
      const box = boxRef.current;
      if (!box) return;
      appendToBox(box, makeJmpEl(text));
    },
  }));

  // Seed + tick ASM stream
  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const boxEl = box;

    function tick() {
      const roll = Math.random();
      let el: HTMLDivElement;
      if (roll < 0.09)       el = makeLineEl('INT', '0x80', 'irq');
      else if (roll < 0.15)  el = makeLineEl('SYSCALL', '', 'irq');
      else if (roll < 0.19)  el = makeLineEl('IRQ', hx(Math.floor(Math.random() * 16)), 'irq');
      else { const [m, o] = rnd(MNEMS); el = makeLineEl(m, o); }
      appendToBox(boxEl, el);
    }

    for (let i = 0; i < 24; i++) tick();
    const id = setInterval(tick, 80);
    return () => clearInterval(id);
  }, []);

  // Live load / cycle counter
  useEffect(() => {
    let cycVal = 0, loadVal = 42;
    const id = setInterval(() => {
      cycVal = (cycVal + 3000 + Math.floor(Math.random() * 9000)) >>> 0;
      if (cycRef.current) cycRef.current.textContent = '0x' + cycVal.toString(16).toUpperCase().padStart(7, '0');
      loadVal += (Math.random() - 0.5) * 26;
      loadVal = Math.max(8, Math.min(96, loadVal));
      const pct = loadVal.toFixed(0) + '%';
      if (lbRef.current) (lbRef.current as HTMLElement).style.width = pct;
      if (lpRef.current) lpRef.current.textContent = pct;

      const psLb = document.getElementById('ps-loadbar') as HTMLElement | null;
      const psLp = document.getElementById('ps-loadpct');
      if (psLb) psLb.style.width = pct;
      if (psLp) psLp.textContent = pct;

      document.querySelectorAll<HTMLElement>('#proj-body .cpu').forEach((b) => {
        const base = parseInt(b.dataset.base ?? '0');
        if (base <= 6) return;
        const j = Math.max(2, Math.min(99, base + (Math.random() - 0.5) * 18));
        b.style.width = j.toFixed(0) + '%';
        const lv = document.querySelector<HTMLElement>(`#proj-body .cpuv[data-i="${b.dataset.i}"]`);
        if (lv) lv.textContent = j.toFixed(0) + '%';
      });
    }, 460);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <div className="asm" id="asm" ref={boxRef} />
      <div className="asm-foot">
        <span className="cyc">CYC <b id="cyc" ref={cycRef}>0x0000000</b></span>
        <span className="ld">LOAD <i className="ldbar"><b id="ldbar" ref={lbRef as React.RefObject<HTMLElement>} /></i> <b id="ldpct" ref={lpRef as React.RefObject<HTMLElement>}>0%</b></span>
      </div>
    </>
  );
}
