export interface Project {
  name: string;
  pid: string;
  mem: string;
  status: string;
  desc: string;
  stack: string[];
  role: string;
  year: string;
  cpu: number;
  memPct: number;
  demo: string;
  repo: string;
  notes: string[];
}

export interface UnitPart {
  name: string;
  status: string;
}

export interface UnitTag {
  k: string;
  v: string;
}

export interface BioLayer {
  id: string;
  name: string;
  sub: string;
  status: string;
}

export interface AboutMeta {
  k: string;
  v: string;
}

export interface ContactInfo {
  email: string;
  github: string;
  x: string;
  discord: string;
}

export interface ClassifiedInfo {
  directLine: string;
  resumeUrl: string;
  resumeName: string;
  note: string;
}

export interface Config {
  name: string;
  handle: string;
  role: string;
  about: string;
  aboutMeta: AboutMeta[];
  projects: Project[];
  contact: ContactInfo;
  unitLabel: string;
  unitParts: UnitPart[];
  unitChecks: string[];
  unitTags: UnitTag[];
  bioLayers: BioLayer[];
  casper: string;
  classified: ClassifiedInfo;
}

export type SectionId = 'about' | 'projects' | 'contact';

export interface Section {
  id: SectionId;
  name: string;
  jp: string;
  addr: number;
  view: string;
  color: string;
  alloc: number;
}

export interface AsmHandle {
  appendLine: (html: string) => void;
  appendJmp: (text: string) => void;
}

export interface ReticleHandle {
  trigger: () => void;
}

export interface AtFieldHandle {
  trigger: (cx?: number, cy?: number) => void;
}

export interface SortieHandle {
  run: (done?: (() => void) | null) => void;
}

export interface TribunalHandle {
  run: (query: string, cb: ((ok: boolean) => void) | null, forceOk: boolean) => void;
}

export interface MagiHandle {
  setAuthed: (on: boolean) => void;
}

export interface CorruptHandle {
  trigger: () => void;
}

export interface TopBarHandle {
  flashStatus: (text: string, warn: boolean) => void;
  boostSync: () => void;
}
