import * as THREE from 'three';
import { C } from './content.js';
import { addBox } from './collision.js';
import * as audio from './audio.js';
const H = '"Bahnschrift","Arial Narrow","Roboto Condensed","Helvetica Neue",Arial,sans-serif', M = 'ui-monospace,Menlo,Consolas,monospace', ACC = '#ff5a1f', U = 180;
const Lm = c => new THREE.MeshLambertMaterial({ color: c }), Bm = c => new THREE.MeshBasicMaterial({ color: c });
const mat = { wall: Lm(0xb7b2a7), ply: Lm(0xbf9460), steel: Lm(0x454a50), dark: Lm(0x1f2124), paper: Lm(0xe8e0cc), black: Lm(0x131416), acc: Bm(0xff5a1f), bulb: Bm(0xffe2b8), win: Bm(0xdfe6ec), floor: null };
let scene, hooks, hemi, mood = 0, seed = 7; const list = [], lights = [], rnd = () => (seed = seed * 16807 % 2147483647) / 2147483647;
const box = (w, h, d, m, x, y, z, p) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); (p || scene).add(o); return o; };
const solid = (w, h, d, m, x, y, z) => { addBox(x - w / 2, z - d / 2, x + w / 2, z + d / 2); return box(w, h, d, m, x, y, z); };
const act = (o, label, fn) => { o.userData.act = { label, fn }; list.push(o); return o; };
const lamp = (x, y, z, i = 40) => { const l = new THREE.PointLight(0xffc690, i, 22, 2); l.position.set(x, y - .3, z); scene.add(l); lights.push(l); box(1.4, .06, .3, mat.bulb, x, y, z); };

function floorMat() {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); g.fillStyle = '#7d7b76'; g.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 1400; i++) { const v = 110 + rnd() * 50 | 0; g.fillStyle = `rgba(${v},${v},${v - 4},.35)`; g.fillRect(rnd() * 128, rnd() * 128, 2, 2); }
  g.strokeStyle = 'rgba(0,0,0,.18)'; g.strokeRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return new THREE.MeshLambertMaterial({ map: t });
}
function room(x0, x1, z0, z1, h, o = {}) {
  const w = x1 - x0, d = z1 - z0, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, T = .3, g = new THREE.PlaneGeometry(w, d), uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w / 2, uv.getY(i) * d / 2);
  const f = new THREE.Mesh(g, mat.floor); f.rotation.x = -Math.PI / 2; f.position.set(cx, 0, cz); scene.add(f);
  box(w, .2, d, mat.dark, cx, h + .1, cz); solid(T, h, d, mat.wall, x0 - T / 2, h / 2, cz); solid(T, h, d, mat.wall, x1 + T / 2, h / 2, cz);
  for (const [z, k, dir] of [[z0, o.n, -1], [z1, o.s, 1]]) {
    if (k === 'open') continue; const zz = z + dir * T / 2;
    if (k === 'door') { const sw = (w - 3) / 2; solid(sw, h, T, mat.wall, x0 + sw / 2, h / 2, zz); solid(sw, h, T, mat.wall, x1 - sw / 2, h / 2, zz); box(3, h - 2.7, T, mat.wall, cx, 2.7 + (h - 2.7) / 2, zz); }
    else solid(w, h, T, mat.wall, cx, h / 2, zz);
  }
}
// Canvas-textured plane. draw(g, widthPx, heightPx). ry rotates around Y: 0 faces +z, PI/2 faces +x, -PI/2 faces -x.
function sign(w, h, draw, x, y, z, ry = 0) {
  const c = document.createElement('canvas'); c.width = Math.round(w * U); c.height = Math.round(h * U); const g = c.getContext('2d'); draw(g, c.width, c.height);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, transparent: true })); m.position.set(x, y, z); m.rotation.y = ry; scene.add(m); m.userData.g = g; m.userData.t = t; return m;
}
function wrap(g, s, x, y, mw, lh) { let line = ''; for (const w of s.split(' ')) { const t = line + w + ' '; if (g.measureText(t).width > mw && line) { g.fillText(line, x, y); line = w + ' '; y += lh; } else line = t; } g.fillText(line, x, y); return y + lh; }
function plaque(x, y, z, ry, w, h, head, body, bg = '#e8e0cc') {
  const dk = bg !== '#e8e0cc';
  return sign(w, h, (g, cw, ch) => { g.fillStyle = bg; g.fillRect(0, 0, cw, ch); g.fillStyle = ACC; g.fillRect(U * .12, U * .12, U * .4, U * .035); g.textBaseline = 'alphabetic';
    g.fillStyle = dk ? '#efe8da' : '#1b1a17'; g.font = `700 ${U * .17}px ${H}`; let yy = wrap(g, head, U * .12, U * .42, cw - U * .24, U * .19);
    g.fillStyle = dk ? '#c9c2b0' : '#3a372f'; g.font = `${U * .085}px ${M}`; for (const ln of [].concat(body)) yy = wrap(g, ln, U * .12, yy + U * .06, cw - U * .24, U * .12); }, x, y, z, ry);
}

export async function build(sc, hk, step) {
  scene = sc; hooks = hk; scene.background = new THREE.Color(0x14130f); scene.fog = new THREE.Fog(0x14130f, 10, 48);
  hemi = new THREE.HemisphereLight(0xcfd6dd, 0x3b3025, .9); scene.add(hemi); mat.floor = floorMat();
  const anim = [], blue = (i, x, y, z, ry) => { const p = C.projects[i]; return act(plaque(x, y, z, ry, 2.8, 2.4, p.name, ['Architecture', ...p.flow.map(f => '> ' + f), '', 'Press E for the case study'], '#1f2a27'), 'Read the ' + p.name + ' case study', () => hooks.project(i)); };

  /* 1. Entry hall */
  room(-5, 5, -10, 0, 5, { n: 'door' }); lamp(0, 4.6, -5, 45);
  sign(8, 2.1, (g, w, h) => { g.fillStyle = '#1d1c19'; g.font = `700 ${h * .52}px ${H}`; g.fillText(C.name.toUpperCase(), w * .03, h * .62, w * .94); g.fillStyle = ACC; g.fillRect(w * .03, h * .72, w * .08, h * .03);
    g.fillStyle = '#1d1c19'; g.font = `${h * .095}px ${M}`; g.fillText(C.title + '  /  ' + C.loc, w * .03, h * .92, w * .94); }, 0, 3.85, -9.97);
  act(plaque(-4.84, 1.7, -5, Math.PI / 2, 2.4, 1.7, 'Quick facts', C.facts.slice(0, 5).map(f => f[0] + ': ' + f[1])), 'Read the quick facts', () => hooks.facts());
  plaque(4.84, 1.7, -5, -Math.PI / 2, 2.6, 1.9, 'About', C.summary);
  plaque(-4.84, 1.7, -8.2, Math.PI / 2, 1.5, 1.3, 'Floor plan', ['Corridor: experience', 'Workbench: UNOMi', 'Hall: three projects', 'Workshop: skills', 'Office: contact']);
  for (const z of [-3, -5, -7, -9]) { const gm = new THREE.CircleGeometry(.3, 3); gm.rotateX(-Math.PI / 2); gm.rotateY(Math.PI / 2); const a = new THREE.Mesh(gm, mat.acc); a.position.set(0, .012, z); scene.add(a); }
  const sw = box(.14, .22, .04, mat.acc, 4.82, 1.3, -1.8); act(sw, 'Change the light', () => { mood = 1 - mood; lights.forEach(l => l.color.set(mood ? 0xdfe8f0 : 0xffc690)); hemi.intensity = mood ? 1.2 : .9; hooks.toast(mood ? 'Daylight' : 'Tungsten'); });
  for (const z of [-3, -7]) { const w = box(.05, 1, 2.2, mat.win, 4.84, 3.9, z); }
  await step('Entry hall');

  /* 2. Experience corridor + UNOMi workbench */
  room(-1.5, 1.5, -22, -10, 3, { n: 'open', s: 'open' }); lamp(0, 2.9, -16, 22);
  act(plaque(-1.49, 1.6, -13, Math.PI / 2, 1.9, 1.5, C.job.dates, [C.job.role, C.job.org]), 'Read the internship details', () => hooks.job());
  plaque(1.49, 1.6, -17, -Math.PI / 2, 1.9, 1.5, 'Expected 2027', [C.edu.degree, C.edu.school + '. Senior standing.']);
  act(plaque(-1.49, 1.6, -20, Math.PI / 2, 1.9, 1.3, 'Cross-DCC tools', 'C++, Python and C# for Unreal Engine 5.8, Blender and Maya.'), 'Read the internship details', () => hooks.job());
  room(-4.5, 4.5, -30, -22, 4, { n: 'door', s: 'door' }); lamp(-2.5, 3.7, -26, 38);
  solid(2.6, 1, .9, mat.ply, -2.9, .5, -27); box(.4, .3, .4, mat.steel, -2.9, 1.15, -27);
  const defs = [{ g: new THREE.SphereGeometry(.26, 18, 12), z: .24, my: -.1, kx: .9, ky: 2.5, lift: .02, kb: .4 }, { g: new THREE.BoxGeometry(.44, .44, .44), z: .23, my: -.12, kx: .5, ky: 4, lift: .04, kb: .7 }, { g: new THREE.CylinderGeometry(.2, .26, .52, 18), z: .22, my: -.15, kx: 1.3, ky: 1.5, lift: .01, kb: .25 }];
  const rigs = defs.map(d => { const r = new THREE.Group(); r.add(new THREE.Mesh(d.g, mat.paper));
    for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(.025, 8, 6), mat.black); e.position.set(s * .08, .04, d.z); r.add(e); }
    r.brows = [-1, 1].map(s => { const b = box(.1, .02, .02, mat.black, s * .08, .11, d.z, r); b.userData.s = s; return b; }); r.mouth = box(.12, .025, .02, mat.acc, 0, d.my, d.z, r); r.d = d; r.position.set(-2.9, 1.58, -27); r.visible = false; scene.add(r); return r; });
  let cur = 0, ex = 0, exT = 0; rigs[0].visible = true;
  act(box(.16, .06, .16, mat.acc, -3.7, 1.03, -26.65), 'Switch the rig (same expression, different mapping)', () => { rigs[cur].visible = false; cur = (cur + 1) % 3; rigs[cur].visible = true; hooks.toast('Rig ' + (cur + 1) + ' of 3. One expression value drives all three.'); });
  const dial = new THREE.Mesh(new THREE.CylinderGeometry(.08, .08, .06, 16), mat.acc); dial.position.set(-2.1, 1.03, -26.65); scene.add(dial);
  act(dial, 'Turn the expression dial', () => { exT = (Math.round(exT * 3) + 1) % 4 / 3; hooks.toast('Expression ' + Math.round(exT * 100) + '%'); });
  act(plaque(-2.9, 2.3, -29.84, 0, 2.6, 1.4, 'UNOMi workbench', ['Model-agnostic facial mapping.', 'Press E for details.']), 'Read the internship details', () => hooks.job());
  anim.push((t, dt) => { ex += (exT - ex) * Math.min(1, dt * 6); const r = rigs[cur], d = r.d; r.rotation.y = Math.sin(t * .8) * .45;
    r.mouth.scale.set(1 + ex * d.kx, 1 + ex * d.ky, 1); r.mouth.position.y = d.my + ex * d.lift; for (const b of r.brows) b.rotation.z = b.userData.s * ex * d.kb; });
  await step('Experience');

  /* 3. Project hall */
  room(-11, 11, -52, -30, 6, { n: 'door', s: 'door' }); lamp(-6, 5.6, -41, 70); lamp(6, 5.6, -41, 70); lamp(0, 5.6, -34, 50);
  for (const z of [-34, -39, -44, -49]) for (const s of [-1, 1]) box(.05, 1.1, 2.2, mat.win, s * 10.84, 4.5, z);
  // Battle Tetris: two cabinets facing each other
  const pal = ['#ff5a1f', '#e0b84a', '#8fae7a', '#c9c2b0', '#b86a4e', '#6f8f8c'];
  const cab = (x, ry, sd) => { const g = new THREE.Group(); g.position.set(x, 0, -41); g.rotation.y = ry; scene.add(g);
    const body = box(.9, 1.9, .8, mat.black, 0, .95, 0, g); box(.9, .35, .9, mat.steel, 0, 2.05, .05, g); box(.9, .08, .02, mat.acc, 0, 1.9, .42, g);
    const cv = document.createElement('canvas'); cv.width = 140; cv.height = 180; const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(.72, .9), new THREE.MeshBasicMaterial({ map: tex })); scr.position.set(0, 1.3, .41); g.add(scr); addBox(x - .45, -41.45, x + .45, -40.55);
    for (const o of [body, scr]) act(o, 'Inspect Battle Tetris', () => hooks.project(0));
    let s = sd, rows = Array.from({ length: 12 }, () => Array(10).fill(0)), acc = 0; const r2 = () => (s = s * 16807 % 2147483647) / 2147483647;
    anim.push((t, dt) => { acc += dt; if (acc < .16) return; acc = 0; rows.pop(); rows.unshift(Array.from({ length: 10 }, () => r2() < .3 ? 1 + (r2() * 6 | 0) : 0)); const g2 = cv.getContext('2d'); g2.fillStyle = '#0d0e0f'; g2.fillRect(0, 0, 140, 180);
      rows.forEach((r, y) => r.forEach((c, x) => { if (c) { g2.fillStyle = pal[c - 1]; g2.fillRect(x * 14 + 1, y * 14 + 1, 12, 12); } })); g2.fillStyle = '#ff5a1f'; g2.font = `700 13px ${M}`; g2.fillText('1UP  BATTLE', 6, 176); tex.needsUpdate = true; }); };
  cab(-8.2, Math.PI / 2, 11); cab(-4.2, -Math.PI / 2, 29); blue(0, -10.84, 2.1, -41, Math.PI / 2);
  // Rhythm booth with a highway driven by a real analyser
  solid(3.3, 2.8, .2, mat.ply, 0, 1.4, -41.4); solid(.2, 2.8, 3, mat.ply, -1.6, 1.4, -40); solid(.2, 2.8, 3, mat.ply, 1.6, 1.4, -40); box(3.4, .1, 3.2, mat.dark, 0, 2.85, -40);
  const hw = sign(2.6, 2.2, () => {}, 0, 1.45, -41.29); const hg = hw.userData.g; let notes = []; for (let i = 0; i < 40; i++) notes.push([i * .55, rnd() * 4 | 0]);
  act(hw, 'Inspect the Rhythm Generator', () => hooks.project(1)); blue(1, 1.72, 1.7, -40, Math.PI / 2);
  solid(2.2, .9, .5, mat.ply, 0, .45, -39.6); act(box(.18, .05, .18, mat.acc, 0, .93, -39.45), 'Start or stop the synth loop', () => { const on = audio.synth(!audio.isLoop()); hooks.toast(on ? 'Synth loop on. The highway reads the live analyser.' : 'Synth loop off'); });
  anim.push((t) => { const w = 468, h = 396, lv = audio.levels(); hg.fillStyle = '#16181a'; hg.fillRect(0, 0, w, h);
    for (let i = 0; i < 4; i++) { hg.fillStyle = `rgba(255,90,31,${.08 + lv[i] * .7})`; hg.fillRect(40 + i * 97, 0, 90, h); }
    hg.fillStyle = '#efe8da';
    for (const [n, l] of notes) { const y = ((t * 1.3 + n * 1.7) % 6) / 6 * (h - 60); hg.fillRect(46 + l * 97, y, 78, 14); }
    hg.fillStyle = '#ff5a1f'; hg.fillRect(40, h - 50, 388, 4); hg.fillStyle = '#c9c2b0'; hg.font = `${15}px ${M}`; ['D', 'F', 'J', 'K'].forEach((k, i) => hg.fillText(k, 80 + i * 97, h - 20)); hg.fillText(audio.isLoop() ? 'live analyser' : 'press the button to start audio', 40, 22); hw.userData.t.needsUpdate = true; });
  // Surf station
  solid(2.4, .9, 1.4, mat.ply, 7, .45, -41); blue(2, 10.84, 2.1, -41, -Math.PI / 2);
  const tide = sign(2.2, 1.2, () => {}, 7, .91, -41, 0); tide.rotation.set(-Math.PI / 2, 0, 0); act(tide, 'Inspect the Surf Dashboard', () => hooks.project(2));
  anim.push((t) => { const g = tide.userData.g, w = 396, h = 216; g.fillStyle = '#1b1d1c'; g.fillRect(0, 0, w, h); g.strokeStyle = '#ff5a1f'; g.lineWidth = 3; g.beginPath();
    for (let x = 0; x <= w; x += 4) { const y = h * .55 + Math.sin(x / 62 + t * .4) * h * .28 + Math.sin(x / 23 + t * .3) * h * .05; x ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
    g.fillStyle = '#c9c2b0'; g.font = `13px ${M}`; g.fillText('24 h tide curve, illustrative demo', 10, 20); tide.userData.t.needsUpdate = true; });
  const tg = new THREE.PlaneGeometry(.76, .46, 24, 8), tank = new THREE.Mesh(tg, Lm(0x7d9a94)); tank.rotation.x = -Math.PI / 2; tank.position.set(7.6, 1.18, -41); scene.add(tank);
  const gl = new THREE.Mesh(new THREE.BoxGeometry(.8, .5, .5), new THREE.MeshLambertMaterial({ color: 0xcfd8d6, transparent: true, opacity: .22 })); gl.position.set(7.6, 1.2, -41); scene.add(gl); act(gl, 'Inspect the Surf Dashboard', () => hooks.project(2));
  anim.push(t => { const p = tg.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 9 - t * 2.2) * .035 + Math.sin(p.getY(i) * 7 + t) * .012); p.needsUpdate = true; tg.computeVertexNormals(); });
  await step('Project hall');

  /* 4. Skills workshop */
  room(-6, 6, -64, -52, 4.5, { n: 'door', s: 'door' }); lamp(0, 4.2, -58, 55);
  const pb = sign(10.4, 3.4, (g, w, h) => { g.fillStyle = '#a77d52'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(0,0,0,.28)'; for (let x = 20; x < w; x += 36) for (let y = 20; y < h; y += 36) g.fillRect(x, y, 4, 4); }, -5.97, 2.0, -58, Math.PI / 2); act(pb, 'Read the skills list', () => hooks.skills());
  Object.entries(C.skills).forEach(([cat, items], r) => { const y = 3.2 - r * .95, hs = items.map(() => .24 + rnd() * .07), ws = items.map((t, i) => hs[i] * (t.length * .3 + .7)), tot = ws.reduce((a, b) => a + b, 0) + items.length * .12, k = Math.min(1, 9.6 / tot);
    sign(2.6, .3, (g, w, h) => { g.fillStyle = '#2a1d10'; g.font = `700 ${h * .6}px ${M}`; g.fillText(cat.toUpperCase(), 0, h * .7, w); }, -5.95, y + .3, -54.4, Math.PI / 2);
    let u = 0; items.forEach((t, i) => { const h = hs[i] * k, w = ws[i] * k, m = sign(w, h, (g, cw, ch) => { g.fillStyle = '#e8e0cc'; g.fillRect(0, 0, cw, ch); g.fillStyle = '#1b1a17'; g.font = `600 ${ch * .5}px ${M}`; g.textBaseline = 'middle'; g.fillText(t, ch * .3, ch * .54, cw - ch * .4); },
      -5.94, y - .1 - rnd() * .12, -53.1 - u - w / 2, Math.PI / 2); m.rotation.z = (rnd() - .5) * .06; act(m, 'Read the skills list', () => hooks.skills()); u += w + .12 * k; }); });
  const bc = solid(.5, 2.2, 3.4, mat.ply, 5.75, 1.1, -58); act(bc, 'Read the coursework list', () => hooks.courses()); const cols = ['#b58a4a', '#7e8a63', '#a5543c', '#8b8f8c', '#d4c9a8', '#c27a52', '#6f7f78'];
  C.courses.forEach((t, i) => { const hh = 1.6 + rnd() * .4, m = sign(.4, hh, (g, cw, ch) => { g.fillStyle = cols[i]; g.fillRect(0, 0, cw, ch); g.save(); g.translate(cw / 2, ch / 2); g.rotate(-Math.PI / 2); g.fillStyle = '#1b1a17'; g.font = `700 ${cw * .42}px ${H}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(t, 0, 0, ch * .92); g.restore(); },
    5.49, .25 + hh / 2, -56.6 - i * .46, -Math.PI / 2); act(m, 'Read the coursework list', () => hooks.courses()); });
  await step('Skills');

  /* 5. Contact office */
  room(-4, 4, -74, -64, 3.6, { s: 'door' }); lamp(0, 3.3, -69, 38);
  solid(3, .8, 1.1, mat.ply, 0, .4, -71.2); const cards = box(.22, .1, .13, mat.paper, -.7, .85, -70.9); act(cards, 'Copy the email address', () => hooks.email());
  box(.22, .012, .13, mat.acc, -.7, .91, -70.9); act(plaque(-1.6, 1.7, -73.84, 0, 2.4, 1.1, 'GitHub', 'FosterBright18. Press E to open.'), 'Open GitHub', () => hooks.gh());
  act(plaque(1.6, 1.7, -73.84, 0, 2.4, 1.1, 'LinkedIn', 'Press E to open.'), 'Open LinkedIn', () => hooks.li());
  const pr = solid(.8, .8, .6, mat.steel, 3.3, .4, -69); act(box(.7, .3, .5, mat.paper, 3.3, .95, -69), 'Print the resume', () => hooks.resume()); act(pr, 'Print the resume', () => hooks.resume());
  const cm = solid(.5, .8, .45, mat.steel, -3.4, .4, -69), cmt = box(.4, .5, .3, mat.black, -3.4, 1.05, -69); let steamT = 0; const puffs = Array.from({ length: 6 }, () => { const s = new THREE.Mesh(new THREE.SphereGeometry(.05, 8, 6), new THREE.MeshBasicMaterial({ color: 0xdddddd, transparent: true, opacity: 0 })); scene.add(s); return s; });
  for (const o of [cm, cmt]) act(o, 'Brew a coffee', () => { steamT = 5; hooks.toast('Brewing'); });
  anim.push((t, dt) => { steamT = Math.max(0, steamT - dt); puffs.forEach((s, i) => { const k = (t * .6 + i / 6) % 1; s.position.set(-3.4 + Math.sin(k * 9 + i) * .05, 1.35 + k * .7, -69); s.material.opacity = steamT > 0 ? (1 - k) * .5 : 0; }); });
  await step('Contact');
  return { list, update: (t, dt) => anim.forEach(f => f(t, dt)),
    areas: [{ n: 'Entry hall', x: 0, z: -3, yaw: 0 }, { n: 'Experience corridor', x: 0, z: -12, yaw: 0 }, { n: 'UNOMi workbench', x: -.6, z: -25.5, yaw: .5 }, { n: 'Project hall', x: 0, z: -33, yaw: 0 }, { n: 'Skills workshop', x: 0, z: -58, yaw: Math.PI / 2 }, { n: 'Contact office', x: 0, z: -67.5, yaw: 0 }],
    // [x, z, lookX, lookZ, pauseSeconds]
    tour: [[0, -4, 0, -10, 2.5], [0, -16, 0, -24, 1.5], [-.6, -25.6, -2.9, -27, 4.5], [0, -33, 0, -40, .5], [-4, -36, -6.2, -41, 4], [0, -35, 0, -40.5, 3.5], [4, -37, 7, -41, 3.5], [0, -49, 0, -58, 0], [0, -58, -6, -58, 4], [0, -68.5, 0, -73, 4]] };
}