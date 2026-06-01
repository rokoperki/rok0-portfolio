import { useEffect, useRef } from 'react';
import { KONAMI } from '@/lib/constants';

export function useKonami(onActivate: () => void) {
  const bufRef = useRef<string[]>([]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      bufRef.current.push(e.key);
      if (bufRef.current.length > KONAMI.length) bufRef.current.shift();
      if (bufRef.current.join(',') === KONAMI.join(',')) {
        bufRef.current = [];
        onActivate();
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onActivate]);
}
