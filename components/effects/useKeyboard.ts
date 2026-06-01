import { useEffect, useRef } from 'react';
import { SECTIONS } from '@/lib/constants';
import { useNerv } from '@/components/context/NervContext';

export function useKeyboard(inProjectDetail: () => boolean, onCloseDetail: () => void) {
  const { bootDone, active, cursor, selectSection, setCursor, triggerReticle, boostSync, triggerAtField, triggerTribunal, emitJmp } = useNerv();
  const typeBufRef = useRef('');

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (!bootDone) return;

      // Typed keywords (ignore when typing in inputs)
      const tag = (e.target as HTMLElement).tagName;
      if (tag !== 'INPUT' && tag !== 'TEXTAREA' && e.key.length === 1) {
        typeBufRef.current = (typeBufRef.current + e.key.toLowerCase()).slice(-8);
        if (typeBufRef.current.endsWith('sync')) boostSync();
        if (typeBufRef.current.endsWith('nerv')) triggerReticle();
        if (typeBufRef.current.endsWith('magi')) triggerTribunal('MANUAL INQUIRY', null, false);
        if (typeBufRef.current.endsWith('atf')) triggerAtField();
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setCursor(cursor + 1);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setCursor(cursor - 1);
          break;
        case 'Enter':
          e.preventDefault();
          selectSection(cursor);
          emitJmp(`JMP 0x${SECTIONS[cursor].addr.toString(16).toUpperCase().padStart(4, '0')}   ; ${SECTIONS[cursor].name}`);
          break;
        case 'Escape':
          if (inProjectDetail()) {
            onCloseDetail();
          } else {
            selectSection(0);
          }
          break;
      }
    }

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [bootDone, active, cursor, selectSection, setCursor, triggerReticle, boostSync, triggerAtField, triggerTribunal, emitJmp, inProjectDetail, onCloseDetail]);
}
