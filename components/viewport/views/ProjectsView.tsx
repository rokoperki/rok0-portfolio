'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { Project } from '@/lib/types';
import { hx, rnd, rhex } from '@/lib/utils';
import { ASM_OPS, REGS_SOURCE, REGS_DEST } from '@/lib/constants';
import { useNerv } from '@/components/context/NervContext';

interface Props {
  projects: Project[];
  isActive: boolean;
  onDetailOpen: (open: boolean) => void;
}

let disasmAddr = 0x100400;
function mkAddr() { disasmAddr += Math.floor(3 + Math.random() * 4); return hx(disasmAddr, 6).slice(2); }

function buildDisasmLines(p: Project): string[] {
  disasmAddr = 0x100400;
  const lines: string[] = [];
  lines.push(`<span class="dln"><span class="da">${mkAddr()}:</span> <span class="dmn">proc</span> <span class="dcm k">${p.name}  ; PID ${p.pid} · ${p.mem} · ${p.status}</span></span>`);
  p.notes.forEach((n) => {
    const op = rnd(ASM_OPS);
    const regp = `${rnd(REGS_SOURCE)}, ${rnd(REGS_DEST)}`;
    lines.push(`<span class="dln"><span class="da">${mkAddr()}:</span> <span class="dop">${rhex(2).toLowerCase()} ${rhex(2).toLowerCase()}</span> <span class="dmn">${op.trim().padEnd(4)}</span> <span class="dcm">${regp.padEnd(16)} ; ${n}</span></span>`);
  });
  lines.push(`<span class="dln"><span class="da">${mkAddr()}:</span> <span class="dop">e8 ${rhex(2).toLowerCase()}</span> <span class="dmn">call</span> <span class="dcm src">; SRC: <a href="${p.repo}" target="_blank" rel="noopener">${p.repo.replace(/^https?:\/\//, '')}</a></span></span>`);
  lines.push(`<span class="dln"><span class="da">${mkAddr()}:</span> <span class="dop">ff d0</span> <span class="dmn">call</span> <span class="dcm src">; DEMO: <a href="${p.demo}" target="_blank" rel="noopener">${p.demo.replace(/^https?:\/\//, '')}</a></span></span>`);
  lines.push(`<span class="dln"><span class="da">${mkAddr()}:</span> <span class="dop">c3</span> <span class="dmn">ret </span> <span class="dcm">; end of process</span></span>`);
  return lines;
}

// Aim element helpers — direct DOM to avoid React overhead during animation
function startAim() {
  const a = document.getElementById('aim');
  const tg = document.getElementById('aim-tag');
  if (!a) return;
  a.classList.remove('locked');
  if (tg) tg.textContent = 'ACQUIRING';
  a.classList.add('on');
  moveAim();
}

function moveAim() {
  const a = document.getElementById('aim');
  const c = document.querySelector<HTMLElement>('.center');
  if (!a || !c || !a.classList.contains('on')) return;
  const r = c.getBoundingClientRect();
  a.style.left = (r.width * (0.5 + (Math.random() - 0.5) * 0.34)).toFixed(0) + 'px';
  a.style.top = (r.height * (0.48 + (Math.random() - 0.5) * 0.40)).toFixed(0) + 'px';
}

function endAim(onFlash: (text: string, warn: boolean) => void) {
  const a = document.getElementById('aim');
  const c = document.querySelector<HTMLElement>('.center');
  const tg = document.getElementById('aim-tag');
  if (!a || !c) return;
  const r = c.getBoundingClientRect();
  a.style.left = (r.width / 2).toFixed(0) + 'px';
  a.style.top = (r.height * 0.46).toFixed(0) + 'px';
  a.classList.add('locked');
  if (tg) tg.textContent = '● LOCK';
  onFlash('LOCKED', false);
  setTimeout(() => a.classList.remove('on', 'locked'), 620);
}

function clearAim() {
  const a = document.getElementById('aim');
  if (a) a.classList.remove('on', 'locked');
}

export function ProjectsView({ projects, isActive, onDetailOpen }: Props) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const { emitJmp, flashStatus, triggerSortie } = useNerv();

  // Lines are stored in a ref so the useEffect can access them after re-render
  const pendingLinesRef = useRef<string[]>([]);
  const disasmRef   = useRef<HTMLDivElement>(null);
  const writeTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tokenRef    = useRef(0);

  // Trigger sortie when view becomes active
  useEffect(() => {
    if (!isActive) return;
    triggerSortie(null);
  }, [isActive, triggerSortie]);

  const openProject = useCallback((i: number) => {
    const p = projects[i];
    tokenRef.current++;
    if (writeTimer.current) clearTimeout(writeTimer.current);
    clearAim();

    flashStatus('ANALYSIS', true);
    emitJmp(`CALL ${p.pid}   ; ${p.name}`);

    // Build lines and store for the useEffect to consume
    pendingLinesRef.current = buildDisasmLines(p);
    setSelectedIndex(i);
    onDetailOpen(true);
  }, [projects, flashStatus, emitJmp, onDetailOpen]);

  // Start write animation AFTER selectedIndex causes re-render and mounts disasmRef
  useEffect(() => {
    if (selectedIndex === null) return;
    const out = disasmRef.current;
    if (!out) return;

    out.innerHTML = '';
    const outEl = out; // captured non-null
    const lines = pendingLinesRef.current;
    const token = tokenRef.current;
    let idx = 0;

    startAim();

    function write() {
      if (token !== tokenRef.current) return;
      const cur = outEl.querySelector('.cursor-ln');
      if (cur) cur.remove();

      if (idx >= lines.length) {
        endAim(flashStatus);
        return;
      }
      outEl.insertAdjacentHTML('beforeend', lines[idx]);
      outEl.insertAdjacentHTML('beforeend', `<span class="dln cursor-ln"><span class="da">${mkAddr()}:</span> <span class="curblk">█</span></span>`);
      moveAim();
      if (Math.random() < 0.4) emitJmp(`MOV  [${hx(0x1000 + idx, 4)}]`);
      idx++;
      writeTimer.current = setTimeout(write, 230 + Math.random() * 150);
    }

    write();
  }, [selectedIndex, flashStatus, emitJmp]);

  const closeDetail = useCallback(() => {
    tokenRef.current++;
    if (writeTimer.current) clearTimeout(writeTimer.current);
    clearAim();
    setSelectedIndex(null);
    onDetailOpen(false);
  }, [onDetailOpen]);

  // Allow keyboard (Escape) to close detail
  useEffect(() => {
    const handler = () => closeDetail();
    document.addEventListener('nerv:closeDetail', handler);
    return () => document.removeEventListener('nerv:closeDetail', handler);
  }, [closeDetail]);

  const totMem = projects.reduce((a, p) => a + (parseInt(p.mem) || 0), 0);
  const selectedProject = selectedIndex !== null ? projects[selectedIndex] : null;

  return (
    <section className={`view${isActive ? ' active' : ''}`} id="v-projects">
      <div className="view-title">PROCESSES</div>
      <div className="view-sub">PROCESS TABLE <span className="jp">実行中</span></div>

      <div id="proj-list" style={{ display: selectedProject ? 'none' : undefined }}>
        <div className="ps-bar">
          <span>PROC <b id="ps-count">{projects.length}</b></span>
          <span>THREADS <b id="ps-threads">128</b></span>
          <span className="ps-load">LOAD <i><b id="ps-loadbar" /></i> <b id="ps-loadpct">0%</b></span>
          <span>MEM <b id="ps-mem">{totMem}M</b></span>
        </div>
        <table className="ptable">
          <thead>
            <tr>
              <th>PID</th><th>Process</th><th className="th-load">%CPU / %MEM</th><th>Status</th>
            </tr>
          </thead>
          <tbody id="proj-body">
            {projects.map((p, i) => {
              const cls = p.status.startsWith('RUN') ? 'run' : p.status.startsWith('HALT') ? 'halt' : 'sync';
              return (
                <tr className="prow" key={p.pid} onClick={() => openProject(i)}>
                  <td className="pid">{p.pid}</td>
                  <td>
                    <div className="pname">{p.name}</div>
                    <div className="pdesc">{p.desc}</div>
                    <div className="ptags">
                      {p.stack.map((t) => <span className="ptag" key={t}>{t}</span>)}
                    </div>
                  </td>
                  <td className="pload">
                    <div className="lrow">
                      <span className="lk">CPU</span>
                      <i className="lbar"><b className="cpu" data-i={String(i)} data-base={String(p.cpu)} style={{ width: p.cpu + '%' }} /></i>
                      <span className="lv cpuv" data-i={String(i)}>{p.cpu}%</span>
                    </div>
                    <div className="lrow">
                      <span className="lk">MEM</span>
                      <i className="lbar"><b className="mem" style={{ width: p.memPct + '%' }} /></i>
                      <span className="lv">{p.memPct}%</span>
                    </div>
                  </td>
                  <td><span className={`st ${cls}`}>{p.status}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="hint">
          <span className="jp" style={{ color: 'var(--amber)' }}>選択 ·</span>{' '}
          SELECT A PROCESS TO OPEN <b>DISASSEMBLY VIEW</b> · ↑↓ NAVIGATE · ENTER INSPECT
        </div>
      </div>

      {selectedProject && (() => {
        const p = selectedProject;
        const cls = p.status.startsWith('RUN') ? 'run' : p.status.startsWith('HALT') ? 'halt' : 'sync';
        return (
          <div id="proj-detail">
            <button className="backbtn" onClick={closeDetail}>◄ RETURN TO PROCESS TABLE  [ESC]</button>
            <div className="view-sub" style={{ marginBottom: '14px' }}>
              DISASSEMBLY · {p.pid} <span className="jp">逆アセンブル</span>
            </div>
            <div className="phead">
              {([['PID', p.pid], ['STACK', p.stack.join(' · ') || '—'], ['ROLE', p.role || '—'], ['YEAR', p.year || '—'], ['MEM', p.mem]] as [string, string][]).map(([k, v]) => (
                <div className="ph-row" key={k}>
                  <span className="ph-k">{k}</span>
                  <span className="ph-v">{v}</span>
                </div>
              ))}
              <div className="ph-row">
                <span className="ph-k">STATUS</span>
                <span className="ph-v"><span className={`st ${cls}`}>{p.status}</span></span>
              </div>
            </div>
            <div className="pactions">
              <a className="pbtn src" href={p.repo} target="_blank" rel="noopener">▸ VIEW SOURCE</a>
              <a className="pbtn demo" href={p.demo} target="_blank" rel="noopener">▸ OPEN DEMO</a>
            </div>
            <div className="disasm" id="disasm-out" ref={disasmRef} />
          </div>
        );
      })()}
    </section>
  );
}
