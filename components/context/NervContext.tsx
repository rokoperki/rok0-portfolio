'use client';

import {
  createContext, useContext, useRef, useCallback, useState, useEffect,
  type ReactNode, type RefObject,
} from 'react';
import { useNavState } from './useNavState';
import type {
  AsmHandle, ReticleHandle, AtFieldHandle, SortieHandle,
  TribunalHandle, MagiHandle, CorruptHandle, TopBarHandle,
} from '@/lib/types';

interface NervContextValue {
  // Navigation
  active: number;
  cursor: number;
  selectSection: (i: number) => void;
  setCursor: (i: number) => void;

  // Boot
  bootDone: boolean;
  onBootDone: () => void;

  // Imperative overlay refs (set by child components on mount)
  asmRef: RefObject<AsmHandle | null>;
  reticleRef: RefObject<ReticleHandle | null>;
  atFieldRef: RefObject<AtFieldHandle | null>;
  sortieRef: RefObject<SortieHandle | null>;
  tribunalRef: RefObject<TribunalHandle | null>;
  magiRef: RefObject<MagiHandle | null>;
  corruptRef: RefObject<CorruptHandle | null>;
  topBarRef: RefObject<TopBarHandle | null>;

  // Stable convenience wrappers (call the refs above)
  emitJmp: (text: string) => void;
  flashStatus: (text: string, warn: boolean) => void;
  triggerAtField: (cx?: number, cy?: number) => void;
  triggerReticle: () => void;
  triggerSortie: (done?: (() => void) | null) => void;
  triggerTribunal: (query: string, cb: ((ok: boolean) => void) | null, forceOk: boolean) => void;
  boostSync: () => void;

  // Auth
  isAuthed: boolean;
  setAuthed: (on: boolean) => void;

  // Sound
  soundOn: boolean;
  setSoundOn: (on: boolean) => void;
}

const NervContext = createContext<NervContextValue | null>(null);

export function NervProvider({ children }: { children: ReactNode }) {
  const { active, cursor, selectSection, setCursor } = useNavState();
  const [bootDone, setBootDone] = useState(false);
  const [isAuthed, setAuthed] = useState(false);
  const [soundOn, setSoundOn] = useState(false);

  // Overlay + panel refs — set by child components via useImperativeHandle
  const asmRef     = useRef<AsmHandle | null>(null);
  const reticleRef = useRef<ReticleHandle | null>(null);
  const atFieldRef = useRef<AtFieldHandle | null>(null);
  const sortieRef  = useRef<SortieHandle | null>(null);
  const tribunalRef = useRef<TribunalHandle | null>(null);
  const magiRef    = useRef<MagiHandle | null>(null);
  const corruptRef = useRef<CorruptHandle | null>(null);
  const topBarRef  = useRef<TopBarHandle | null>(null);

  const onBootDone = useCallback(() => setBootDone(true), []);

  const emitJmp = useCallback((text: string) => {
    asmRef.current?.appendJmp(text);
  }, []);

  const flashStatus = useCallback((text: string, warn: boolean) => {
    topBarRef.current?.flashStatus(text, warn);
  }, []);

  const triggerAtField = useCallback((cx?: number, cy?: number) => {
    atFieldRef.current?.trigger(cx, cy);
  }, []);

  const triggerReticle = useCallback(() => {
    reticleRef.current?.trigger();
  }, []);

  const triggerSortie = useCallback((done?: (() => void) | null) => {
    sortieRef.current?.run(done);
  }, []);

  const triggerTribunal = useCallback(
    (query: string, cb: ((ok: boolean) => void) | null, forceOk: boolean) => {
      tribunalRef.current?.run(query, cb, forceOk);
    },
    [],
  );

  const boostSync = useCallback(() => {
    topBarRef.current?.boostSync();
  }, []);

  // Sync MAGI authed state with panel
  useEffect(() => {
    magiRef.current?.setAuthed(isAuthed);
  }, [isAuthed]);

  const value: NervContextValue = {
    active, cursor, selectSection, setCursor,
    bootDone, onBootDone,
    asmRef, reticleRef, atFieldRef, sortieRef, tribunalRef, magiRef, corruptRef, topBarRef,
    emitJmp, flashStatus, triggerAtField, triggerReticle, triggerSortie, triggerTribunal, boostSync,
    isAuthed, setAuthed,
    soundOn, setSoundOn,
  };

  return <NervContext.Provider value={value}>{children}</NervContext.Provider>;
}

export function useNerv(): NervContextValue {
  const ctx = useContext(NervContext);
  if (!ctx) throw new Error('useNerv must be used inside NervProvider');
  return ctx;
}
