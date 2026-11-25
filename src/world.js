import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { C } from './content.js';
import { addBox, addPlatform, clearCollision } from './collision.js';
import * as audio from './audio.js';

const H = '"Bahnschrift","Arial Narrow","Roboto Condensed","Helvetica Neue",Arial,sans-serif';
const M = 'ui-monospace,Menlo,Consolas,monospace';
const ACC = '#ff5a1f';
const CY = '#3dffe3';
const MAG = '#ff2a85';
const U = 270; // 1.5x crisp canvas resolution for 3D signage
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

let scene, hooks, hemi, mood = 0, seed = 13;
const list = [], lights = [];
const rnd = () => (seed = seed * 16807 % 2147483647) / 2147483647;

// Static geometry batcher by material key to keep draw calls well under 250.
const buckets = new Map();
function addStaticGeo(geo, matKey, x, y, z, rx = 0, ry = 0, rz = 0) {
  const g = geo.index ? geo.toNonIndexed() : geo.clone();
  const m = new THREE.Matrix4().compose(
    new THREE.Vector3(x, y, z),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)),
    new THREE.Vector3(1, 1, 1)
  );
  g.applyMatrix4(m);
  if (!buckets.has(matKey)) buckets.set(matKey, []);
  buckets.get(matKey).push(g);
}
function sBox(w, h, d, matKey, x, y, z, rx = 0, ry = 0, rz = 0) {
  addStaticGeo(new THREE.BoxGeometry(w, h, d), matKey, x, y, z, rx, ry, rz);
}
function sSolid(w, h, d, matKey, x, y, z) {
  addBox(x - w / 2, z - d / 2, x + w / 2, z + d / 2);
  sBox(w, h, d, matKey, x, y, z);
}
function sCyl(rt, rb, h, seg, matKey, x, y, z, rx = 0, ry = 0, rz = 0) {
  addStaticGeo(new THREE.CylinderGeometry(rt, rb, h, seg), matKey, x, y, z, rx, ry, rz);
}
function flushStatic(mats) {
  for (const [k, geos] of buckets.entries()) {
    const m = mats[k];
    if (!m || !geos.length) continue;
    let merged = null;
    try { merged = mergeGeometries(geos, false); } catch {}
    if (merged) {
      scene.add(new THREE.Mesh(merged, m));
      geos.forEach(g => g.dispose());
    } else {
      geos.forEach(g => scene.add(new THREE.Mesh(g, m)));
    }
  }
  buckets.clear();
}

const box = (w, h, d, m, x, y, z, p) => {
  const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  o.position.set(x, y, z);
  (p || scene).add(o);
  return o;
};
const solid = (w, h, d, m, x, y, z) => {
  addBox(x - w / 2, z - d / 2, x + w / 2, z + d / 2);
  return box(w, h, d, m, x, y, z);
};
const act = (o, label, fn) => { o.userData.act = { label, fn }; list.push(o); return o; };

function makeWetFloorTextures() {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#14161a'; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2200; i++) {
    const v = 16 + (rnd() * 24 | 0);
    g.fillStyle = `rgba(${v},${v + 2},${v + 5},0.34)`;
    g.fillRect(rnd() * 256, rnd() * 256, 2 + rnd() * 4, 2 + rnd() * 4);
  }
  g.strokeStyle = 'rgba(0,0,0,0.45)'; g.lineWidth = 2; g.strokeRect(1, 1, 254, 254);
  g.strokeStyle = 'rgba(255,255,255,0.03)'; g.lineWidth = 1; g.strokeRect(3, 3, 250, 250);
  const map = new THREE.CanvasTexture(c);
  map.wrapS = map.wrapT = THREE.RepeatWrapping; map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 4;

  const r = document.createElement('canvas'); r.width = r.height = 256;
  const rg = r.getContext('2d');
  rg.fillStyle = '#585858'; rg.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 38; i++) {
    const x = rnd() * 256, y = rnd() * 256, rad = 18 + rnd() * 42;
    const grd = rg.createRadialGradient(x, y, 2, x, y, rad);
    grd.addColorStop(0, 'rgba(26,26,26,0.7)'); grd.addColorStop(1, 'rgba(88,88,88,0)');
    rg.fillStyle = grd; rg.beginPath(); rg.arc(x, y, rad, 0, Math.PI * 2); rg.fill();
  }
  const rough = new THREE.CanvasTexture(r);
  rough.wrapS = rough.wrapT = THREE.RepeatWrapping; rough.anisotropy = 4;
  return { map, rough };
}

function makeWallTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#1b1e23'; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 1200; i++) {
    const v = 22 + (rnd() * 16 | 0);
    g.fillStyle = `rgba(${v},${v + 2},${v + 4},0.28)`;
    g.fillRect(rnd() * 256, rnd() * 256, 2, 2);
  }
  g.strokeStyle = 'rgba(0,0,0,0.55)'; g.lineWidth = 3;
  g.beginPath(); g.moveTo(0, 128); g.lineTo(256, 128); g.moveTo(128, 0); g.lineTo(128, 256); g.stroke();
  g.strokeStyle = 'rgba(255,255,255,0.035)'; g.lineWidth = 1;
  g.beginPath(); g.moveTo(0, 130); g.lineTo(256, 130); g.moveTo(130, 0); g.lineTo(130, 256); g.stroke();
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}

function makeDeckGrateTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#181c22'; g.fillRect(0, 0, 128, 128);
  g.strokeStyle = '#29303b'; g.lineWidth = 4;
  for (let i = 0; i <= 128; i += 16) {
    g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 128); g.moveTo(0, i); g.lineTo(128, i); g.stroke();
  }
  g.strokeStyle = 'rgba(61,255,227,0.08)'; g.lineWidth = 1; g.strokeRect(2, 2, 124, 124);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}

function makeRainGlassTexture() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 512;
  const g = c.getContext('2d');
  g.clearRect(0, 0, 256, 512);
  for (let i = 0; i < 240; i++) {
    const x = rnd() * 256, y = rnd() * 512, len = 14 + rnd() * 54;
    g.fillStyle = `rgba(180,220,215,${0.05 + rnd() * 0.14})`;
    g.fillRect(x, y, 1.4, len);
    g.fillStyle = `rgba(255,190,130,${0.07 + rnd() * 0.14})`;
    g.fillRect(x, y + len, 2.2, 2.6);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 2); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function makeHazardTexture() {
  const c = document.createElement('canvas'); c.width = 128; c.height = 32;
  const g = c.getContext('2d');
  g.fillStyle = '#151618'; g.fillRect(0, 0, 128, 32);
  g.fillStyle = '#c94f18';
  for (let x = -32; x < 160; x += 24) {
    g.beginPath(); g.moveTo(x, 32); g.lineTo(x + 12, 32); g.lineTo(x + 26, 0); g.lineTo(x + 14, 0); g.closePath(); g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}

function makeTowerAtlasTexture() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 512;
  const g = c.getContext('2d');
  g.fillStyle = '#0c0d10'; g.fillRect(0, 0, 256, 512);
  const cols = 16, rows = 64, cw = 16, ch = 8;
  for (let r = 0; r < rows; r++) {
    const floorLit = rnd() < 0.72;
    for (let col = 0; col < cols; col++) {
      if (!floorLit || rnd() > 0.34) continue;
      const p = rnd();
      g.fillStyle = p < 0.56 ? '#ff9d3b' : p < 0.80 ? '#ffd08a' : p < 0.96 ? '#3dffe3' : '#ff2a85';
      g.globalAlpha = 0.35 + rnd() * 0.65;
      g.fillRect(col * cw + 3, r * ch + 2, cw - 6, ch - 4);
    }
  }
  g.globalAlpha = 1;
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}

function makeEyeTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#e7e2d5'; g.fillRect(0, 0, 128, 128);
  g.fillStyle = '#2b7068'; g.beginPath(); g.arc(64, 64, 24, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#3dffe3'; g.lineWidth = 3; g.beginPath(); g.arc(64, 64, 20, 0, Math.PI * 2); g.stroke();
  g.fillStyle = '#0c0d0f'; g.beginPath(); g.arc(64, 64, 11, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#fff3df'; g.beginPath(); g.arc(58, 57, 4, 0, Math.PI * 2); g.fill();
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// High-res canvas sign with polygonOffset to eliminate any wall z-fighting.
function sign(w, h, draw, x, y, z, ry = 0, emissiveBoost = false) {
  const c = document.createElement('canvas');
  c.width = Math.max(64, Math.round(w * U));
  c.height = Math.max(64, Math.round(h * U));
  const g = c.getContext('2d');
  draw(g, c.width, c.height);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.anisotropy = 8;
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshBasicMaterial({
      map: t,
      transparent: true,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
      toneMapped: !emissiveBoost
    })
  );
  m.position.set(x, y, z);
  m.rotation.y = ry;
  scene.add(m);
  m.userData.g = g;
  m.userData.t = t;
  return m;
}

function measureLines(g, s, mw) {
  const out = [];
  let line = '';
  for (const w of String(s).split(' ')) {
    const t = line ? line + ' ' + w : w;
    if (g.measureText(t).width > mw && line) { out.push(line); line = w; }
    else line = t;
  }
  if (line) out.push(line);
  return out;
}

// Auto-fitting plaque: dynamically scales text down if content is long so lines NEVER clip off the bottom edge!
function plaque(x, y, z, ry, w, h, head, body, accent = ACC) {
  const bodyLines = [].concat(body);
  return sign(w, h, (g, cw, ch) => {
    g.fillStyle = '#121418'; g.fillRect(0, 0, cw, ch);
    g.fillStyle = 'rgba(255,255,255,0.07)'; g.fillRect(0, 0, cw, 3); g.fillRect(0, ch - 3, cw, 3);
    const padX = Math.round(U * 0.12), padTop = Math.round(U * 0.11), padBot = Math.round(U * 0.10);
    g.fillStyle = accent; g.fillRect(padX, padTop, Math.min(cw * 0.28, U * 0.44), Math.max(4, Math.round(U * 0.028)));
    g.textBaseline = 'top';

    const mw = cw - padX * 2;
    const availH = ch - (padTop + Math.round(U * 0.08)) - padBot;
    let scale = 1.0, headRows = [], bodyGroups = [], headFs = 0, headLh = 0, bodyFs = 0, bodyLh = 0, gap = 0;

    // Shrink typography iteratively until everything fits comfortably inside availH
    for (let iter = 0; iter < 12; iter++) {
      headFs = Math.max(16, Math.round(U * 0.145 * scale));
      headLh = Math.round(headFs * 1.14);
      bodyFs = Math.max(13, Math.round(U * 0.080 * scale));
      bodyLh = Math.round(bodyFs * 1.32);
      gap = Math.round(bodyFs * 0.55);

      g.font = `700 ${headFs}px ${H}`;
      headRows = measureLines(g, head, mw);
      g.font = `${bodyFs}px ${M}`;
      bodyGroups = bodyLines.map(ln => ln === '' ? [''] : measureLines(g, ln, mw));

      const totalH = headRows.length * headLh + gap + bodyGroups.reduce((acc, rows) => acc + rows.length * bodyLh + Math.round(gap * 0.5), 0);
      if (totalH <= availH) break;
      scale *= 0.88;
    }

    let yy = padTop + Math.round(U * 0.085);
    g.fillStyle = '#f2ebdc'; g.font = `700 ${headFs}px ${H}`;
    for (const r of headRows) { g.fillText(r, padX, yy, mw); yy += headLh; }
    yy += gap;
    g.fillStyle = '#beb7a6'; g.font = `${bodyFs}px ${M}`;
    for (const rows of bodyGroups) {
      for (const r of rows) { if (r) g.fillText(r, padX, yy, mw); yy += bodyLh; }
      yy += Math.round(gap * 0.5);
    }
  }, x, y, z, ry);
}

function neonLabel(text, x, y, z, ry, colHex = ACC, w = 2.6, h = 0.42, flickerList = null, reflGroup = null) {
  const m = sign(w, h, (g, cw, ch) => {
    g.clearRect(0, 0, cw, ch);
    g.fillStyle = colHex;
    g.font = `700 ${Math.round(ch * 0.66)}px ${H}`;
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(text, cw / 2, ch / 2 + 2, cw * 0.94);
    g.fillRect(cw * 0.12, ch * 0.86, cw * 0.76, Math.max(2, ch * 0.05));
  }, x, y, z, ry, true);
  if (flickerList) flickerList.push(m);
  if (reflGroup) {
    const r = new THREE.Mesh(
      new THREE.PlaneGeometry(w * 0.95, 0.85),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(colHex), transparent: true, opacity: 0.09, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    r.rotation.x = -Math.PI / 2;
    r.position.set(x, 0.014, z + (ry === 0 ? 0.4 : ry === Math.PI ? -0.4 : 0));
    reflGroup.add(r);
  }
  return m;
}

// Sculpted 3D Surfboard (curved thruster outline, wooden stringer, cyan rails, tail fins)
function buildSurfboard(x, z, rotY) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.rotation.y = rotY;
  scene.add(g);

  // Steel display stand
  const standMat = new THREE.MeshStandardMaterial({ color: 0x2c333d, roughness: 0.45, metalness: 0.7 });
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.06, 0.48), standMat);
  base.position.set(0, 0.03, 0); g.add(base);
  for (const s of [-0.24, 0.24]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.85, 0.05), standMat);
    post.position.set(s, 0.45, -0.14); g.add(post);
  }

  // Board deck texture (clean off-white resin with warm timber stringer + acid cyan & orange competition stripes)
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 512;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#eae3d2'; ctx.fillRect(0, 0, 256, 512);
  // Subtle deck wax texture
  for (let i = 0; i < 650; i++) {
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.fillRect(48 + rnd() * 160, 80 + rnd() * 340, 3, 3);
  }
  // Competition diagonal stripes
  ctx.fillStyle = CY; ctx.fillRect(0, 145, 256, 26);
  ctx.fillStyle = ACC; ctx.fillRect(0, 178, 256, 14);
  ctx.fillStyle = '#14171c'; ctx.fillRect(0, 196, 256, 8);
  // Center wooden stringer
  ctx.fillStyle = '#6f4c2b'; ctx.fillRect(124, 0, 8, 512);
  // Tail traction pad
  ctx.fillStyle = '#181b20'; ctx.fillRect(62, 395, 132, 92);
  ctx.strokeStyle = '#2d333d'; ctx.lineWidth = 2;
  for (let y = 402; y < 486; y += 10) { ctx.beginPath(); ctx.moveTo(64, y); ctx.lineTo(192, y); ctx.stroke(); }

  const boardTex = new THREE.CanvasTexture(cv); boardTex.colorSpace = THREE.SRGBColorSpace;
  const boardMat = new THREE.MeshStandardMaterial({ map: boardTex, roughness: 0.22, metalness: 0.08 });

  // Sculpted outline using ExtrudeGeometry for a crisp shortboard/funboard shape
  const shape = new THREE.Shape();
  shape.moveTo(0, 1.05);
  shape.bezierCurveTo(0.24, 0.85, 0.30, 0.30, 0.28, -0.25);
  shape.bezierCurveTo(0.25, -0.72, 0.16, -0.95, 0.11, -1.04);
  shape.lineTo(-0.11, -1.04);
  shape.bezierCurveTo(-0.16, -0.95, -0.25, -0.72, -0.28, -0.25);
  shape.bezierCurveTo(-0.30, 0.30, -0.24, 0.85, 0, 1.05);

  const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.045, bevelEnabled: true, bevelThickness: 0.018, bevelSize: 0.016, bevelSegments: 3 });
  geo.center();
  // Normalize UVs onto 0..1 across board bounds
  const pos = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    uv.setXY(i, (pos.getX(i) + 0.31) / 0.62, 1 - (pos.getY(i) + 1.08) / 2.16);
  }
  const board = new THREE.Mesh(geo, boardMat);
  board.position.set(0, 1.12, 0.04);
  board.rotation.x = -0.14; // leaning back slightly on the rack
  g.add(board);

  // Thruster fin setup on the back of the board
  const finMat = new THREE.MeshStandardMaterial({ color: 0x16191f, roughness: 0.35, metalness: 0.2 });
  const finGeo = new THREE.BoxGeometry(0.015, 0.15, 0.12);
  const fC = new THREE.Mesh(finGeo, finMat); fC.position.set(0, -0.82, -0.08); board.add(fC);
  const fL = new THREE.Mesh(finGeo, finMat); fL.position.set(-0.13, -0.68, -0.08); fL.rotation.y = 0.12; board.add(fL);
  const fR = new THREE.Mesh(finGeo, finMat); fR.position.set(0.13, -0.68, -0.08); fR.rotation.y = -0.12; board.add(fR);

  addBox(x - 0.42, z - 0.35, x + 0.42, z + 0.35);
  return board;
}

// Video wall bay for Foster's real UNOMi captures (auto-plays muted in-world; Press E for full-screen player with audio)
function addMediaBay(item, x, y, z, ry, w, h, idx = 0) {
  const isFinal = idx >= 2;
  const colHex = isFinal ? ACC : CY;
  const fx = Math.sin(ry), fz = Math.cos(ry);
  sBox(w + 0.18, h + 0.18, 0.09, 'steel', x - fx * 0.03, y, z - fz * 0.03, 0, ry, 0);
  sBox(w + 0.14, 0.035, 0.05, isFinal ? 'acc' : 'cyan', x + fx * 0.01, y + h / 2 + 0.06, z + fz * 0.01, 0, ry, 0);

  const c = document.createElement('canvas'); c.width = 640; c.height = 400;
  const g = c.getContext('2d');
  g.fillStyle = '#0e1116'; g.fillRect(0, 0, 640, 400);
  g.strokeStyle = colHex; g.lineWidth = 4; g.strokeRect(18, 18, 604, 364);
  g.fillStyle = colHex; g.font = `700 22px ${M}`;
  g.fillText(`[ ${item.slot || 'VIDEO SHOWCASE'} ]`, 42, 74);
  g.fillStyle = '#f2ebdc'; g.font = `700 34px ${H}`;
  g.fillText(item.title, 42, 134, 556);
  g.fillStyle = '#b9b2a1'; g.font = `600 18px ${M}`;
  g.fillText(item.subtitle, 42, 174, 556);
  g.fillStyle = '#171c24'; g.fillRect(42, 220, 556, 62);
  g.fillStyle = '#3dffe3'; g.font = `600 16px ${M}`;
  g.fillText('Drop video at: ' + item.src, 58, 257, 524);
  g.fillStyle = '#a59e8d'; g.font = `15px ${M}`;
  g.fillText('Press E to open full-screen video player (with audio)', 42, 342);

  const phTex = new THREE.CanvasTexture(c);
  phTex.colorSpace = THREE.SRGBColorSpace;
  phTex.anisotropy = 4;
  const screenMat = new THREE.MeshBasicMaterial({ map: phTex, polygonOffset: true, polygonOffsetFactor: -2 });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(w, h), screenMat);
  screen.position.set(x + fx * 0.025, y, z + fz * 0.025);
  screen.rotation.y = ry;
  scene.add(screen);

  // Silently attempt to load real user media from assets/unomi/
  if (item.type === 'image') {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const tex = new THREE.Texture(img);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 8;
      tex.needsUpdate = true;
      screenMat.map = tex;
      screenMat.needsUpdate = true;
    };
    img.src = item.src;
  } else if (item.type === 'video') {
    const vid = document.createElement('video');
    vid.src = item.src;
    vid.muted = true; vid.loop = true; vid.playsInline = true; vid.crossOrigin = 'anonymous';
    vid.addEventListener('canplay', () => {
      vid.play().catch(() => {});
      const vtex = new THREE.VideoTexture(vid);
      vtex.colorSpace = THREE.SRGBColorSpace;
      screenMat.map = vtex;
      screenMat.needsUpdate = true;
    }, { once: true });
    vid.load();
  }

  // Crisp caption nameplate directly beneath the bay
  plaque(x + fx * 0.01, y - h / 2 - 0.42, z + fz * 0.01, ry, w, 0.56, item.title, item.subtitle + '  //  Press E to watch with audio', isFinal ? ACC : CY);
  act(screen, `Watch ${item.title} (full-screen video)`, () => hooks.media(item));
}

export async function build(sc, hk, step, renderer) {
  scene = sc; hooks = hk;
  list.length = 0; lights.length = 0; clearCollision();
  // Dim sodium-amber smog haze (no purple/blue gradient sky)
  scene.background = new THREE.Color(0x13100d);
  scene.fog = new THREE.Fog(0x16120e, 18, 155);

  const floorTex = makeWetFloorTextures();
  const wallTex = makeWallTexture();
  const deckTex = makeDeckGrateTexture();
  const rainGlassTex = makeRainGlassTexture();
  const hazardTex = makeHazardTexture();
  const towerTex = makeTowerAtlasTexture();

  // Balanced PBR materials + tight HDR neon (just above bloom threshold 1.15 so only neon strips glow, never blowing out walls/buttons!)
  const mat = {
    wall: new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.85, metalness: 0.12 }),
    steel: new THREE.MeshStandardMaterial({ color: 0x323842, roughness: 0.44, metalness: 0.65 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x101216, roughness: 0.72, metalness: 0.3 }),
    trim: new THREE.MeshStandardMaterial({ color: 0x20242b, roughness: 0.52, metalness: 0.55 }),
    duct: new THREE.MeshStandardMaterial({ color: 0x2a3038, roughness: 0.46, metalness: 0.65 }),
    desk: new THREE.MeshStandardMaterial({ color: 0x23262c, roughness: 0.55, metalness: 0.35 }),
    paper: new THREE.MeshStandardMaterial({ color: 0xe6decb, roughness: 0.85, metalness: 0.02 }),
    black: new THREE.MeshStandardMaterial({ color: 0x0b0c0e, roughness: 0.6, metalness: 0.35 }),
    // Lower skyscraper shaft exterior facade underneath the studio
    coreFacade: new THREE.MeshStandardMaterial({
      map: towerTex, emissiveMap: towerTex, emissive: new THREE.Color(0xd8b896), emissiveIntensity: 0.55,
      color: 0x16181d, roughness: 0.75, metalness: 0.35
    }),
    // Surgical HDR neon strips (only these exceed UnrealBloomPass threshold 1.15)
    acc: new THREE.MeshBasicMaterial({ color: new THREE.Color(1.48, 0.50, 0.14), toneMapped: false }),
    amber: new THREE.MeshBasicMaterial({ color: new THREE.Color(1.38, 0.92, 0.38), toneMapped: false }),
    cyan: new THREE.MeshBasicMaterial({ color: new THREE.Color(0.28, 1.42, 1.28), toneMapped: false }),
    mag: new THREE.MeshBasicMaterial({ color: new THREE.Color(1.45, 0.18, 0.68), toneMapped: false }),
    // Non-blooming tactical UI button materials (so workbench buttons stay crisp at High quality!)
    btnCyan: new THREE.MeshStandardMaterial({ color: 0x22998c, emissive: 0x1b665d, emissiveIntensity: 0.55, roughness: 0.35, metalness: 0.25 }),
    btnAcc: new THREE.MeshStandardMaterial({ color: 0xc94d18, emissive: 0x802a08, emissiveIntensity: 0.55, roughness: 0.35, metalness: 0.25 }),
    btnMag: new THREE.MeshStandardMaterial({ color: 0xb02266, emissive: 0x6b123d, emissiveIntensity: 0.55, roughness: 0.35, metalness: 0.25 }),
    ceilPanel: new THREE.MeshBasicMaterial({ color: new THREE.Color(0.76, 0.73, 0.67) }),
    glass: new THREE.MeshStandardMaterial({
      color: 0x8fb3b0, map: rainGlassTex, transparent: true, opacity: 0.24,
      roughness: 0.14, metalness: 0.22, depthWrite: false, side: THREE.DoubleSide
    }),
    railing: new THREE.MeshStandardMaterial({ color: 0x8eb5b0, transparent: true, opacity: 0.20, roughness: 0.15, metalness: 0.3, depthWrite: false, side: THREE.DoubleSide }),
    hazard: new THREE.MeshBasicMaterial({ map: hazardTex, transparent: true, opacity: 0.82, polygonOffset: true, polygonOffsetFactor: -1 }),
    deck: new THREE.MeshStandardMaterial({ map: deckTex, roughness: 0.42, metalness: 0.55 }),
    floor: new THREE.MeshStandardMaterial({
      map: floorTex.map, roughnessMap: floorTex.rough, roughness: 0.32, metalness: 0.20, envMapIntensity: 0.72
    })
  };

  // Real Light Budget: 1 HemisphereLight + 7 PointLights = 8 real lights total.
  hemi = new THREE.HemisphereLight(0x88b4b0, 0x261d15, 0.90);
  scene.add(hemi);
  const addLight = (x, y, z, col, intensity, dist = 26) => {
    const l = new THREE.PointLight(col, intensity, dist, 1.75);
    l.position.set(x, y, z);
    scene.add(l);
    lights.push(l);
    return l;
  };

  const anim = [];
  const flickers = [];
  const reflectionGroup = new THREE.Group();
  scene.add(reflectionGroup);
  const steamGroup = new THREE.Group();
  scene.add(steamGroup);
  const shaftGroup = new THREE.Group();
  scene.add(shaftGroup);
  const coneMatWarm = new THREE.MeshBasicMaterial({ color: 0xffa04a, transparent: true, opacity: 0.042, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const coneMatCyan = new THREE.MeshBasicMaterial({ color: 0x3dffe3, transparent: true, opacity: 0.038, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const addShaft = (x, y, z, rTop, rBot, h, cyan = false) => {
    const c = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, 14, 1, true), cyan ? coneMatCyan : coneMatWarm);
    c.position.set(x, y - h / 2, z);
    shaftGroup.add(c);
  };

  const addHazard = (x, z, w, d, rot = 0) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat.hazard);
    m.rotation.x = -Math.PI / 2; m.rotation.z = rot; m.position.set(x, 0.008, z);
    scene.add(m);
  };

  const ledPos = [];
  function addCeiling(x0, x1, z0, z1, h, cyanTrim = false) {
    const w = x1 - x0, d = z1 - z0, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    sBox(w, 0.16, d, 'dark', cx, h + 0.08, cz);
    for (let z = z0 + 2; z < z1 - 0.5; z += 3.2) sBox(w - 0.2, 0.12, 0.16, 'trim', cx, h - 0.06, z);
    for (let z = z0 + 1.8; z < z1 - 1.2; z += 3.6) {
      const pw = Math.min(w * 0.56, 3.2);
      sBox(pw, 0.04, 0.34, 'ceilPanel', cx, h - 0.02, z);
      sBox(pw + 0.12, 0.025, 0.035, cyanTrim ? 'cyan' : 'amber', cx, h - 0.045, z + 0.22);
    }
    sBox(0.55, 0.32, d - 0.4, 'duct', x0 + 0.7, h - 0.22, cz);
    sCyl(0.055, 0.055, d - 0.4, 8, 'steel', x1 - 0.55, h - 0.18, cz, Math.PI / 2, 0, 0);
    sCyl(0.04, 0.04, d - 0.4, 8, 'steel', x1 - 0.78, h - 0.18, cz, Math.PI / 2, 0, 0);
  }

  function addFloor(x0, x1, z0, z1, useDeck = false) {
    const w = x1 - x0, d = z1 - z0, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    const g = new THREE.PlaneGeometry(w, d);
    const uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w / 2.2, uv.getY(i) * d / 2.2);
    const f = new THREE.Mesh(g, useDeck ? mat.deck : mat.floor);
    f.rotation.x = -Math.PI / 2; f.position.set(cx, 0, cz);
    scene.add(f);
  }

  function addWindowWallX(x, z0, z1, h, winZ0, winZ1, wy0, wy1, colSide = 1, openPortal = false) {
    const T = 0.28, xx = x + colSide * T / 2;
    if (winZ0 > z0) sSolid(T, h, winZ0 - z0, 'wall', xx, h / 2, (z0 + winZ0) / 2);
    if (z1 > winZ1) sSolid(T, h, z1 - winZ1, 'wall', xx, h / 2, (winZ1 + z1) / 2);
    const span = winZ1 - winZ0, midZ = (winZ0 + winZ1) / 2;
    if (!openPortal) {
      if (wy0 > 0) sBox(T, wy0, span, 'wall', xx, wy0 / 2, midZ);
      if (h > wy1) sBox(T, h - wy1, span, 'wall', xx, wy1 + (h - wy1) / 2, midZ);
      addBox(xx - T / 2, winZ0, xx + T / 2, winZ1);
      sBox(T + 0.08, 0.1, span, 'steel', xx, wy0, midZ);
      sBox(T + 0.08, 0.1, span, 'steel', xx, wy1, midZ);
      const count = Math.max(2, Math.round(span / 3));
      for (let i = 0; i <= count; i++) {
        const mz = winZ0 + (span * i / count);
        sBox(T + 0.06, wy1 - wy0, 0.1, 'steel', xx, (wy0 + wy1) / 2, mz);
      }
      const pane = new THREE.Mesh(new THREE.PlaneGeometry(span, wy1 - wy0), mat.glass);
      pane.position.set(x, (wy0 + wy1) / 2, midZ);
      pane.rotation.y = colSide > 0 ? -Math.PI / 2 : Math.PI / 2;
      scene.add(pane);
    } else {
      if (h > wy1) sBox(T, h - wy1, span, 'wall', xx, wy1 + (h - wy1) / 2, midZ);
      sBox(T + 0.08, 0.12, span, 'steel', xx, wy1, midZ);
      sBox(0.06, 0.04, span, 'cyan', x - 0.04, wy1 - 0.08, midZ);
    }
  }

  function addDoorWallZ(x0, x1, z, h, dir, neonMat = 'acc') {
    const w = x1 - x0, cx = (x0 + x1) / 2, T = 0.28, zz = z + dir * T / 2;
    const sw = (w - 3) / 2;
    sSolid(sw, h, T, 'wall', x0 + sw / 2, h / 2, zz);
    sSolid(sw, h, T, 'wall', x1 - sw / 2, h / 2, zz);
    sBox(3, h - 2.75, T, 'wall', cx, 2.75 + (h - 2.75) / 2, zz);
    sBox(0.14, 2.75, T + 0.08, 'steel', cx - 1.5, 1.375, zz);
    sBox(0.14, 2.75, T + 0.08, 'steel', cx + 1.5, 1.375, zz);
    sBox(3.2, 0.14, T + 0.08, 'steel', cx, 2.75, zz);
    sBox(0.04, 2.65, 0.04, neonMat, cx - 1.43, 1.35, z - dir * 0.02);
    sBox(0.04, 2.65, 0.04, neonMat, cx + 1.43, 1.35, z - dir * 0.02);
    sBox(2.9, 0.04, 0.04, neonMat, cx, 2.68, z - dir * 0.02);
    addHazard(cx, z - dir * 0.18, 2.85, 0.34, 0);
  }

  function addBaseboards(x0, x1, z0, z1, skipEast = false, skipWest = false) {
    const cz = (z0 + z1) / 2, d = z1 - z0;
    if (!skipWest) { sBox(0.08, 0.14, d, 'trim', x0 + 0.04, 0.07, cz); sBox(0.025, 0.025, d, 'cyan', x0 + 0.085, 0.13, cz); }
    if (!skipEast) { sBox(0.08, 0.14, d, 'trim', x1 - 0.04, 0.07, cz); sBox(0.025, 0.025, d, 'acc', x1 - 0.085, 0.13, cz); }
  }

  function addServerRack(x, z, ry = 0) {
    sSolid(0.75, 2.25, 0.8, 'dark', x, 1.125, z);
    sBox(0.79, 0.08, 0.84, 'steel', x, 2.26, z);
    sBox(0.79, 0.08, 0.84, 'steel', x, 0.04, z);
    const fx = Math.sin(ry) * 0.42, fz = Math.cos(ry) * 0.42;
    const rx = Math.cos(ry), rz = -Math.sin(ry);
    for (let row = 0; row < 6; row++) {
      const y = 0.35 + row * 0.3;
      for (let col = -1; col <= 1; col++) {
        ledPos.push({ x: x + fx + rx * col * 0.18, y, z: z + fz + rz * col * 0.18, phase: rnd() * 6.28, kind: rnd() });
      }
    }
  }

  function addMonitor(x, y, z, ry = 0, label = 'SYS // OK') {
    sBox(0.68, 0.42, 0.05, 'dark', x, y + 0.28, z, 0, ry, 0);
    sBox(0.14, 0.16, 0.08, 'steel', x, y + 0.08, z, 0, ry, 0);
    sBox(0.28, 0.025, 0.18, 'steel', x, y + 0.012, z, 0, ry, 0);
    const fx = Math.sin(ry) * 0.032, fz = Math.cos(ry) * 0.032;
    sign(0.62, 0.36, (g, w, h) => {
      g.fillStyle = '#0c1215'; g.fillRect(0, 0, w, h);
      g.fillStyle = CY; g.font = `700 ${Math.round(h * 0.16)}px ${M}`; g.fillText(label, 12, 26);
      g.fillStyle = 'rgba(61,255,227,0.38)';
      for (let i = 0; i < 6; i++) g.fillRect(12, 40 + i * 14, 40 + ((i * 37) % (w - 70)), 6);
      g.fillStyle = ACC; g.fillRect(12, h - 18, w * 0.55, 5);
    }, x + fx, y + 0.28, z + fz, ry, false);
  }

  function addCableBundle(x, z, len, rotY = 0) {
    sCyl(0.03, 0.03, len, 6, 'black', x, 0.03, z, Math.PI / 2, 0, rotY);
    sCyl(0.022, 0.022, len, 6, 'trim', x + 0.04, 0.022, z + 0.02, Math.PI / 2, 0, rotY);
  }

  /* =========================================================================
     0. CYBERPUNK CITY + SKYSCRAPER CORE UNDER THE BUILDING (Never Floating!)
     ========================================================================= */
  const cityGroup = new THREE.Group();
  scene.add(cityGroup);

  // Solid skyscraper tower structure directly beneath every studio room (y = -38 to -0.15)
  // Eliminates any "floating rooms" effect when looking back from the balcony or parkour!
  const coreSections = [
    { x: 0, z: -5,   w: 10.6, d: 10.4 }, // Under Entry Hall
    { x: 0, z: -18,  w: 14.6, d: 16.4 }, // Under UNOMi Showcase Room
    { x: 0, z: -28,  w: 6.4,  d: 4.4  }, // Under Transition Corridor
    { x: 0, z: -41,  w: 22.6, d: 22.4 }, // Under Project Hall
    { x: 0, z: -58,  w: 12.6, d: 12.4 }, // Under Skills Workshop
    { x: 0, z: -69,  w: 8.6,  d: 10.4 }  // Under Contact Office
  ];
  for (const s of coreSections) {
    // Main illuminated lower-story tower shaft (top safely at y = -0.15 so zero z-fighting with floor y = 0)
    const shaft = new THREE.Mesh(new THREE.BoxGeometry(s.w, 37.85, s.d), mat.coreFacade);
    shaft.position.set(s.x, -19.075, s.z);
    cityGroup.add(shaft);
    // Steel cornice collar ring directly under the studio penthouse floor
    sBox(s.w + 0.35, 0.38, s.d + 0.35, 'steel', s.x, -0.34, s.z);
    // Corner structural steel mega-columns extending down into the city canyon
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        sBox(0.55, 38, 0.55, 'dark', s.x + sx * (s.w / 2 + 0.05), -19.15, s.z + sz * (s.d / 2 + 0.05));
      }
    }
  }
  // Structural exterior roof caps & parapet trims over all rooms
  sBox(10.8, 0.25, 10.6, 'dark', 0, 5.22, -5);
  sBox(14.8, 0.25, 16.6, 'dark', 0, 5.22, -18);
  sBox(5.0,  0.25, 4.4,  'dark', 0, 3.62, -28);
  sBox(22.8, 0.28, 22.6, 'dark', 0, 6.42, -41);
  sBox(12.8, 0.25, 12.6, 'dark', 0, 4.72, -58);
  sBox(8.8,  0.25, 10.6, 'dark', 0, 4.02, -69);

  // Surrounding city skyline towers (layered rings)
  const towerMat = new THREE.MeshStandardMaterial({
    map: towerTex, emissiveMap: towerTex, emissive: new THREE.Color(0xffffff), emissiveIntensity: 0.95,
    roughness: 0.72, metalness: 0.25
  });
  const towerData = [];
  const beacons = [];
  for (let i = 0; i < 360; i++) {
    const ring = i < 105 ? 0 : i < 230 ? 1 : 2;
    const distMin = ring === 0 ? 24 : ring === 1 ? 46 : 76;
    const distMax = ring === 0 ? 46 : ring === 1 ? 76 : 124;
    const ang = rnd() * Math.PI * 2;
    const rad = distMin + rnd() * (distMax - distMin);
    const tx = Math.cos(ang) * rad;
    const tz = -38 + Math.sin(ang) * rad * 1.15;
    // Keep clear of the building + east balcony/parkour zone
    if (tx > -17 && tx < 22 && tz > -80 && tz < 8) continue;
    const w = (ring === 0 ? 5.5 : 7.5) + rnd() * (ring === 0 ? 6 : 11);
    const d = (ring === 0 ? 5.5 : 7.5) + rnd() * (ring === 0 ? 6 : 11);
    const h = 30 + rnd() * (ring === 0 ? 56 : ring === 1 ? 80 : 98);
    const yBase = -38;
    towerData.push({ x: tx, y: yBase + h / 2, z: tz, w, h, d, ring });
    if (h > 64 && beacons.length < 52) beacons.push({ x: tx, y: yBase + h + 0.8, z: tz, phase: rnd() * 6.28 });
  }
  const towerMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), towerMat, towerData.length);
  const dummy = new THREE.Object3D(), cTmp = new THREE.Color();
  towerData.forEach((t, i) => {
    dummy.position.set(t.x, t.y, t.z);
    dummy.scale.set(t.w, t.h, t.d);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    towerMesh.setMatrixAt(i, dummy.matrix);
    const shade = t.ring === 0 ? 0.60 : t.ring === 1 ? 0.78 : 0.92;
    towerMesh.setColorAt(i, cTmp.setRGB(shade, shade * 0.96, shade * 0.92));
  });
  towerMesh.instanceMatrix.needsUpdate = true;
  if (towerMesh.instanceColor) towerMesh.instanceColor.needsUpdate = true;
  cityGroup.add(towerMesh);

  // Blinking aviation beacons
  const beaconMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 0.22, 0.14), toneMapped: false });
  const beaconMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.55, 0.55, 0.55), beaconMat, beacons.length);
  cityGroup.add(beaconMesh);

  // Giant holographic billboards
  const bbSpecs = [
    { x: 36, y: 12, z: -40, ry: -Math.PI / 2, w: 16, h: 8, title: 'SECTOR // 09', sub: 'TRANSIT CORRIDOR', col: ACC },
    { x: -34, y: 14, z: -42, ry: Math.PI / 2, w: 15, h: 7.5, title: 'SIGNAL 04', sub: 'MARINE TELEMETRY', col: CY },
    { x: 32, y: 9, z: -15, ry: -Math.PI / 2, w: 14, h: 7, title: 'KINETIC GRID', sub: 'SKYWAY LEVEL 18', col: ACC },
    { x: 28, y: 10, z: -70, ry: -Math.PI * 0.62, w: 12, h: 6, title: 'NODE 18', sub: 'AFTER DARK', col: CY }
  ];
  const billboards = bbSpecs.map(b => {
    const c = document.createElement('canvas'); c.width = 512; c.height = 256;
    const g = c.getContext('2d');
    g.fillStyle = 'rgba(12,13,16,0.58)'; g.fillRect(0, 0, 512, 256);
    g.strokeStyle = b.col; g.lineWidth = 4; g.strokeRect(14, 14, 484, 228);
    for (let i = 0; i < 6; i++) { g.globalAlpha = 0.2 + i * 0.1; g.beginPath(); g.arc(410, 128, 22 + i * 14, 0, Math.PI * 1.4); g.stroke(); }
    g.globalAlpha = 1;
    g.fillStyle = b.col; g.font = `700 54px ${H}`; g.fillText(b.title, 34, 118);
    g.fillStyle = '#efe8da'; g.font = `600 22px ${M}`; g.fillText(b.sub, 34, 162);
    g.fillStyle = MAG; g.fillRect(34, 186, 84, 8);
    g.fillStyle = 'rgba(0,0,0,0.22)'; for (let y = 0; y < 256; y += 6) g.fillRect(0, y, 512, 2);
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(b.w, b.h),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.80, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
    );
    m.position.set(b.x, b.y, b.z); m.rotation.y = b.ry;
    cityGroup.add(m);
    return m;
  });

  // 360 Floating Aerial Traffic Cars (Multi-altitude North-South & East-West skyways!)
  const carTotal = 360;
  let activeCars = carTotal;
  const cars = Array.from({ length: carTotal }, (_, i) => {
    const crossLane = i >= 260; // 100 cross-traffic cars on East-West lanes + 260 on North-South lanes
    if (!crossLane) {
      const eastSide = i % 2 === 0;
      const laneX = (eastSide ? 1 : -1) * (18.5 + (i % 7) * 5.2);
      const laneY = -20 + (i % 10) * 4.4;
      const dir = (i % 3 === 0) ? 1 : -1;
      return { axis: 'z', x: laneX, y: laneY, z: -115 + rnd() * 165, dir, speed: 10 + rnd() * 18 };
    } else {
      const laneZ = [10, 18, -82, -92][i % 4];
      const laneY = -16 + (i % 9) * 4.5;
      const dir = (i % 2 === 0) ? 1 : -1;
      return { axis: 'x', x: -75 + rnd() * 150, y: laneY, z: laneZ, dir, speed: 11 + rnd() * 17 };
    }
  });
  const carBodyMesh = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.95, 0.38, 2.3),
    new THREE.MeshStandardMaterial({ color: 0x181c22, roughness: 0.4, metalness: 0.65 }),
    carTotal
  );
  const carHeadMesh = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.68, 0.16, 1.35),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(1.45, 1.15, 0.58), toneMapped: false }),
    carTotal
  );
  const carTailMesh = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.72, 0.16, 1.85),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(1.65, 0.22, 0.14), toneMapped: false }),
    carTotal
  );
  cityGroup.add(carBodyMesh, carHeadMesh, carTailMesh);

  // Rain streaks outside windows
  const rainTotal = 450;
  let activeRain = rainTotal;
  const drops = Array.from({ length: rainTotal }, (_, i) => {
    const side = i % 2 === 0 ? 1 : -1;
    const z = -76 + rnd() * 82;
    const x = side > 0 ? (11.8 + rnd() * 11) : (-11.8 - rnd() * 11);
    return { x: (z > -26 && side > 0) ? 7.6 + rnd() * 7 : x, y: -4 + rnd() * 17, z, speed: 13 + rnd() * 9 };
  });
  const rainMat = new THREE.MeshBasicMaterial({ color: 0xa6c7c2, transparent: true, opacity: 0.30, depthWrite: false });
  const rainMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.018, 0.72, 0.018), rainMat, rainTotal);
  cityGroup.add(rainMesh);

  // Exterior rooftop steam vents
  const citySteam = Array.from({ length: 14 }, (_, i) => {
    const s = new THREE.Mesh(
      new THREE.PlaneGeometry(3.2, 3.2),
      new THREE.MeshBasicMaterial({ color: 0x8f887d, transparent: true, opacity: 0.08, depthWrite: false, side: THREE.DoubleSide })
    );
    const side = i < 7 ? 1 : -1;
    s.userData = { bx: side * (22 + (i % 3) * 4), bz: -34 - (i % 7) * 5, phase: rnd() };
    s.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
    steamGroup.add(s);
    return s;
  });

  // One-time CubeCamera environment bake of the cyberpunk city for wet concrete floors
  let cityEnvMap = null;
  if (renderer) {
    try {
      const cubeRT = new THREE.WebGLCubeRenderTarget(128, { generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter });
      const cubeCam = new THREE.CubeCamera(0.5, 220, cubeRT);
      cubeCam.position.set(18, 8, -40);
      cubeCam.update(renderer, scene);
      cityEnvMap = cubeRT.texture;
      mat.floor.envMap = cityEnvMap;
      mat.steel.envMap = cityEnvMap;
    } catch {}
  }

  await step('City skyline');

  /* =========================================================================
     1. ENTRY HALL (High-rise lobby + east city window + fixed hero sign)
     ========================================================================= */
  addFloor(-5, 5, -10, 0);
  addCeiling(-5, 5, -10, 0, 5.0, false);
  sSolid(0.28, 5.0, 10, 'wall', -5.14, 2.5, -5);
  sSolid(10, 5.0, 0.28, 'wall', 0, 2.5, 0.14);
  addWindowWallX(5, -10, 0, 5.0, -8.6, -1.4, 0.45, 4.55, 1, false);
  // Shared doorway wall at z = -10 is built full-width (-7..7) in the UNOMi section below (z: -10.0..-10.28)
  // Add Entry Hall side neon portal trim right on the south face (z = -9.98)
  sBox(0.04, 2.65, 0.04, 'acc', -1.43, 1.35, -9.98);
  sBox(0.04, 2.65, 0.04, 'acc', 1.43, 1.35, -9.98);
  sBox(2.9, 0.04, 0.04, 'acc', 0, 2.68, -9.98);
  addHazard(0, -9.82, 2.85, 0.34, 0);
  addBaseboards(-5, 5, -10, 0, true, false);
  addLight(0, 4.45, -5, 0xffb46a, 42, 24);
  addShaft(0, 4.9, -5, 0.8, 2.6, 4.6, false);

  // Entry-hall hero name sign on brushed-steel backing plate
  sBox(7.6, 1.98, 0.08, 'steel', 0, 3.88, -9.85);
  sBox(7.64, 0.035, 0.04, 'acc', 0, 2.91, -9.82);
  sign(7.4, 1.85, (g, w, h) => {
    g.fillStyle = '#0f1115'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#f3ecdd'; g.font = `700 ${Math.round(h * 0.48)}px ${H}`;
    g.fillText(C.name.toUpperCase(), w * 0.035, h * 0.56, w * 0.93);
    g.fillStyle = ACC; g.fillRect(w * 0.035, h * 0.67, w * 0.14, h * 0.035);
    g.fillStyle = '#c8c1b0'; g.font = `600 ${Math.round(h * 0.105)}px ${M}`;
    g.fillText(C.title + '  //  ' + C.loc, w * 0.035, h * 0.86, w * 0.93);
  }, 0, 3.88, -9.79, 0);

  neonLabel('ENTRY // BUILD FLOOR', 0, 4.65, -0.18, Math.PI, ACC, 3.2, 0.36, null, reflectionGroup);
  neonLabel('UNOMi SHOWCASE', 0, 2.86, -9.78, 0, ACC, 2.4, 0.28, null, reflectionGroup);

  act(plaque(-4.84, 1.72, -2.9, Math.PI / 2, 2.45, 1.75, 'Recruiter quick sheet', C.facts.slice(0, 5).map(f => f[0] + ': ' + f[1]), ACC), 'Open recruiter quick sheet', () => hooks.facts());
  act(plaque(-4.84, 1.72, -5.85, Math.PI / 2, 2.45, 1.75, 'Verify it yourself', ['Live repos & demos for all 3 projects.', 'UNOMi: Sponsor repo, details on request.', 'Press E to inspect links.'], CY), 'Open Verify It Yourself links', () => hooks.verify());
  plaque(-4.84, 1.72, -8.45, Math.PI / 2, 1.75, 1.5, 'Floor plan', ['1. UNOMi Emotion Engine Showcase', '2. Project Hall + Skyway Parkour', '3. Skills & ASU Coursework', '4. Contact & Print Resume'], ACC);
  plaque(-3.3, 1.55, -9.83, 0, 2.75, 1.85, 'About', C.summary, CY);

  for (const z of [-3.2, -5.4, -7.6, -9.2]) {
    const gm = new THREE.CircleGeometry(0.24, 3); gm.rotateX(-Math.PI / 2); gm.rotateY(Math.PI / 2);
    const a = new THREE.Mesh(gm, mat.acc); a.position.set(0, 0.012, z); scene.add(a);
  }
  const sw = box(0.16, 0.26, 0.06, mat.btnCyan, 3.25, 1.38, -9.84);
  act(sw, 'Toggle studio lighting mood', () => {
    mood = 1 - mood;
    lights[0].color.set(mood ? 0x9de6dd : 0xffb46a);
    hemi.intensity = mood ? 1.05 : 0.90;
    hooks.toast(mood ? 'Cool Cyan Spill' : 'After Dark Amber');
  });
  await step('Entry hall');

  /* =========================================================================
     2. FLAGSHIP UNOMi EMOTION ENGINE SHOWCASE GALLERY (Right after Entry Hall!)
     ========================================================================= */
  addFloor(-7, 7, -26, -10);
  addCeiling(-7, 7, -26, -10, 5.0, false);
  sSolid(0.28, 5.0, 16, 'wall', -7.14, 2.5, -18);
  addWindowWallX(7, -26, -10, 5.0, -24.4, -11.6, 0.45, 4.55, 1, false);
  // Single flush shared wall at z = -10.0..-10.28 (zero protruding wall clipping!)
  addDoorWallZ(-7, 7, -10, 5.0, -1, 'acc');
  addDoorWallZ(-7, 7, -26, 5.0, -1, 'cyan');
  addBaseboards(-7, 7, -26, -10.28, true, false);
  addLight(-1.5, 4.45, -18, 0xffaa58, 52, 26);
  addLight(3.0, 4.35, -18, 0x4be8d2, 34, 22);
  addShaft(-2.5, 4.9, -18, 0.8, 2.7, 4.6, false);
  neonLabel('UNOMi EMOTION ENGINE // SHOWCASE', 0, 4.35, -25.8, 0, ACC, 5.4, 0.42, flickers, reflectionGroup);
  neonLabel('PROJECTS', 0, 2.86, -25.78, 0, CY, 1.8, 0.28, null, reflectionGroup);

  // West Wall: 4 Dedicated Video Bays (Morph Sliders | Saved Emotions | Final Speaking I | Final Speaking II)
  const bayZs = [-12.4, -16.15, -19.9, -23.65];
  C.unomiMedia.slice(0, 4).forEach((item, idx) => {
    addMediaBay(item, -6.92, 2.38, bayZs[idx], Math.PI / 2, 3.1, 1.88, idx);
  });

  // 4 Unobstructed Technical Architecture & Bug-Fix Plaques (cleanly offset at z = -10.34 and z = -25.82!)
  act(plaque(-4.35, 1.88, -10.34, Math.PI, 3.85, 2.25, 'External AI Server Architecture', [
    'Heavyweight speech ML cannot stall Unreal Editor or bloat the C++ plugin.',
    'UE 5.8 C++ Plugin -> Async HTTP/JSON -> Cloud Run FastAPI Backend.',
    'Server runs Kaldi forced alignment + INT8 Wav2Vec2 SER in parallel.',
    'Returned phoneme & emotionFrames JSON bakes to UAnimSequence via IAnimationDataController.',
    'Press E for full technical breakdown.'
  ], ACC), 'Read full UNOMi architecture & fixes', () => hooks.job());

  act(plaque(4.35, 1.88, -10.34, Math.PI, 3.85, 2.25, 'C++ & Unreal Editor Bugs Fixed', [
    '- Async HTTP / Tab-Closure Crash: Fixed raw-pointer captures crashing Unreal when closing Slate UI tabs.',
    '- Numeric Version Checks: Replaced string version comparisons in update checks with numeric parsing.',
    '- Morph Alignment: Aligned facial morph sliders by morph target name across rigs.',
    '- UE 5.8 Stability: Fixed UTextureRenderTarget2D build errors & export flows.',
    'Press E for full technical breakdown.'
  ], CY), 'Read full UNOMi architecture & fixes', () => hooks.job());

  act(plaque(-4.35, 1.84, -25.82, 0, 3.75, 2.1, 'Slate UI & 14 Saved Emotion Presets', [
    'Built SFacialExpressionPanel in UE 5.8 C++ with morph sliders & physics toggles (brows, eyes, cheeks, nose, ears, mouth).',
    '14 preloaded/saved emotion presets persisted to EmotionPresets.json.',
    'Material UV-driven eye jitter mechanics & lip-sync integration.',
    'Press E for details.'
  ], ACC), 'Read full UNOMi Slate UI details', () => hooks.job());

  act(plaque(3.65, 1.84, -25.82, 0, 3.35, 1.95, 'How I Work // Cross-DCC Team', [
    C.job.shortDates + ' | ASU Senior Capstone (CSE 485) + Pixel Pirate Studio.',
    'Repo: UNOMi-Solutions/Unreal_Engine_Plugin.',
    'Git/GitHub, Taiga, Discord, Zoom across Unreal 5.8, Blender, Maya & Cinema 4D.'
  ], CY), 'Read How I Work details', () => hooks.how());

  addServerRack(6.2, -25.1, -Math.PI * 0.75);
  addCableBundle(1.8, -18.0, 2.6, 0.2);

  // Interactive Tech Island (East-Center): SFacialExpressionPanel + Primitive Head + UV Eye Jitter Demo
  const wbX = 2.6, wbZ = -18.0;
  sSolid(1.2, 0.94, 3.2, 'desk', wbX, 0.47, wbZ);
  sBox(1.26, 0.05, 3.26, 'steel', wbX, 0.955, wbZ);
  sBox(0.46, 0.24, 0.46, 'steel', wbX + 0.08, 1.1, wbZ - 0.1);

  const eyeTexL = makeEyeTexture(), eyeTexR = makeEyeTexture();
  const faceRig = new THREE.Group();
  faceRig.position.set(wbX + 0.08, 1.62, wbZ - 0.1);
  faceRig.rotation.y = -Math.PI / 2; // faces west toward visitor browsing media wall
  scene.add(faceRig);
  const headMat = new THREE.MeshStandardMaterial({ color: 0x3b4048, roughness: 0.48, metalness: 0.25 });
  const faceHeadMesh = new THREE.Mesh(new THREE.SphereGeometry(0.27, 24, 18), headMat);
  faceHeadMesh.scale.set(0.92, 1.12, 0.96);
  faceRig.add(faceHeadMesh);
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.16, 16), mat.steel);
  collar.position.set(0, -0.32, 0); faceRig.add(collar);

  const eyeGeo = new THREE.PlaneGeometry(0.11, 0.085);
  const eyeL = new THREE.Mesh(eyeGeo, new THREE.MeshBasicMaterial({ map: eyeTexL }));
  const eyeR = new THREE.Mesh(eyeGeo, new THREE.MeshBasicMaterial({ map: eyeTexR }));
  eyeL.position.set(-0.095, 0.055, 0.245); eyeL.rotation.y = -0.18;
  eyeR.position.set(0.095, 0.055, 0.245); eyeR.rotation.y = 0.18;
  faceRig.add(eyeL, eyeR);

  const lidL = box(0.12, 0.018, 0.025, mat.dark, -0.095, 0.095, 0.252, faceRig);
  const lidR = box(0.12, 0.018, 0.025, mat.dark, 0.095, 0.095, 0.252, faceRig);
  const browL = box(0.115, 0.022, 0.03, mat.btnCyan, -0.095, 0.135, 0.25, faceRig);
  const browR = box(0.115, 0.022, 0.03, mat.btnCyan, 0.095, 0.135, 0.25, faceRig);
  const mouthC = box(0.11, 0.026, 0.025, mat.btnAcc, 0, -0.11, 0.25, faceRig);
  const mouthL = box(0.055, 0.022, 0.025, mat.btnAcc, -0.072, -0.105, 0.242, faceRig);
  const mouthR = box(0.055, 0.022, 0.025, mat.btnAcc, 0.072, -0.105, 0.242, faceRig);

  const presets = [
    { name: 'NEUTRAL',  mouth: 0.15, brow: 0.10, tilt: 0.0,  open: 0.15, probs: [0.82, 0.08, 0.05, 0.05] },
    { name: 'JOY',      mouth: 0.92, brow: 0.45, tilt: 0.22, open: 0.65, probs: [0.06, 0.86, 0.05, 0.03] },
    { name: 'SURPRISE', mouth: 0.55, brow: 0.95, tilt: 0.15, open: 1.00, probs: [0.05, 0.11, 0.79, 0.05] },
    { name: 'FOCUS',    mouth: 0.25, brow: 0.65, tilt: -0.35, open: 0.12, probs: [0.14, 0.06, 0.08, 0.72] },
    { name: 'TENSION',  mouth: 0.75, brow: 0.85, tilt: -0.55, open: 0.48, probs: [0.04, 0.05, 0.14, 0.77] }
  ];
  let presetIdx = 1, mouthT = presets[1].mouth, browT = presets[1].brow, tiltT = presets[1].tilt, openT = presets[1].open;
  let mouthV = mouthT, browV = browT, tiltV = tiltT, openV = openT;
  const jitterModes = [
    { name: 'OFF', amp: 0, rate: 0 },
    { name: 'SUBTLE', amp: 0.045, rate: 4.5 },
    { name: 'ACTIVE', amp: 0.105, rate: 8.5 }
  ];
  let jitterIdx = 1, lastJit = 0, jitU = 0, jitV = 0;

  // Live in-world SFacialExpressionPanel readout next to head
  const slatePanel = sign(1.18, 0.84, () => {}, wbX + 0.02, 1.38, wbZ + 0.95, -Math.PI / 2 + 0.22, false);
  sBox(0.05, 0.90, 1.24, 'dark', wbX + 0.08, 1.38, wbZ + 0.96, 0, 0.22, 0);

  function drawSlatePanel() {
    const g = slatePanel.userData.g, w = g.canvas.width, h = g.canvas.height;
    const p = presets[presetIdx], jm = jitterModes[jitterIdx];
    g.fillStyle = '#0e1116'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#191e26'; g.fillRect(0, 0, w, 28);
    g.fillStyle = ACC; g.font = `700 12px ${M}`; g.fillText('SFacialExpressionPanel // Interactive Demo', 10, 19);
    g.fillStyle = CY; g.font = `700 14px ${M}`; g.fillText('EMOTION PRESET: ' + p.name, 10, 48);
    ['NEU', 'JOY', 'SUR', 'FOC'].forEach((lb, i) => {
      const y = 60 + i * 18;
      g.fillStyle = '#8b93a0'; g.font = `11px ${M}`; g.fillText(lb, 10, y + 10);
      g.fillStyle = '#1f252e'; g.fillRect(44, y, w - 96, 10);
      g.fillStyle = i === 1 ? ACC : CY; g.fillRect(44, y, (w - 96) * p.probs[i], 10);
      g.fillStyle = '#d7d2c6'; g.fillText(Math.round(p.probs[i] * 100) + '%', w - 44, y + 10);
    });
    const drawSlider = (label, val, y, col) => {
      g.fillStyle = '#c8c2b4'; g.font = `11px ${M}`; g.fillText(label + ': ' + Math.round(val * 100) + '%', 10, y);
      g.fillStyle = '#1f252e'; g.fillRect(10, y + 5, w - 20, 8);
      g.fillStyle = col; g.fillRect(10, y + 5, (w - 20) * val, 8);
    };
    drawSlider('Morph_MouthBlend', mouthT, 148, ACC);
    drawSlider('Morph_BrowWeight', browT, 176, CY);
    g.fillStyle = '#e6decb'; g.font = `11px ${M}`;
    g.fillText(`MatUV Eye Jitter [${jm.name}] dU:${jitU.toFixed(3)} dV:${jitV.toFixed(3)}`, 10, h - 10);
    slatePanel.userData.t.needsUpdate = true;
  }
  drawSlatePanel();

  // Tactile non-blinding workbench buttons along west edge of island
  const bPreset = box(0.18, 0.055, 0.24, mat.btnCyan, wbX - 0.38, 1.0, wbZ + 0.92);
  act(bPreset, 'Cycle Emotion Engine preset (' + presets[presetIdx].name + ')', () => {
    presetIdx = (presetIdx + 1) % presets.length;
    const p = presets[presetIdx];
    mouthT = p.mouth; browT = p.brow; tiltT = p.tilt; openT = p.open;
    bPreset.userData.act.label = 'Cycle Emotion Engine preset (' + p.name + ')';
    drawSlatePanel();
    hooks.toast('Emotion preset: ' + p.name);
  });

  const sMouth = box(0.18, 0.055, 0.24, mat.btnAcc, wbX - 0.38, 1.0, wbZ + 0.30);
  act(sMouth, 'Step Mouth morph-target slider', () => {
    mouthT = ((Math.round(mouthT * 3) + 1) % 4) / 3;
    openT = mouthT * 0.85;
    drawSlatePanel();
    hooks.toast('Mouth morph target: ' + Math.round(mouthT * 100) + '%');
  });

  const sBrow = box(0.18, 0.055, 0.24, mat.btnAcc, wbX - 0.38, 1.0, wbZ - 0.32);
  act(sBrow, 'Step Brow morph-target slider', () => {
    browT = ((Math.round(browT * 3) + 1) % 4) / 3;
    drawSlatePanel();
    hooks.toast('Brow morph target: ' + Math.round(browT * 100) + '%');
  });

  const dJit = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.055, 16), mat.btnMag);
  dJit.position.set(wbX - 0.38, 1.0, wbZ - 0.94); scene.add(dJit);
  act(dJit, 'Cycle Material UV eye jitter (' + jitterModes[jitterIdx].name + ')', () => {
    jitterIdx = (jitterIdx + 1) % jitterModes.length;
    const jm = jitterModes[jitterIdx];
    dJit.userData.act.label = 'Cycle Material UV eye jitter (' + jm.name + ')';
    if (jm.amp === 0) { jitU = 0; jitV = 0; eyeTexL.offset.set(0, 0); eyeTexR.offset.set(0, 0); }
    drawSlatePanel();
    hooks.toast('Material UV eye jitter: ' + jm.name);
  });

  // Honest label on south face of tech island
  plaque(wbX - 0.61, 0.56, wbZ, -Math.PI / 2, 2.5, 0.52, 'Interactive Control Panel Demo', 'Illustration of the kind of control panel I work on. Not the production plugin. See the west wall for real UNOMi captures.', ACC);

  anim.push((t, dt) => {
    const k = Math.min(1, dt * 7);
    mouthV += (mouthT - mouthV) * k; browV += (browT - browV) * k; tiltV += (tiltT - tiltV) * k; openV += (openT - openV) * k;
    faceRig.rotation.y = -Math.PI / 2 + (REDUCED ? 0 : Math.sin(t * 0.7) * 0.24);
    mouthC.scale.set(0.75 + mouthV * 0.85, 0.7 + openV * 1.65, 1);
    mouthL.position.y = -0.11 + (mouthV - 0.35) * 0.055; mouthR.position.y = -0.11 + (mouthV - 0.35) * 0.055;
    mouthL.rotation.z = (mouthV - 0.35) * 0.55; mouthR.rotation.z = -(mouthV - 0.35) * 0.55;
    browL.position.y = 0.125 + browV * 0.055; browR.position.y = 0.125 + browV * 0.055;
    browL.rotation.z = tiltV * 0.45; browR.rotation.z = -tiltV * 0.45;
    const blink = (!REDUCED && (t % 4.2) > 4.08) ? 0.055 : 0.095 + openV * 0.012;
    lidL.position.y = blink; lidR.position.y = blink;
    const jm = jitterModes[jitterIdx];
    if (jm.amp > 0 && !REDUCED && t - lastJit > (1 / jm.rate)) {
      lastJit = t;
      jitU = (Math.sin(t * 37.3) * 0.6 + Math.cos(t * 91.7) * 0.4) * jm.amp;
      jitV = (Math.cos(t * 53.1) * 0.6 + Math.sin(t * 29.4) * 0.4) * jm.amp * 0.65;
      eyeTexL.offset.set(jitU, jitV); eyeTexR.offset.set(jitU, jitV);
      drawSlatePanel();
    }
  });

  /* Short transition corridor (z: -26..-30) linking UNOMi Showcase to Project Hall */
  addFloor(-2.2, 2.2, -30, -26);
  addCeiling(-2.2, 2.2, -30, -26, 3.4, true);
  sSolid(0.28, 3.4, 4, 'wall', -2.34, 1.7, -28);
  addWindowWallX(2.2, -30, -26, 3.4, -29.4, -26.6, 1.3, 2.5, 1, false);
  addBaseboards(-2.2, 2.2, -30, -26, false, false);
  plaque(-2.05, 1.68, -28.0, Math.PI / 2, 2.8, 1.5, 'Arizona State University // Expected 2027', [C.edu.degree, 'Senior standing. Capstone CSE 485 (UNOMi).'], CY);
  await step('UNOMi Showcase');

  /* =========================================================================
     3. PROJECT HALL (Center: Battle Tetris | West: Surf + Surfboard | East: Rhythm)
     ========================================================================= */
  addFloor(-11, 11, -52, -30);
  addCeiling(-11, 11, -52, -30, 6.2, true);
  addWindowWallX(-11, -52, -30, 6.2, -50.2, -31.8, 0.4, 5.5, -1, false);
  addWindowWallX(11, -52, -36.5, 6.2, -50.2, -37.2, 0.4, 5.5, 1, false);
  addWindowWallX(11, -36.5, -30, 6.2, -36.0, -31.6, 0, 3.6, 1, true);
  addDoorWallZ(-11, 11, -30, 6.2, 1, 'acc');
  addDoorWallZ(-11, 11, -52, 6.2, -1, 'cyan');
  addLight(-5.5, 5.55, -41, 0xff9d4d, 56, 28);
  addLight(5.5, 5.55, -41, 0x4be8d2, 50, 28);
  addShaft(0, 6.0, -41, 1.0, 3.2, 5.6, false);
  addShaft(-7.2, 6.0, -41, 0.8, 2.5, 5.6, true);
  neonLabel('PROJECTS // LIVE DEMOS', 0, 5.15, -51.8, 0, ACC, 4.6, 0.42, flickers, reflectionGroup);
  neonLabel('SKILLS & COURSEWORK', 0, 2.86, -51.66, 0, CY, 2.8, 0.28, null, reflectionGroup);
  neonLabel('OVERLOOK & PARKOUR', 10.85, 3.85, -33.8, -Math.PI / 2, CY, 3.0, 0.28, null, reflectionGroup);

  addServerRack(-9.8, -50.8, Math.PI * 0.25);
  addServerRack(9.8, -50.8, -Math.PI * 0.25);

  const caseKiosk = (i, x, z, ry) => {
    const p = C.projects[i];
    sSolid(2.3, 0.42, 0.34, 'steel', x, 0.21, z);
    sBox(2.34, 2.08, 0.14, 'dark', x, 1.44, z, 0, ry, 0);
    sBox(2.38, 0.04, 0.18, i === 1 ? 'cyan' : 'acc', x, 2.49, z, 0, ry, 0);
    const fx = Math.sin(ry) * 0.09, fz = Math.cos(ry) * 0.09;
    return act(
      plaque(x + fx, 1.44, z + fz, ry, 2.22, 1.96, p.name, [
        'Architecture: ' + p.flow.join(' -> '),
        '',
        'Press E for full Case Study.',
        'Press E on the station screen to PLAY LIVE.'
      ], i === 1 ? CY : ACC),
      'Read ' + p.name + ' case study',
      () => hooks.project(i)
    );
  };

  // CENTER HERO: Project 0 — Multiplayer Battle Tetris (twin facing arcade cabinets at x = -2.0 & +2.0)
  const pal = ['#ff5a1f', '#ffb84d', '#3dffe3', '#efe8da', '#ff2a85', '#6fa8a2'];
  const makeCabinet = (x, ry, sd) => {
    const g = new THREE.Group(); g.position.set(x, 0, -40.8); g.rotation.y = ry; scene.add(g);
    const body = box(0.96, 1.92, 0.86, mat.black, 0, 0.96, 0, g);
    box(1.0, 0.36, 0.96, mat.steel, 0, 2.08, 0.05, g);
    box(0.86, 0.18, 0.04, mat.acc, 0, 2.08, 0.54, g);
    box(0.98, 0.12, 0.32, mat.steel, 0, 0.96, 0.46, g);
    box(0.06, 0.08, 0.06, mat.btnCyan, -0.24, 1.05, 0.52, g);
    box(0.18, 0.04, 0.1, mat.btnAcc, 0.16, 1.03, 0.52, g);
    // Detailed back panel: steel hatch, cooling vents, trim strip
    box(0.76, 1.1, 0.04, mat.trim, 0, 0.88, -0.44, g);
    for (let v = 0; v < 5; v++) box(0.56, 0.04, 0.06, mat.steel, 0, 1.54 + v * 0.075, -0.44, g);
    box(0.82, 0.03, 0.04, mat.cyan, 0, 0.22, -0.44, g);
    const cv = document.createElement('canvas'); cv.width = 160; cv.height = 200;
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.76, 0.95), new THREE.MeshBasicMaterial({ map: tex }));
    scr.position.set(0, 1.42, 0.44); g.add(scr);
    addBox(x - 0.52, -41.32, x + 0.52, -40.28);
    for (const o of [body, scr]) act(o, 'PLAY Multiplayer Battle Tetris (live iframe)', () => hooks.play(0));
    let s = sd, rows = Array.from({ length: 12 }, () => Array(10).fill(0)), accT = 0;
    const r2 = () => (s = s * 16807 % 2147483647) / 2147483647;
    anim.push((t, dt) => {
      accT += dt; if (accT < 0.16) return; accT = 0;
      rows.pop(); rows.unshift(Array.from({ length: 10 }, () => r2() < 0.3 ? 1 + (r2() * 6 | 0) : 0));
      const g2 = cv.getContext('2d'); g2.fillStyle = '#090b0d'; g2.fillRect(0, 0, 160, 200);
      rows.forEach((r, y) => r.forEach((c, cx) => { if (c) { g2.fillStyle = pal[c - 1]; g2.fillRect(cx * 16 + 1, y * 15 + 1, 14, 13); } }));
      g2.fillStyle = ACC; g2.font = `700 13px ${M}`; g2.fillText('1UP BATTLE // E: PLAY', 6, 194);
      tex.needsUpdate = true;
    });
  };
  makeCabinet(-2.0, Math.PI / 2, 11);
  makeCabinet(2.0, -Math.PI / 2, 29);
  addHazard(0, -40.8, 2.8, 0.22, 0);
  caseKiosk(0, 0, -45.6, 0);

  // WEST SIDE: Project 1 — Real-Time Surf Report (surf-report) + Sculpted 3D Surfboard!
  sSolid(2.7, 0.92, 1.5, 'desk', -7.0, 0.46, -40.8);
  sBox(2.76, 0.04, 1.56, 'cyan', -7.0, 0.93, -40.8);
  caseKiosk(1, -7.0, -45.6, 0);
  const surfboard = buildSurfboard(-9.2, -41.1, 0.42);
  act(surfboard, 'PLAY Real-Time Surf Report (surf-report)', () => hooks.play(1));

  const tide = sign(2.25, 1.22, () => {}, -7.15, 0.96, -40.8, 0, false);
  tide.rotation.set(-Math.PI / 2, 0, 0);
  act(tide, 'PLAY Real-Time Surf Report (live app)', () => hooks.play(1));
  anim.push((t) => {
    const g = tide.userData.g, w = g.canvas.width, h = g.canvas.height;
    g.fillStyle = '#0c1114'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(61,255,227,0.16)'; g.lineWidth = 1;
    for (let y = 40; y < h; y += 44) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    g.strokeStyle = CY; g.lineWidth = 4; g.beginPath();
    const tt = REDUCED ? 0 : t;
    for (let x = 0; x <= w; x += 6) {
      const y = h * 0.56 + Math.sin(x / 88 + tt * 0.55) * h * 0.25 + Math.sin(x / 31 + tt * 0.35) * h * 0.05;
      x ? g.lineTo(x, y) : g.moveTo(x, y);
    }
    g.stroke();
    g.fillStyle = '#e6decb'; g.font = `700 18px ${M}`; g.fillText('24H TIDE & SWELL // E TO LAUNCH SURF-REPORT', 14, 30);
    tide.userData.t.needsUpdate = true;
  });
  const tg = new THREE.PlaneGeometry(0.84, 0.52, 24, 8);
  const tank = new THREE.Mesh(tg, new THREE.MeshStandardMaterial({ color: 0x269e92, emissive: 0x0d3834, roughness: 0.2, metalness: 0.2 }));
  tank.rotation.x = -Math.PI / 2; tank.position.set(-6.25, 1.2, -40.8); scene.add(tank);
  const gl = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.54, 0.56), mat.railing);
  gl.position.set(-6.25, 1.22, -40.8); scene.add(gl);
  act(gl, 'PLAY Real-Time Surf Report (live app)', () => hooks.play(1));
  anim.push(t => {
    if (REDUCED) return;
    const p = tg.attributes.position;
    for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 9 - t * 2.2) * 0.036 + Math.sin(p.getY(i) * 7 + t) * 0.012);
    p.needsUpdate = true; tg.computeVertexNormals();
  });

  // EAST FLANK (tucked off to the side): Project 2 — Web Audio Rhythm Generator
  const rbX = 7.4, rbZ = -42.6;
  sSolid(3.3, 2.9, 0.24, 'dark', rbX, 1.45, rbZ - 1.55);
  sSolid(0.24, 2.9, 3.0, 'dark', rbX - 1.58, 1.45, rbZ);
  sSolid(0.24, 2.9, 3.0, 'dark', rbX + 1.58, 1.45, rbZ);
  sBox(3.4, 0.16, 3.2, 'steel', rbX, 2.98, rbZ);
  for (let i = 0; i < 6; i++) {
    sBox(0.05, 2.35, 0.12, 'trim', rbX - 1.43, 1.42, rbZ - 1.1 + i * 0.4);
    sBox(0.05, 2.35, 0.12, 'trim', rbX + 1.43, 1.42, rbZ - 1.1 + i * 0.4);
  }
  sBox(2.6, 0.04, 0.06, 'cyan', rbX, 2.82, rbZ);
  addCableBundle(rbX, rbZ - 2.3, 1.2, Math.PI / 2);

  const hw = sign(2.55, 2.05, () => {}, rbX, 1.52, rbZ - 1.40, 0, false);
  const hg = hw.userData.g;
  const notes = Array.from({ length: 40 }, (_, i) => [i * 0.55, rnd() * 4 | 0]);
  act(hw, 'PLAY Web Audio Rhythm Generator (live iframe)', () => hooks.play(2));
  act(plaque(rbX - 1.72, 1.65, rbZ, -Math.PI / 2, 2.2, 1.85, C.projects[2].name, [
    'Pipeline: ' + C.projects[2].flow.join(' -> '),
    '',
    'Press E for full Case Study.',
    'Step inside booth & press E on screen to PLAY.'
  ], CY), 'Read Rhythm Generator case study', () => hooks.project(2));

  sSolid(2.1, 0.9, 0.48, 'desk', rbX, 0.45, rbZ + 0.85);
  act(box(0.24, 0.055, 0.18, mat.btnAcc, rbX, 0.93, rbZ + 0.96), 'Start or stop live Web Audio synth analyser', () => {
    const on = audio.synth(!audio.isLoop());
    hooks.toast(on ? 'Synth loop ON — live FFT analyser driving lanes' : 'Synth loop OFF');
  });
  anim.push((t) => {
    const w = hg.canvas.width, h = hg.canvas.height, lv = audio.levels();
    hg.fillStyle = '#0c0f14'; hg.fillRect(0, 0, w, h);
    const pad = w * 0.08, lw = (w - pad * 2) / 4;
    for (let i = 0; i < 4; i++) {
      hg.fillStyle = i % 2 === 0 ? `rgba(255,90,31,${0.10 + lv[i] * 0.72})` : `rgba(61,255,227,${0.09 + lv[i] * 0.72})`;
      hg.fillRect(pad + i * lw + 4, 0, lw - 8, h);
    }
    hg.fillStyle = '#f2ebdc';
    for (const [n, l] of notes) {
      const y = (((REDUCED ? 1.2 : t * 1.3) + n * 1.7) % 6) / 6 * (h - 70);
      hg.fillRect(pad + l * lw + 10, y, lw - 20, 16);
    }
    hg.fillStyle = ACC; hg.fillRect(pad, h - 62, w - pad * 2, 5);
    hg.fillStyle = '#d8d2c3'; hg.font = `700 22px ${M}`;
    ['D', 'F', 'J', 'K'].forEach((k, i) => hg.fillText(k, pad + i * lw + lw * 0.42, h - 26));
    hg.font = `15px ${M}`;
    hg.fillText(audio.isLoop() ? 'LIVE FFT ANALYSER // E ON SCREEN TO PLAY' : 'ORANGE BUTTON: AUDIO // E ON SCREEN: PLAY', pad, 28);
    hw.userData.t.needsUpdate = true;
  });

  /* =========================================================================
     SKY OVERLOOK BALCONY (Z-fight FIXED!) + EXTERIOR SKYWAY PARKOUR COURSE
     ========================================================================= */
  // Deck surface sits cleanly at y = 0.0; structural steel slab lowered to y = -0.22 (top at -0.06, ZERO z-fighting!)
  addFloor(11.0, 14.6, -36.0, -31.6, true);
  sBox(3.7, 0.30, 4.5, 'steel', 12.85, -0.21, -33.8);
  // Diagonal cantilever support trusses anchoring the balcony into the skyscraper tower wall
  for (const tz of [-35.4, -32.2]) {
    sBox(4.4, 0.28, 0.28, 'steel', 12.6, -1.75, tz, 0, 0, 0.72);
  }
  // Railings on East and South sides; North side has open Parkour Launch Gate (x: 12.1..14.5)
  addBox(14.55, -36.0, 14.8, -31.5);
  addBox(11.0, -31.65, 14.7, -31.4);
  addBox(11.0, -36.2, 12.1, -35.95); // partial north rail leaving launch gap open!
  sBox(0.08, 0.08, 4.5, 'steel', 14.6, 1.15, -33.8);
  sBox(3.6, 0.08, 0.08, 'steel', 12.8, 1.15, -31.6);
  sBox(1.1, 0.08, 0.08, 'steel', 11.55, 1.15, -36.0);
  sBox(0.04, 0.03, 4.4, 'cyan', 14.55, 1.09, -33.8);
  for (const [px, pz] of [[14.6, -36.0], [14.6, -33.8], [14.6, -31.6], [12.8, -31.6], [12.1, -36.0]]) {
    sBox(0.08, 1.15, 0.08, 'steel', px, 0.575, pz);
  }
  const bGlassE = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 1.08), mat.railing);
  bGlassE.position.set(14.6, 0.58, -33.8); bGlassE.rotation.y = -Math.PI / 2; scene.add(bGlassE);
  const bGlassS = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 1.08), mat.railing);
  bGlassS.position.set(12.8, 0.58, -31.6); scene.add(bGlassS);
  const bGlassN = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.08), mat.railing);
  bGlassN.position.set(11.55, 0.58, -36.0); scene.add(bGlassN);

  addHazard(13.3, -35.8, 2.2, 0.34, 0);
  neonLabel('SKYWAY PARKOUR // SPACE TO JUMP', 13.3, 2.2, -36.0, 0, CY, 2.6, 0.32, null, null);

  // 9 Ascending Exterior Cyberpunk Parkour Platforms hugging the east skyscraper wall
  const parkourPads = [
    { x: 13.3, z: -37.6, w: 1.8, d: 1.6, y: 0.45, col: 'cyan' },
    { x: 14.4, z: -39.7, w: 1.7, d: 1.6, y: 1.05, col: 'acc' },
    { x: 12.8, z: -41.8, w: 1.7, d: 1.6, y: 1.65, col: 'cyan' },
    { x: 14.5, z: -43.9, w: 1.6, d: 1.5, y: 2.30, col: 'acc' },
    { x: 13.1, z: -46.0, w: 1.7, d: 1.5, y: 2.95, col: 'cyan' },
    { x: 14.6, z: -48.0, w: 1.6, d: 1.5, y: 3.60, col: 'acc' },
    { x: 12.9, z: -50.0, w: 1.7, d: 1.5, y: 4.25, col: 'cyan' },
    { x: 14.2, z: -51.6, w: 1.6, d: 1.4, y: 4.85, col: 'acc' },
    { x: 13.8, z: -53.8, w: 2.8, d: 2.6, y: 5.40, col: 'acc', summit: true }
  ];
  let summitBeacon = null;
  for (const pad of parkourPads) {
    addPlatform(pad.x - pad.w / 2, pad.z - pad.d / 2, pad.x + pad.w / 2, pad.z + pad.d / 2, pad.y, 0.24);
    // Steel platform slab + glowing neon edge rim + underside thruster glow
    sBox(pad.w, 0.22, pad.d, 'steel', pad.x, pad.y - 0.11, pad.z);
    sBox(pad.w + 0.06, 0.04, 0.05, pad.col, pad.x, pad.y - 0.01, pad.z + pad.d / 2);
    sBox(pad.w + 0.06, 0.04, 0.05, pad.col, pad.x, pad.y - 0.01, pad.z - pad.d / 2);
    sBox(0.05, 0.04, pad.d + 0.06, pad.col, pad.x + pad.w / 2, pad.y - 0.01, pad.z);
    if (pad.summit) {
      neonLabel('SUMMIT // LEVEL 19', pad.x, pad.y + 1.55, pad.z - 1.1, 0, ACC, 2.6, 0.36, null, null);
      summitBeacon = new THREE.Mesh(new THREE.OctahedronGeometry(0.32, 0), mat.acc);
      summitBeacon.position.set(pad.x, pad.y + 0.72, pad.z);
      scene.add(summitBeacon);
      act(summitBeacon, 'Return to Sky Overlook Balcony', () => hooks.toast('Nice climb! Press M to fast-travel or jump down to respawn on the balcony.'));
    }
  }
  await step('Project hall & Parkour');

  /* =========================================================================
     4. SKILLS & ACTUAL ASU COURSEWORK WORKSHOP
     ========================================================================= */
  addFloor(-6, 6, -64, -52);
  addCeiling(-6, 6, -64, -52, 4.5, false);
  sSolid(0.28, 4.5, 12, 'wall', -6.14, 2.25, -58);
  sSolid(0.28, 4.5, 12, 'wall', 6.14, 2.25, -58);
  addDoorWallZ(-6, 6, -52, 4.5, 1, 'cyan');
  addDoorWallZ(-6, 6, -64, 4.5, -1, 'acc');
  addBaseboards(-6, 6, -64, -52, false, false);
  addLight(0, 4.05, -58, 0xffb870, 46, 22);
  addShaft(0, 4.4, -58, 0.7, 2.3, 4.1, false);
  neonLabel('SKILLS & ASU COURSEWORK', 0, 3.7, -63.8, 0, ACC, 3.8, 0.36, null, reflectionGroup);
  neonLabel('CONTACT', 0, 2.86, -63.78, 0, ACC, 1.6, 0.28, null, reflectionGroup);

  const pb = sign(10.2, 3.3, (g, w, h) => {
    g.fillStyle = '#1b1f25'; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(0,0,0,0.48)';
    for (let x = 24; x < w; x += 38) for (let y = 24; y < h; y += 38) g.fillRect(x, y, 5, 5);
  }, -5.92, 2.05, -58, Math.PI / 2);
  act(pb, 'Read full skills list', () => hooks.skills());
  Object.entries(C.skills).forEach(([cat, items], r) => {
    const y = 3.22 - r * 0.96;
    const hs = items.map(() => 0.25 + rnd() * 0.05);
    const ws = items.map((t, i) => hs[i] * (t.length * 0.28 + 0.75));
    const tot = ws.reduce((a, b) => a + b, 0) + items.length * 0.12;
    const k = Math.min(1, 9.6 / tot);
    sign(3.4, 0.3, (g, w, h) => {
      g.fillStyle = r === 1 ? CY : ACC; g.font = `700 ${Math.round(h * 0.62)}px ${M}`; g.fillText(cat.toUpperCase(), 0, h * 0.72, w);
    }, -5.88, y + 0.31, -54.7, Math.PI / 2, false);
    let u = 0;
    items.forEach((t, i) => {
      const h = hs[i] * k, w = ws[i] * k;
      const m = sign(w, h, (g, cw, ch) => {
        g.fillStyle = '#111317'; g.fillRect(0, 0, cw, ch);
        g.fillStyle = r === 1 ? CY : ACC; g.fillRect(0, 0, 6, ch);
        g.fillStyle = '#efe8da'; g.font = `600 ${Math.round(ch * 0.46)}px ${M}`; g.textBaseline = 'middle';
        g.fillText(t, ch * 0.36, ch * 0.54, cw - ch * 0.46);
      }, -5.86, y - 0.1 - rnd() * 0.08, -53.2 - u - w / 2, Math.PI / 2);
      m.rotation.z = (rnd() - 0.5) * 0.04;
      act(m, 'Read full skills list', () => hooks.skills());
      u += w + 0.12 * k;
    });
  });

  // East wall: Actual ASU Coursework bookshelf showing real course numbers (CSE 485, CSE 445, CSE 464, etc.)
  const shelfLen = Math.max(4.6, C.courses.length * 0.46 + 0.4);
  sSolid(0.55, 2.25, shelfLen, 'steel', 5.68, 1.125, -59.7);
  const shelfHit = box(0.6, 2.25, shelfLen, new THREE.MeshBasicMaterial({ visible: false }), 5.68, 1.125, -59.7);
  act(shelfHit, 'Read ASU coursework (CSE 485, 445, 464, 330...)', () => hooks.courses());
  const spineCols = ['#c25927', '#2b8a82', '#a87d32', '#4c5763', '#8c3b55', '#3d7068', '#996038', '#38637a', '#7c6b3b', '#564c72'];
  const startZ = -59.7 + (C.courses.length - 1) * 0.22;
  C.courses.forEach((t, i) => {
    const hh = 1.62 + (i % 3) * 0.14;
    const m = sign(0.40, hh, (g, cw, ch) => {
      g.fillStyle = spineCols[i % spineCols.length]; g.fillRect(0, 0, cw, ch);
      g.save(); g.translate(cw / 2, ch / 2); g.rotate(-Math.PI / 2);
      g.fillStyle = '#0e0f12'; g.font = `700 ${Math.round(cw * 0.36)}px ${H}`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(t, 0, 0, ch * 0.92); g.restore();
    }, 5.38, 0.25 + hh / 2, startZ - i * 0.44, -Math.PI / 2);
    act(m, 'Read ASU coursework list', () => hooks.courses());
  });
  act(plaque(5.84, 1.72, -54.5, -Math.PI / 2, 2.85, 1.75, 'ASU Coursework Supporting This Work', [C.support, '', 'Press E for full course list (CSE 485, 445, 460, 464, 330...).'], CY), 'Read ASU coursework details', () => hooks.courses());

  sSolid(2.1, 0.85, 0.85, 'desk', -3.7, 0.425, -62.9);
  addMonitor(-4.1, 0.86, -63.0, 0.15, 'UE5.8 // C++ BUILD');
  addMonitor(-3.3, 0.86, -63.0, -0.15, 'CSE 445 // WS NODE');
  addCableBundle(-2.2, -62.7, 1.8, 0.3);
  addServerRack(4.6, -63.0, -Math.PI * 0.8);
  await step('Skills workshop');

  /* =========================================================================
     5. CONTACT OFFICE (Quiet corner office + city corner glass + coffee steam)
     ========================================================================= */
  addFloor(-4, 4, -74, -64);
  addCeiling(-4, 4, -74, -64, 3.8, false);
  sSolid(0.28, 3.8, 10, 'wall', -4.14, 1.9, -69);
  sSolid(5.5, 3.8, 0.28, 'wall', -1.25, 1.9, -74.14);
  sBox(2.5, 0.45, 0.28, 'wall', 2.75, 0.225, -74.14);
  sBox(2.5, 0.45, 0.28, 'wall', 2.75, 3.575, -74.14);
  addBox(1.5, -74.28, 4.0, -74.0);
  const cornerGlass = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 2.9), mat.glass);
  cornerGlass.position.set(2.75, 1.9, -74.0); scene.add(cornerGlass);
  addWindowWallX(4, -74, -64, 3.8, -72.8, -65.2, 0.45, 3.35, 1, false);
  addDoorWallZ(-4, 4, -64, 3.8, 1, 'acc');
  addBaseboards(-4, 4, -74, -64, true, false);
  addLight(0, 3.35, -69, 0xffaa58, 34, 18);
  addShaft(-0.3, 3.7, -70.6, 0.45, 1.6, 3.4, false);
  neonLabel('CONTACT OFFICE', -1.25, 3.15, -73.84, 0, ACC, 2.6, 0.34, null, reflectionGroup);

  sSolid(2.8, 0.8, 1.05, 'desk', -0.4, 0.4, -70.8);
  addMonitor(0.45, 0.81, -70.95, -0.3, 'FOSTER // CONTACT');
  const cards = box(0.24, 0.09, 0.14, mat.paper, -1.0, 0.85, -70.55);
  box(0.24, 0.014, 0.14, mat.btnAcc, -1.0, 0.90, -70.55);
  act(cards, 'Copy email (' + C.email + ')', () => hooks.email());

  act(plaque(-2.55, 1.72, -73.84, 0, 2.25, 1.08, 'GitHub', 'FosterBright18 — Press E to open.', CY), 'Open GitHub profile', () => hooks.gh());
  act(plaque(-0.05, 1.72, -73.84, 0, 2.25, 1.08, 'LinkedIn', 'Press E to open profile.', ACC), 'Open LinkedIn profile', () => hooks.li());

  const pr = solid(0.8, 0.8, 0.62, mat.steel, -3.35, 0.4, -66.5);
  act(box(0.7, 0.3, 0.5, mat.paper, -3.35, 0.95, -66.5), 'Print 1-page resume', () => hooks.resume());
  act(pr, 'Print 1-page resume', () => hooks.resume());

  const cm = solid(0.55, 0.8, 0.48, mat.steel, -3.35, 0.4, -69.5);
  const cmt = box(0.42, 0.5, 0.32, mat.black, -3.35, 1.05, -69.5);
  box(0.06, 0.04, 0.02, mat.acc, -3.13, 1.18, -69.5);
  let steamBoost = 0;
  const puffs = Array.from({ length: 7 }, () => {
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.052, 8, 6), new THREE.MeshBasicMaterial({ color: 0xded9cf, transparent: true, opacity: 0.14, depthWrite: false }));
    steamGroup.add(s); return s;
  });
  for (const o of [cm, cmt]) act(o, 'Brew fresh coffee', () => { steamBoost = 6; hooks.toast('Brewing late-night coffee'); });

  /* =========================================================================
     INSTANCED SERVER RACK LEDs + FLUSH MERGED STATIC GEOMETRY
     ========================================================================= */
  const ledMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.045, 0.032, 0.025), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }), ledPos.length);
  scene.add(ledMesh);
  flushStatic(mat);

  let rainGlassActive = true;

  anim.push((t, dt) => {
    steamBoost = Math.max(0, steamBoost - dt);
    if (!REDUCED && rainGlassActive) rainGlassTex.offset.y = (t * 0.24) % 1;
    if (summitBeacon && !REDUCED) { summitBeacon.rotation.y = t * 1.4; summitBeacon.position.y = 6.12 + Math.sin(t * 2.2) * 0.12; }

    ledPos.forEach((p, i) => {
      const on = REDUCED ? true : Math.sin(t * (2.5 + (i % 4)) + p.phase) > -0.25;
      dummy.position.set(p.x, p.y, p.z);
      dummy.scale.setScalar(on ? 1 : 0.001);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      ledMesh.setMatrixAt(i, dummy.matrix);
      cTmp.setHex(p.kind < 0.52 ? 0x3dffe3 : p.kind < 0.90 ? 0xff7728 : 0xff2a85);
      ledMesh.setColorAt(i, cTmp);
    });
    ledMesh.instanceMatrix.needsUpdate = true;
    if (ledMesh.instanceColor) ledMesh.instanceColor.needsUpdate = true;

    beacons.forEach((b, i) => {
      const pulse = REDUCED ? 1 : (Math.sin(t * 2.1 + b.phase) > 0.25 ? 1 : 0.001);
      dummy.position.set(b.x, b.y, b.z);
      dummy.scale.setScalar(pulse);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      beaconMesh.setMatrixAt(i, dummy.matrix);
    });
    beaconMesh.instanceMatrix.needsUpdate = true;

    // 360 Flying Cars along both N-S and E-W elevated skyways
    for (let i = 0; i < carTotal; i++) {
      const c = cars[i];
      if (!REDUCED) {
        if (c.axis === 'z') {
          c.z += c.dir * c.speed * dt;
          if (c.z > 52) c.z = -118;
          if (c.z < -118) c.z = 52;
        } else {
          c.x += c.dir * c.speed * dt;
          if (c.x > 80) c.x = -80;
          if (c.x < -80) c.x = 80;
        }
      }
      const vis = i < activeCars ? 1 : 0.0001;
      const rotY = c.axis === 'z' ? 0 : Math.PI / 2;
      const dx = c.axis === 'x' ? c.dir * 1.15 : 0;
      const dz = c.axis === 'z' ? c.dir * 1.15 : 0;

      dummy.rotation.set(0, rotY, 0);
      dummy.scale.setScalar(vis);
      dummy.position.set(c.x, c.y, c.z);
      dummy.updateMatrix();
      carBodyMesh.setMatrixAt(i, dummy.matrix);

      dummy.position.set(c.x + dx, c.y, c.z + dz);
      dummy.updateMatrix();
      carHeadMesh.setMatrixAt(i, dummy.matrix);

      dummy.position.set(c.x - dx, c.y, c.z - dz);
      dummy.updateMatrix();
      carTailMesh.setMatrixAt(i, dummy.matrix);
    }
    carBodyMesh.instanceMatrix.needsUpdate = true;
    carHeadMesh.instanceMatrix.needsUpdate = true;
    carTailMesh.instanceMatrix.needsUpdate = true;

    if (rainMesh.visible) {
      for (let i = 0; i < rainTotal; i++) {
        const r = drops[i];
        if (!REDUCED) { r.y -= r.speed * dt; if (r.y < -4) r.y = 13; }
        const vis = i < activeRain ? 1 : 0.0001;
        dummy.position.set(r.x, r.y, r.z);
        dummy.scale.setScalar(vis);
        dummy.rotation.set(0, 0, 0.08);
        dummy.updateMatrix();
        rainMesh.setMatrixAt(i, dummy.matrix);
      }
      rainMesh.instanceMatrix.needsUpdate = true;
      dummy.rotation.set(0, 0, 0);
    }

    if (!REDUCED) {
      flickers.forEach((m, i) => {
        const s = Math.sin(t * (11 + i * 5)) * Math.sin(t * 27.3 + i);
        m.material.opacity = s > 0.94 ? 0.62 : 1.0;
      });
      billboards.forEach((b, i) => { b.material.opacity = 0.74 + Math.sin(t * 1.4 + i) * 0.06; });
    }

    if (steamGroup.visible) {
      puffs.forEach((s, i) => {
        const k = ((REDUCED ? 0.3 : t * 0.55) + i / 7) % 1;
        s.position.set(-3.35 + Math.sin(k * 8 + i) * 0.045, 1.32 + k * 0.72, -69.5);
        s.material.opacity = (1 - k) * (steamBoost > 0 ? 0.46 : 0.15);
      });
      citySteam.forEach((s, i) => {
        const k = ((REDUCED ? 0.4 : t * 0.12) + s.userData.phase) % 1;
        s.position.set(s.userData.bx, -2 + k * 14, s.userData.bz);
        s.scale.setScalar(0.8 + k * 1.3);
        s.material.opacity = (1 - k) * 0.085;
      });
    }
  });

  // Real graphics quality scaling (matched brightness across all 3 tiers!)
  function quality(lvl) {
    if (lvl === 'low') {
      rainMesh.visible = false; activeRain = 0;
      activeCars = 75;
      reflectionGroup.visible = false;
      steamGroup.visible = false;
      shaftGroup.visible = false;
      rainGlassActive = false;
      mat.floor.envMap = null; mat.floor.needsUpdate = true;
    } else if (lvl === 'medium') {
      rainMesh.visible = !REDUCED; activeRain = Math.floor(rainTotal * 0.42);
      activeCars = Math.floor(carTotal * 0.55);
      reflectionGroup.visible = true;
      steamGroup.visible = true;
      shaftGroup.visible = false;
      rainGlassActive = true;
      mat.floor.envMap = cityEnvMap; mat.floor.needsUpdate = true;
    } else {
      rainMesh.visible = true; activeRain = rainTotal;
      activeCars = carTotal;
      reflectionGroup.visible = true;
      steamGroup.visible = true;
      shaftGroup.visible = true;
      rainGlassActive = true;
      mat.floor.envMap = cityEnvMap; mat.floor.needsUpdate = true;
    }
  }

  await step('Contact office');
  return {
    list,
    quality,
    update: (t, dt) => anim.forEach(f => f(t, dt)),
    areas: [
      { n: 'Entry hall', x: 0, z: -2.6, yaw: 0 },
      { n: 'UNOMi Emotion Engine showcase', x: -1.2, z: -12.8, yaw: 0.45 },
      { n: 'Project hall (Battle Tetris & Surf)', x: 0, z: -33.2, yaw: 0 },
      { n: 'Sky overlook & Parkour start', x: 12.8, z: -33.8, yaw: 0 },
      { n: 'Skills & ASU coursework', x: 0, z: -58, yaw: Math.PI / 2 },
      { n: 'Contact office', x: 0, z: -67.2, yaw: 0 }
    ],
    // Recruiter path (~60 seconds): [x, z, lookX, lookZ, pauseSeconds]
    tour: [
      [0, -4, 0, -10, 2.5],
      [-1.8, -14.5, -6.9, -15.5, 4.2],
      [-0.4, -18.2, 2.6, -18.0, 4.2],
      [0, -28, -2.0, -28, 1.5],
      [0, -35.5, 0, -41.0, 3.8],
      [-4.2, -37.2, -7.2, -40.8, 3.8],
      [4.2, -38.5, 7.4, -42.6, 2.8],
      [0, -49.5, 0, -58, 0.4],
      [0, -58, 5.5, -58, 3.8],
      [0, -68.2, -0.4, -73.8, 4.0]
    ]
  };
}
