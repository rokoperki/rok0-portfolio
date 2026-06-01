'use client';

import { useNerv } from '@/components/context/NervContext';
import { SECTIONS } from '@/lib/constants';

export function MobileTabs() {
  const { active, selectSection } = useNerv();

  return (
    <nav className="mtabs">
      {SECTIONS.map((s, i) => (
        <button
          key={s.id}
          className={active === i ? 'act' : ''}
          onClick={() => selectSection(i)}
        >
          {s.name}
        </button>
      ))}
    </nav>
  );
}
