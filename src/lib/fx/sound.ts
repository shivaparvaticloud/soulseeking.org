// A soft, beautiful 432 Hz ambient drone — fully synthesised with the Web Audio
// API (no audio file, no network). An open fifth tuned to 432 Hz with gentle
// detune warmth, a low-pass voice and a slow breathing swell. Off by default;
// the visitor enables it (browsers also require a gesture before audio plays).

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let nodes: AudioScheduledSourceNode[] = [];
let on = false;

export function soundIsOn(): boolean {
  return on;
}

export function startSound(): void {
  if (on) return;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AC) return;
  if (!ctx) ctx = new AC();
  if (ctx.state === 'suspended') void ctx.resume();

  master = ctx.createGain();
  master.gain.value = 0.0001;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 1100;
  filter.Q.value = 0.6;
  filter.connect(master);
  master.connect(ctx.destination);

  // octave below · fundamental (432 Hz) · perfect fifth above
  const voices = [
    { f: 216, g: 0.5 },
    { f: 432, g: 0.62 },
    { f: 648, g: 0.32 },
  ];
  nodes = [];
  for (const v of voices) {
    for (const detune of [-4, 4]) {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = v.f;
      osc.detune.value = detune;
      const g = ctx.createGain();
      g.gain.value = v.g * 0.5;
      osc.connect(g);
      g.connect(filter);
      osc.start();
      nodes.push(osc);
    }
  }

  // slow breathing swell on the master
  const lfo = ctx.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.value = 0.06;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 0.018;
  lfo.connect(lfoGain);
  lfoGain.connect(master.gain);
  lfo.start();
  nodes.push(lfo);

  master.gain.setTargetAtTime(0.06, ctx.currentTime, 2.5); // gentle fade-in
  on = true;
}

export function stopSound(): void {
  if (!ctx || !master) {
    on = false;
    return;
  }
  master.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.7); // fade-out
  const toStop = nodes;
  nodes = [];
  on = false;
  setTimeout(() => {
    for (const n of toStop) {
      try { n.stop(); } catch (e) { /* already stopped */ }
    }
  }, 1500);
}
