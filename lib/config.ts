import type { Config } from './types';

export const CONFIG: Config = {
  name:   '[YOUR NAME]',
  handle: '@YOURHANDLE',
  role:   '[YOUR ROLE, e.g. Solana / web3 developer]',

  about:
    '[2–3 SENTENCE BIO] — e.g. Systems-minded engineer building on-chain tooling and low-latency infrastructure. I like protocols, performance budgets, and interfaces that tell you exactly what the machine is doing.',

  aboutMeta: [
    { k: 'Class',     v: 'Engineer / Operator' },
    { k: 'Base',      v: '[CITY, REGION]' },
    { k: 'Uptime',    v: '7y 142d' },
    { k: 'Clearance', v: 'OVERSEER' },
  ],

  projects: [
    {
      name: '[PROJECT 1 NAME]', pid: '0x1A4F', mem: '412 MB', status: 'RUNNING',
      desc: '[ONE-LINE DESCRIPTION]',
      stack: ['RUST', 'ANCHOR', 'REACT'], role: 'LEAD', year: '2024',
      cpu: 74, memPct: 62,
      demo: 'https://demo.example.com',
      repo: 'https://github.com/you/project-one',
      notes: [
        'boots a real-time settlement engine on a single core',
        'handles 12k tx/s sustained; zero dropped frames in soak test',
        'outcome: cut median confirmation latency from 900ms to 110ms',
      ],
    },
    {
      name: '[PROJECT 2 NAME]', pid: '0x2B7C', mem: '96 MB', status: 'SYNC 99.9%',
      desc: '[ONE-LINE DESCRIPTION]',
      stack: ['TS', 'NODE', 'POSTGRES'], role: 'AUTHOR', year: '2023',
      cpu: 38, memPct: 44,
      demo: 'https://demo.example.com',
      repo: 'https://github.com/you/project-two',
      notes: [
        'indexer + query layer over an append-only event log',
        'schema-on-read; backfills 4 years of history in under an hour',
        'outcome: powers 3 production dashboards and a public API',
      ],
    },
    {
      name: '[PROJECT 3 NAME]', pid: '0x3D90', mem: '38 MB', status: 'HALTED',
      desc: '[ONE-LINE DESCRIPTION]',
      stack: ['C', 'PROTOBUF'], role: 'AUTHOR', year: '2022',
      cpu: 6, memPct: 12,
      demo: 'https://demo.example.com',
      repo: 'https://github.com/you/project-three',
      notes: [
        'experimental client for a custom binary wire protocol',
        'archived after the spec was superseded — kept for reference',
        'outcome: shipped the codec as a standalone, still-used library',
      ],
    },
  ],

  contact: {
    email:   'you@example.com',
    github:  'https://github.com/you',
    x:       'https://x.com/yourhandle',
    discord: 'yourhandle',
  },

  unitLabel: 'UNIT 01',

  unitParts: [
    { name: 'SMART CONTRACTS',  status: 'OPERATING' },
    { name: 'RUST / ANCHOR',    status: 'OPERATING' },
    { name: 'FRONTEND / REACT', status: 'OPERATING' },
    { name: 'PROTOCOL DESIGN',  status: 'OPERATING' },
    { name: 'INDEXING / DATA',  status: 'OPERATING' },
    { name: 'SECURITY / AUDIT', status: 'SYNC 94%' },
    { name: 'DEVOPS / CI',      status: 'OPERATING' },
    { name: 'DESIGN SYSTEMS',   status: 'OPERATING' },
    { name: 'TESTING / FUZZ',   status: 'OPERATING' },
    { name: 'DOCS / DX',        status: 'DEGRADED' },
    { name: 'ML / AI',          status: 'DORMANT' },
    { name: 'NATIVE / MOBILE',  status: 'DORMANT' },
  ],

  unitChecks: ['NEOVIM', 'TS / NODE', 'FOUNDRY', 'DOCKER', 'GH ACTIONS', 'SOLANA CLI'],

  unitTags: [
    { k: 'AVAILABILITY', v: 'OPEN TO WORK' },
    { k: 'TIMEZONE',     v: 'UTC+01 · CET' },
    { k: 'HARMONICS',    v: 'STABLE' },
  ],

  bioLayers: [
    { id: '005', name: 'INTERFACE', sub: 'REACT · CSS · CANVAS', status: 'OPERATING' },
    { id: '006', name: 'LOGIC',     sub: 'TYPESCRIPT · RUST',    status: 'OPERATING' },
    { id: '007', name: 'PROTOCOL',  sub: 'ANCHOR · SPL',         status: 'OPERATING' },
    { id: '008', name: 'STORAGE',   sub: 'POSTGRES · REDIS',     status: 'OPERATING' },
    { id: '009', name: 'INDEXER',   sub: 'GEYSER · GRPC',        status: 'SYNC 99%' },
    { id: '010', name: 'NETWORK',   sub: 'RPC · WEBSOCKET',      status: 'OPERATING' },
    { id: '011', name: 'INFRA',     sub: 'DOCKER · TERRAFORM',   status: 'OPERATING' },
  ],

  casper: 'CASPER',

  classified: {
    directLine: 'signal · @your-handle.01',
    resumeUrl:  'files/classified-dossier.pdf',
    resumeName: 'DOWNLOAD CLASSIFIED FILE',
    note: 'If you authenticated to read this, you already think like an operator. Open with the phrase "PATTERN BLUE" and you\'ll get a reply within the hour.',
  },
};
