import * as THREE from 'three';
import { C } from './content.js';
import { build } from './world.js';
import { Player } from './player.js';
import { UI, H } from './ui.js';
import * as audio from './audio.js';
const $ = s => document.querySelector(s), ui = new UI(), touch = matchMedia('(pointer:coarse)').matches;
let renderer;
try { renderer = new THREE.WebGLRenderer({ antialias: !touch }); } catch { ui.e.load.hidden = true; ui.page(true); }
if (renderer) boot();

async function boot() {
  renderer.setPixelRatio(Math.min(devicePixelRatio, touch ? 1.5 : 2)); renderer.setSize(innerWidth, innerHeight); $('#stage').append(renderer.domElement);
  const el = renderer.domElement, scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, .05, 80), player = new Player(cam, el);
  const hooks = { project: i => ui.panel(H.project(C.projects[i])), facts: () => ui.panel(H.facts()), job: () => ui.panel(H.job()), skills: () => ui.panel(H.skills()), courses: () => ui.panel(H.courses()),
    email: async () => { try { await navigator.clipboard.writeText(C.email); ui.toast('Copied: ' + C.email); } catch { ui.toast(C.email); } }, gh: () => window.open(C.gh, '_blank', 'noopener'),
    li: () => C.linkedin.startsWith('http') ? window.open(C.linkedin, '_blank', 'noopener') : ui.toast('LinkedIn URL not set yet. Edit src/content.js.'), resume: () => ui.resumeView(), toast: m => ui.toast(m) };
  let n = 0; const total = 5, world = await build(scene, hooks, async name => { ui.progress(++n / total, name); await new Promise(r => requestAnimationFrame(r)); });

  const begin = () => { ui.closeAll(); if (touch) { player.active = true; $('#tbtn').hidden = false; } else el.requestPointerLock(); };
  const tour = () => { ui.closeAll(); player.active = false; player.startTour(world.tour); ui.toast('Recruiter path. Press any key to take over.'); };
  player.onTourEnd = () => { if (touch) player.active = true; else ui.toast('Click the scene to look around.'); };
  ui.onClose = () => { if (touch) player.active = true; };
  $('#enter').onclick = begin; $('#tourbtn').onclick = tour; $('#resumebtn').onclick = begin; $('#tour2').onclick = tour;
  for (const b of document.querySelectorAll('[data-page]')) b.onclick = () => ui.page(true);
  $('#skip').onclick = e => { e.preventDefault(); ui.page(true); };
  $('#txt').onclick = () => { const l = document.createElement('a'); l.href = URL.createObjectURL(new Blob([H.text()], { type: 'text/plain' })); l.download = 'foster-bright-resume.txt'; l.click(); };
  $('#menuresume').onclick = () => ui.resumeView();
  $('#areas').innerHTML = world.areas.map((a, i) => `<button data-i="${i}">${a.n}</button>`).join('');
  $('#areas').onclick = e => { const b = e.target.closest('button'); if (!b) return; const a = world.areas[b.dataset.i]; player.teleport(a.x, a.z, a.yaw); begin(); };
  const S = player.s; $('#sens').oninput = e => S.sens = +e.target.value; $('#fov').oninput = e => S.fov = +e.target.value; $('#inv').onchange = e => S.invert = e.target.checked;
  $('#bob').checked = S.bob; $('#bob').onchange = e => S.bob = e.target.checked; $('#aud').onchange = e => { audio.ambience(e.target.checked); };
  el.addEventListener('click', () => { if (!ui.open && !touch && !player.active && !player.tour) el.requestPointerLock(); });
  document.addEventListener('pointerlockchange', () => { player.active = document.pointerLockElement === el; if (!player.active && !ui.open && !player.tour) ui.menu(true); });
  addEventListener('resize', () => { renderer.setSize(innerWidth, innerHeight); cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix(); });

  const ray = new THREE.Raycaster(); ray.far = 3.2; let target = null, warmed = false, last = performance.now();
  const use = () => { if (target && (player.active || touch) && !ui.open) target.userData.act.fn(); };
  addEventListener('keydown', e => { if (e.code === 'KeyE') use(); if (e.code === 'KeyM' && !ui.open) ui.menu(true); });
  $('#tbtn').onclick = use;
  ui.ready(); document.body.classList.add('ready');
  (function frame(now) {
    const dt = Math.min(.05, (now - last) / 1000); last = now; player.update(dt); world.update(now / 1000, dt);
    if (!warmed && player.p.z < -31) { warmed = true; fetch(C.projects[0].demo, { mode: 'no-cors' }).catch(() => {}); } // wake the free-tier server early
    target = null; if ((player.active || player.tour) && !ui.open) { ray.setFromCamera({ x: 0, y: 0 }, cam); const h = ray.intersectObjects(world.list, false)[0]; target = h ? h.object : null; }
    ui.prompt(target && !player.tour ? target.userData.act.label : null); $('#cross').hidden = !(player.active && !ui.open);
    renderer.render(scene, cam); requestAnimationFrame(frame);
  })(last);
}
