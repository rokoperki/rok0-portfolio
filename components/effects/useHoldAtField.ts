import { useEffect, useRef } from 'react';
import { useNerv } from '@/components/context/NervContext';
import { Sound } from '@/lib/sound';

interface HoldState {
  active: boolean;
  charge: number;
  x: number;
  y: number;
  sx: number;
  sy: number;
  armTimer: ReturnType<typeof setTimeout> | null;
  drawTimer: ReturnType<typeof setInterval> | null;
}

// Draws the "charging" hex field around the cursor while the user holds
function holdHexDraw(state: HoldState) {
  const cv = document.getElementById('atfield') as HTMLCanvasElement | null;
  if (!cv) return;
  const ctx = cv.getContext('2d');
  if (!ctx) return;
  if (cv.width !== window.innerWidth) cv.width = window.innerWidth;
  if (cv.height !== window.innerHeight) cv.height = window.innerHeight;
  const w = cv.width, h = cv.height;
  cv.classList.add('show');
  ctx.clearRect(0, 0, w, h);

  const c = Math.min(1, state.charge);
  const hr = 30, dx = hr * 1.5, dy = hr * Math.sqrt(3), maxR = 120 + c * 240;

  function hex(hx: number, hy: number, r: number) {
    ctx!.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i;
      const px = hx + r * Math.cos(a), py = hy + r * Math.sin(a);
      i ? ctx!.lineTo(px, py) : ctx!.moveTo(px, py);
    }
    ctx!.closePath();
  }

  const colStart = Math.floor((state.x - maxR) / dx);
  const rowStart = Math.floor((state.y - maxR) / dy);
  for (let col = colStart; col * dx <= state.x + maxR; col++) {
    const hxPos = col * dx;
    for (let row = rowStart; row * dy <= state.y + maxR; row++) {
      const hyPos = row * dy + (col % 2 ? dy / 2 : 0);
      const d = Math.hypot(hxPos - state.x, hyPos - state.y);
      if (d > maxR) continue;
      const prox = (1 - d / maxR) * c;
      if (prox <= 0.03) continue;
      hex(hxPos, hyPos, hr - 3);
      ctx.fillStyle = `rgba(255,120,40,${(prox * 0.20).toFixed(3)})`;
      ctx.fill();
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = `rgba(255,${150 + Math.floor(70 * prox)},70,${(prox * 0.9).toFixed(3)})`;
      ctx.stroke();
    }
  }

  // Bright core hex
  hex(state.x, state.y, 18 + c * 10);
  ctx.lineWidth = 2;
  ctx.strokeStyle = `rgba(255,210,120,${(0.5 + c * 0.5).toFixed(2)})`;
  ctx.stroke();
}

export function useHoldAtField(stageRef: React.RefObject<HTMLElement | null>) {
  const { bootDone, triggerAtField, flashStatus, emitJmp } = useNerv();
  const holdRef = useRef<HoldState>({
    active: false, charge: 0, x: 0, y: 0, sx: 0, sy: 0,
    armTimer: null, drawTimer: null,
  });

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    function holdArm(x: number, y: number) {
      const s = holdRef.current;
      s.sx = x; s.sy = y; s.x = x; s.y = y;
      s.armTimer = setTimeout(() => holdStart(x, y), 240);
    }

    function holdStart(_x: number, _y: number) {
      const s = holdRef.current;
      if (s.active) return;
      s.active = true;
      s.charge = 0;
      const lab = document.getElementById('atf-hold');
      if (lab) lab.classList.add('show');
      flashStatus('A.T. FIELD', true);
      Sound.blip(140, 0.18, 'sine', 0.4);

      s.drawTimer = setInterval(() => {
        s.charge = Math.min(1, s.charge + 0.045);
        holdHexDraw(s);

        const lab = document.getElementById('atf-hold');
        if (lab) {
          lab.style.left = s.x + 'px';
          lab.style.top = (s.y - 90) + 'px';
          const b = lab.querySelector<HTMLElement>('.atf-meter b');
          if (b) b.style.width = (s.charge * 100).toFixed(0) + '%';
        }

        if (s.charge >= 1 && Sound.on && Math.random() < 0.06) {
          Sound.blip(880, 0.03, 'triangle', 0.15);
        }
      }, 40);
    }

    function holdEnd() {
      const s = holdRef.current;
      if (s.armTimer) { clearTimeout(s.armTimer); s.armTimer = null; }
      const lab = document.getElementById('atf-hold');
      if (lab) lab.classList.remove('show');
      if (!s.active) return;

      const charged = s.charge;
      if (s.drawTimer) { clearInterval(s.drawTimer); s.drawTimer = null; }
      s.active = false;

      // Clear canvas residue
      const cv = document.getElementById('atfield') as HTMLCanvasElement | null;
      if (cv) {
        const ctx = cv.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, cv.width, cv.height);
      }

      if (charged > 0.4) {
        triggerAtField(s.x, s.y);
        emitJmp('CALL at_field   ; BARRIER DEPLOYED');
      } else {
        const cv2 = document.getElementById('atfield') as HTMLCanvasElement | null;
        if (cv2) cv2.classList.remove('show');
      }
    }

    function onPointerDown(e: PointerEvent) {
      if (!bootDone) return;
      const target = e.target as HTMLElement;
      if (target.closest('a,button,input,textarea,select,[role=button],#sortie,#tribunal')) return;
      holdArm(e.clientX, e.clientY);
    }

    function onPointerMove(e: PointerEvent) {
      const s = holdRef.current;
      if (s.active) { s.x = e.clientX; s.y = e.clientY; return; }
      if (s.armTimer && Math.hypot(e.clientX - s.sx, e.clientY - s.sy) > 10) {
        clearTimeout(s.armTimer);
        s.armTimer = null;
      }
    }

    stage.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', holdEnd);
    window.addEventListener('pointercancel', holdEnd);

    return () => {
      stage.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', holdEnd);
      window.removeEventListener('pointercancel', holdEnd);
    };
  }, [bootDone, triggerAtField, flashStatus, emitJmp, stageRef]);
}
