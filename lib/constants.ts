import type { Section } from './types';

export const SECTIONS: Section[] = [
  { id: 'about',    name: 'ABOUT',    jp: '人物', addr: 0x0000, view: 'v-about',    color: '#ffae3b', alloc: 34 },
  { id: 'projects', name: 'PROJECTS', jp: '実行', addr: 0x1000, view: 'v-projects', color: '#ff3b1f', alloc: 44 },
  { id: 'contact',  name: 'CONTACT',  jp: '通信', addr: 0x2000, view: 'v-contact',  color: '#ff6a00', alloc: 22 },
];

export const BOOT_LINES: [string, string][] = [
  ['MAGI BIOS v9.21  ·  POWER-ON SELF TEST', 'ok'],
  ['copyright (c) overseer systems — all channels monitored', 'dim'],
  ['', 'dim'],
  ['[ 0.0001 ] cpu0: vector table mapped @ 0x00000000', 'dim'],
  ['[ 0.0009 ] cpu0: 16 cores online, microcode rev 0x4d', 'dim'],
  ['[ 0.0024 ] mem: probing ............ 4096 MB OK', 'dim'],
  ['[ 0.0041 ] mem: ECC scrub pass 1/1 ... \x01OK', 'ok'],
  ['[ 0.0067 ] dma: channels 0-7 online', 'dim'],
  ['[ 0.0083 ] pci: enumerating bus 00 ... 11 devices', 'dim'],
  ['[ 0.0098 ] clock: TSC calibrated @ 3.49 GHz', 'dim'],
  ['[ 0.0124 ] bus: handshake .......... \x01OK', 'ok'],
  ['[ 0.0151 ] crypto: entropy pool seeded (256 bit)', 'dim'],
  ['[ 0.0188 ] mounting /dev/core ...... \x01OK', 'ok'],
  ['[ 0.0210 ] mounting /dev/memmap .... \x01OK', 'ok'],
  ['[ 0.0244 ] fsck /dev/core: clean, 0 errors', 'dim'],
  ['[ 0.0281 ] loading instruction stream', 'dim'],
  ['[ 0.0312 ] decoder: x86-64 long mode engaged', 'dim'],
  ['[ 0.0331 ] WARN: sync rate below threshold (99.97%)', 'warn'],
  ['[ 0.0360 ] recalibrating neural link ...', 'dim'],
  ['[ 0.0402 ] neural link: phase lock ... \x01OK', 'ok'],
  ['[ 0.0451 ] unit-01: operating parts diagnostic', 'dim'],
  ['[ 0.0488 ] unit-01: 9 nominal / 5 flagged', 'warn'],
  ['[ 0.0510 ] decrypting dossier @ 0x0000', 'dim'],
  ['[ 0.0559 ] dossier: AES-256 ........ \x01OK', 'ok'],
  ['[ 0.0602 ] process table populated: 3 procs', 'dim'],
  ['[ 0.0641 ] registers loaded (RAX..R15)', 'dim'],
  ['[ 0.0688 ] stack: guard pages armed', 'dim'],
  ['[ 0.0712 ] comms link armed (4 channels)', 'dim'],
  ['[ 0.0759 ] wallet bridge: scanning injected providers', 'dim'],
  ['[ 0.0801 ] pattern waveform: streaming', 'dim'],
  ['[ 0.0844 ] MAGI consensus: 3/3 ...... \x01OK', 'ok'],
  ['', 'dim'],
  ['POST COMPLETE — awaiting operator authorization', 'hot'],
];

export const BOOT_PROCEED_LINES: [string, string][] = [
  ['> AUTHORIZATION ACCEPTED — overseer verified', 'ok'],
  ['[ 0.0900 ] handing operator control', 'dim'],
  ['', 'dim'],
  ['SYSTEM ONLINE', 'hot'],
];

export const MNEMS: [string, string][] = [
  ['MOV', 'rax, [rbx+0x10]'], ['PUSH', 'rbp'], ['POP', 'rdi'], ['CALL', '0x401a20'],
  ['LEA', 'rsi, [rip+0x2f0]'], ['XOR', 'ecx, ecx'], ['ADD', 'rsp, 0x28'], ['CMP', 'eax, 0x1'],
  ['JNE', '0x4012f0'], ['TEST', 'al, al'], ['INT', '0x80'], ['SYSCALL', ''], ['AND', 'r9, 0xff'],
  ['SHL', 'rdx, 0x3'], ['MOVZX', 'eax, byte [rdi]'], ['RET', ''], ['NOP', ''], ['INC', 'rcx'],
  ['SUB', 'rax, rdx'], ['OR', 'r8d, r8d'], ['IMUL', 'rax, 0x21'], ['DEC', 'rsi'],
];

export const REGNAMES = ['RAX', 'RBX', 'RCX', 'RDX', 'RSI', 'RDI', 'RIP', 'RSP', 'RBP', 'R8'];

export const KONAMI = [
  'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
  'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
];

export const ASM_OPS = ['push', 'mov ', 'lea ', 'call', 'xor ', 'add ', 'cmp ', 'jne ', 'test', 'ret '];

export const REGS_SOURCE = ['rax', 'rbx', 'rdi', 'rsi', 'rdx'];
export const REGS_DEST   = ['rbp', 'rsp', '[rip]', '0x10', 'r8'];
