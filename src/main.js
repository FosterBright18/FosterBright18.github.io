import * as THREE from 'three';
import { C } from './content.js';
import { build } from './world.js';
import { Player } from './player.js';
import { UI, H } from './ui.js';
import * as audio from './audio.js';

const $ = s => document.querySelector(s), ui = new UI(), touch = matchMedia('(pointer:coarse)').matches;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: !touch, powerPreference: 'high-performance' });
} catch {
  ui.e.load.hidden = true; ui.page(true);
}
if (renderer) boot();

async function boot() {
  renderer.setPixelRatio(Math.min(devicePixelRatio, touch ? 1.5 : 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  $('#stage').append(renderer.domElement);

  const el = renderer.domElement;
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, .08, 260);
  const player = new Player(cam, el);
  const hooks = {
    play: i => ui.play(C.projects[i]),
    verify: () => ui.panel(H.verify()),
    how: () => ui.panel(H.how()),
    project: i => ui.panel(H.project(C.projects[i])),
    facts: () => ui.panel(H.facts()),
    job: () => ui.panel(H.job()),
    skills: () => ui.panel(H.skills()),
    courses: () => ui.panel(H.courses()),
    email: async () => { try { await navigator.clipboard.writeText(C.email); ui.toast('Copied: ' + C.email); } catch { ui.toast(C.email); } },
    gh: () => window.open(C.gh, '_blank', 'noopener'),
    li: () => C.linkedin.startsWith('http') ? window.open(C.linkedin, '_blank', 'noopener') : ui.toast('LinkedIn URL not set yet. Edit src/content.js.'),
    resume: () => ui.resumeView(),
    toast: m => ui.toast(m)
  };

  let n = 0; const total = 6;
  const world = await build(scene, hooks, async name => {
    ui.progress(++n / total, name);
    await new Promise(r => requestAnimationFrame(r));
  }, renderer);

  // Post-processing: half-res UnrealBloomPass (high threshold so only neon blooms) + subtle vignette/grain.
  let composer = null, vignettePass = null, bloomOn = false;
  let level = touch ? 'medium' : 'high', pick = 'auto', frames = 0, acc = 0;
  try {
    const [ec, rp, ub, sp, op] = await Promise.all(
      ['EffectComposer', 'RenderPass', 'UnrealBloomPass', 'ShaderPass', 'OutputPass']
        .map(name => import(`three/addons/postprocessing/${name}.js`))
    );
    composer = new ec.EffectComposer(renderer);
    composer.addPass(new rp.RenderPass(scene, cam));
    composer.addPass(new ub.UnrealBloomPass(new THREE.Vector2(Math.max(1, innerWidth >> 1), Math.max(1, innerHeight >> 1)), 0.72, 0.5, 0.88));
    vignettePass = new sp.ShaderPass({
      uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uGrain: { value: reducedMotion ? 0 : 0.022 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `uniform sampler2D tDiffuse; uniform float uTime; uniform float uGrain; varying vec2 vUv;
        void main(){
          vec4 c = texture2D(tDiffuse, vUv);
          vec2 d = vUv - 0.5;
          float vig = smoothstep(0.92, 0.28, dot(d, d) * 1.45);
          c.rgb *= mix(0.78, 1.0, vig);
          float g = fract(sin(dot(vUv * 400.0 + uTime, vec2(12.9898, 78.233))) * 43758.5453) - 0.5;
          c.rgb += g * uGrain;
          gl_FragColor = c;
        }`
    });
    composer.addPass(vignettePass);
    composer.addPass(new op.OutputPass());
  } catch {}

  const applyQ = l => {
    level = l;
    bloomOn = !!composer && l === 'high';
    const pr = Math.min(devicePixelRatio, l === 'low' ? 1 : (touch || l === 'medium') ? 1.5 : 2);
    renderer.setPixelRatio(pr);
    renderer.setSize(innerWidth, innerHeight);
    if (composer) { composer.setPixelRatio(pr); composer.setSize(innerWidth, innerHeight); }
    if (typeof world.quality === 'function') world.quality(l);
  };
  $('#quality').onchange = e => { pick = e.target.value; frames = acc = 0; applyQ(pick === 'auto' ? (touch ? 'medium' : 'high') : pick); };
  applyQ(level);

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

  const S = player.s;
  $('#sens').oninput = e => S.sens = +e.target.value;
  $('#fov').oninput = e => S.fov = +e.target.value;
  $('#inv').onchange = e => S.invert = e.target.checked;
  $('#bob').checked = S.bob; $('#bob').onchange = e => S.bob = e.target.checked;
  $('#aud').onchange = e => { audio.ambience(e.target.checked); };

  el.addEventListener('click', () => { if (!ui.open && !touch && !player.active && !player.tour) el.requestPointerLock(); });
  document.addEventListener('pointerlockchange', () => { player.active = document.pointerLockElement === el; if (!player.active && !ui.open && !player.tour) ui.menu(true); });
  addEventListener('resize', () => {
    renderer.setSize(innerWidth, innerHeight);
    if (composer) composer.setSize(innerWidth, innerHeight);
    cam.aspect = innerWidth / innerHeight;
    cam.updateProjectionMatrix();
  });

  const ray = new THREE.Raycaster(); ray.far = 3.6;
  let target = null, warmed = false, last = performance.now();
  const use = () => { if (target && (player.active || touch) && !ui.open) target.userData.act.fn(); };
  addEventListener('keydown', e => { if (e.code === 'KeyE') use(); if (e.code === 'KeyM' && !ui.open) ui.menu(true); });
  $('#tbtn').onclick = use;

  ui.ready();
  document.body.classList.add('ready');

  (function frame(now) {
    if (document.hidden) { last = now; requestAnimationFrame(frame); return; }
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    if (pick === 'auto' && !ui.open && level !== 'low' && ++frames > 30) {
      acc += dt;
      if (frames === 120) {
        if (acc / 90 > .024) applyQ(level === 'high' ? 'medium' : 'low');
        frames = 30; acc = 0;
      }
    }
    player.update(dt);
    world.update(now / 1000, dt);
    if (!warmed && player.p.z < -31) { warmed = true; fetch(C.projects[0].demo, { mode: 'no-cors' }).catch(() => {}); }
    target = null;
    if ((player.active || player.tour) && !ui.open) {
      ray.setFromCamera({ x: 0, y: 0 }, cam);
      const h = ray.intersectObjects(world.list, false)[0];
      target = h ? h.object : null;
    }
    ui.prompt(target && !player.tour ? target.userData.act.label : null);
    $('#cross').hidden = !(player.active && !ui.open);
    if (bloomOn) {
      if (vignettePass) vignettePass.uniforms.uTime.value = reducedMotion ? 0 : (now * 0.001) % 100;
      composer.render();
    } else {
      renderer.render(scene, cam);
    }
    requestAnimationFrame(frame);
  })(last);
}
