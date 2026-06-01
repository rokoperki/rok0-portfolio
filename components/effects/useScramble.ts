import { useEffect, useRef } from 'react';
import { b58target, scrambleStep } from '@/lib/utils';

type ScramEl = HTMLElement & { _scramClean?: () => void; _scramOrig?: string };

function attachScramble(el: ScramEl) {
  const orig = el.textContent ?? '';
  if (!orig.trim()) return;

  // Clean up any previous attachment
  if (el._scramClean) el._scramClean();

  const target = b58target(orig);
  const STEPS = 7;
  let timer: ReturnType<typeof setInterval> | null = null;

  function run(to: string) {
    if (timer) clearInterval(timer);
    let step = 0;
    timer = setInterval(() => {
      step++;
      el.textContent = scrambleStep(orig, to, step, STEPS);
      if (step >= STEPS) {
        if (timer) clearInterval(timer);
        el.textContent = to;
      }
    }, 28);
  }

  const onEnter = () => run(target);
  const onLeave = () => run(orig);

  el.addEventListener('mouseenter', onEnter);
  el.addEventListener('mouseleave', onLeave);

  el._scramOrig = orig;
  el._scramClean = () => {
    el.removeEventListener('mouseenter', onEnter);
    el.removeEventListener('mouseleave', onLeave);
    if (timer) clearInterval(timer);
    delete el._scramClean;
    delete el._scramOrig;
  };
}

export function useScramble(
  containerRef: React.RefObject<HTMLElement | null>,
  selector: string,
) {
  // Use null initial value (safe across React versions) and init lazily
  const attachedRef = useRef<Set<Element> | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Lazy-init the set on first effect run (avoids React 19 useRef init issues)
    if (!attachedRef.current) {
      attachedRef.current = new Set<Element>();
    }
    const attached = attachedRef.current;

    container.querySelectorAll<ScramEl>(selector).forEach((el) => {
      const currentText = el.textContent ?? '';
      if (!currentText.trim()) return;

      // Re-attach if new element, or if text changed since last attachment
      if (!attached.has(el) || el._scramOrig !== currentText) {
        attached.add(el);
        attachScramble(el);
      }
    });
  });
}
