type OscType = "square" | "triangle" | "sawtooth" | "sine";

class SoundEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private hum: { o: OscillatorNode; g: GainNode } | null = null;
  on = false;

  private init() {
    if (this.ctx) return;
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.16;
    this.master.connect(this.ctx.destination);
  }

  enable(state: boolean) {
    this.on = state;
    try {
      localStorage.setItem("nerv-snd", state ? "1" : "0");
    } catch {}
    if (state) {
      this.init();
      if (this.ctx?.state === "suspended") this.ctx.resume();
      this.startHum();
      this.blip(660, 0.05, "triangle", 0.4);
    } else {
      this.stopHum();
    }
  }

  blip(freq = 600, dur = 0.05, type: OscType = "square", g = 0.5) {
    if (!this.on || !this.ctx || !this.master) return;
    const o = this.ctx.createOscillator();
    const gn = this.ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    o.connect(gn);
    gn.connect(this.master);
    const t = this.ctx.currentTime;
    gn.gain.setValueAtTime(0.0001, t);
    gn.gain.exponentialRampToValueAtTime(g, t + 0.006);
    gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.start(t);
    o.stop(t + dur + 0.03);
  }

  nav() {
    this.blip(520, 0.035, "square", 0.32);
  }
  confirm() {
    [0, 70, 150].forEach((d, i) =>
      setTimeout(
        () => this.blip([440, 660, 880][i], 0.08, "triangle", 0.45),
        d,
      ),
    );
  }
  deny() {
    this.blip(220, 0.13, "sawtooth", 0.5);
    setTimeout(() => this.blip(150, 0.18, "sawtooth", 0.5), 90);
  }
  alarm(times = 5) {
    for (let i = 0; i < times; i++) {
      setTimeout(() => this.blip(900, 0.16, "square", 0.4), i * 300);
      setTimeout(() => this.blip(470, 0.16, "square", 0.4), i * 300 + 150);
    }
  }

  private startHum() {
    if (!this.ctx || !this.master || this.hum) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = "sine";
    o.frequency.value = 56;
    g.gain.value = 0.05;
    o.connect(g);
    g.connect(this.master);
    o.start();
    this.hum = { o, g };
  }

  private stopHum() {
    if (this.hum) {
      try {
        this.hum.o.stop();
      } catch {}
      this.hum = null;
    }
  }

  loadPreference(): boolean {
    try {
      return localStorage.getItem("nerv-snd") === "1";
    } catch {
      return false;
    }
  }
}

export const Sound = new SoundEngine();
