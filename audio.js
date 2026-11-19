// Procedural Web Audio. Nothing starts until a user gesture calls these.
let ac, an, bins, nb, timer, step = 0, loopOn = false, ambient = false, humG, hum, lastStep = 0;
function ctx() {
  if (!ac) { ac = new (window.AudioContext || window.webkitAudioContext)(); an = ac.createAnalyser(); an.fftSize = 256; bins = new Uint8Array(an.frequencyBinCount); an.connect(ac.destination);
    nb = ac.createBuffer(1, ac.sampleRate, ac.sampleRate); const d = nb.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  if (ac.state === 'suspended') ac.resume(); return ac;
}
const env = (g, t, a, d, v) => { g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + a); g.gain.exponentialRampToValueAtTime(.001, t + a + d); };
function osc(type, f0, f1, t, len, v, cut) {
  const o = ac.createOscillator(), g = ac.createGain(); let n = o; o.type = type; o.frequency.setValueAtTime(f0, t);
  if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + len * .7);
  if (cut) { const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = cut; o.connect(f); n = f; }
  env(g, t, .008, len, v); n.connect(g).connect(an); o.start(t); o.stop(t + len + .05);
}
function hat(t) { const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(); s.buffer = nb; f.type = 'highpass'; f.frequency.value = 7000; env(g, t, .001, .05, .25); s.connect(f).connect(g).connect(an); s.start(t); s.stop(t + .08); }
export function synth(on) {
  ctx(); loopOn = on; clearInterval(timer);
  if (on) { step = 0; timer = setInterval(() => { const t = ac.currentTime + .02;
    if (step % 4 === 0) osc('sine', 140, 40, t, .2, .8); if (step % 2) hat(t);
    if (step % 8 === 0 || step % 8 === 5) osc('sawtooth', [55, 65.4, 73.4, 49][(step >> 3) % 4], 0, t, .22, .35, 600); step++; }, 125); }
  return loopOn;
}
export const isLoop = () => loopOn;
// Four lane levels 0..1 (sub-bass, low, mid, high) from the real analyser.
export function levels() { if (!loopOn || !an) return [0, 0, 0, 0]; an.getByteFrequencyData(bins);
  return [[1, 3], [3, 8], [8, 24], [24, 64]].map(([a, b]) => { let s = 0; for (let i = a; i < b; i++) s += bins[i]; return s / (b - a) / 255; }); }
export function ambience(on) {
  ambient = on; if (!on) { if (humG) humG.gain.value = 0; return; } ctx();
  if (!hum) { hum = ac.createBufferSource(); hum.buffer = nb; hum.loop = true; const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 150; humG = ac.createGain(); hum.connect(f).connect(humG).connect(ac.destination); hum.start(); }
  humG.gain.value = .07;
}
export function footstep() {
  if (!ambient || !ac || performance.now() - lastStep < 200) return; lastStep = performance.now();
  const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(), t = ac.currentTime; s.buffer = nb; f.type = 'lowpass'; f.frequency.value = 380; env(g, t, .004, .09, .18);
  s.connect(f).connect(g).connect(ac.destination); s.start(t, Math.random()); s.stop(t + .12);
}
