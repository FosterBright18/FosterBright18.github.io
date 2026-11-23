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
  const el = renderer.domElement, scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, .05, 230), player = new Player(cam, el);
  const hooks = { play: i => ui.play(C.projects[i]), verify: () => ui.panel(H.verify()), how: () => ui.panel(H.how()), project: i => ui.panel(H.project(C.projects[i])), facts: () => ui.panel(H.facts()), job: () => ui.panel(H.job()), skills: () => ui.panel(H.skills()), courses: () => ui.panel(H.courses()),
    email: async () => { try { await navigator.clipboard.writeText(C.email); ui.toast('Copied: ' + C.email); } catch { ui.toast(C.email); } }, gh: () => window.open(C.gh, '_blank', 'noopener'),
    li: () => C.linkedin.startsWith('http') ? window.open(C.linkedin, '_blank', 'noopener') : ui.toast('LinkedIn URL not set yet. Edit src/content.js.'), resume: () => ui.resumeView(), toast: m => ui.toast(m) };
  let n = 0; const total = 6, world = await build(scene, hooks, async name => { ui.progress(++n / total, name); await new Promise(r => requestAnimationFrame(r)); });
  // Post-processing and quality. Bloom is optional: if the addons fail to load, the site renders normally without it.
  let composer = null, bloomOn = false, level = touch ? 'medium' : 'high', pick = 'auto', frames = 0, acc = 0;
  try { const [a, b, c, d] = await Promise.all(['EffectComposer', 'RenderPass', 'UnrealBloomPass', 'OutputPass'].map(n => import(`three/addons/postprocessing/${n}.js`)));
    composer = new a.EffectComposer(renderer); composer.addPass(new b.RenderPass(scene, cam)); composer.addPass(new c.UnrealBloomPass(new THREE.Vector2(innerWidth >> 1, innerHeight >> 1), .8, .55, .9)); composer.addPass(new d.OutputPass()); } catch {}
  const applyQ = l => { level = l; bloomOn = !!composer && l === 'high'; const pr = Math.min(devicePixelRatio, l === 'low' ? 1 : touch ? 1.5 : 2); renderer.setPixelRatio(pr); renderer.setSize(innerWidth, innerHeight);
    if (composer) { composer.setPixelRatio(pr); composer.setSize(innerWidth, innerHeight); }
    if (typeof world.quality === 'function') world.quality(l);
    else if (typeof world.setQuality === 'function') world.setQuality(l); };
  $('#quality').onchange = e => { pick = e.target.value; frames = acc = 0; applyQ(pick === 'auto' ? level : pick); }; applyQ(level);

  const begin = () => { ui.closeAll(); if (touch) { player.active = true; $('#tbtn').hidden = false; } else el.requestPointerLock(); };
  const tour = () => { ui.closeAll(); player.active = false; player.startTour(world.tour); ui.toast('Recruiter path. Press any key to take over.'); };
  player.onTourEnd = () => { if (touch) player.active = true; else ui.toast('Click the scene to look around.'); };
  ui.onClose = () => { if (touch) player.active = true; };
  $('#enter').onclick = begin; $('#tourbtn').onclick = tour; $('#resumebtn').onclick = begin; $('#tour2').onclick = tour;
  for (const b of document.querySelectorAll('[data-page]')) b.onclick = () => ui.page(true);
  $('#skip').onclick = e => { e.preventDefault(); ui.page(true); };
  $('#txt').onclick = () => { const l = document.createElement('a'); l.href = URL.createObjectURL(new Blob([H.text()], { type: 'text/plain' })); l.download = 'foster-bright-resume.txt'; l.click(); };
  $('#menuresume').onclick = () => ui.resumeView();
  $('#areas').innerHTML = (world.areas || []).map((a, i) => `<button data-i="${i}">${a.n}</button>`).join('');
  $('#areas').onclick = e => { const b = e.target.closest('button'); if (!b) return; const a = world.areas[b.dataset.i]; player.teleport(a.x, a.z, a.yaw); begin(); };
  const S = player.s; $('#sens').oninput = e => S.sens = +e.target.value; $('#fov').oninput = e => S.fov = +e.target.value; $('#inv').onchange = e => S.invert = e.target.checked;
  $('#bob').checked = S.bob; $('#bob').onchange = e => S.bob = e.target.checked; $('#aud').onchange = e => { audio.ambience(e.target.checked); };
  el.addEventListener('click', () => { if (!ui.open && !touch && !player.active && !player.tour) el.requestPointerLock(); });
  document.addEventListener('pointerlockchange', () => { player.active = document.pointerLockElement === el; if (!player.active && !ui.open && !player.tour) ui.menu(true); });
  addEventListener('resize', () => { renderer.setSize(innerWidth, innerHeight); if (composer) composer.setSize(innerWidth, innerHeight); cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix(); });

  const ray = new THREE.Raycaster(); ray.far = 3.2; let target = null, warmed = false, last = performance.now();
  const use = () => { if (target && (player.active || touch) && !ui.open) target.userData.act.fn(); };
  addEventListener('keydown', e => { if (e.code === 'KeyE') use(); if (e.code === 'KeyM' && !ui.open) ui.menu(true); });
  $('#tbtn').onclick = use;
  ui.ready(); document.body.classList.add('ready');
  (function frame(now) {
    if (document.hidden) { last = now; requestAnimationFrame(frame); return; }
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    if (pick === 'auto' && !ui.open && level !== 'low' && ++frames > 30) { acc += dt; if (frames === 120) { if (acc / 90 > .024) applyQ(level === 'high' ? 'medium' : 'low'); frames = 30; acc = 0; } }
    player.update(dt); world.update?.(now / 1000, dt);
    if (!warmed && player.p.z < -31) { warmed = true; fetch(C.projects[0].demo, { mode: 'no-cors' }).catch(() => {}); } // wake the free-tier server early
    target = null; if ((player.active || player.tour) && !ui.open) { ray.setFromCamera({ x: 0, y: 0 }, cam); const h = ray.intersectObjects(world.list || [], false)[0]; target = h ? h.object : null; }
    ui.prompt(target && !player.tour ? target.userData.act.label : null); $('#cross').hidden = !(player.active && !ui.open);
    if (bloomOn) composer.render(); else renderer.render(scene, cam); requestAnimationFrame(frame);
  })(last);
}