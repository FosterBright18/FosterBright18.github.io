import { resolve, supportY } from './collision.js';
import { footstep } from './audio.js';

export class Player {
  constructor(cam, el) {
    this.cam = cam; this.el = el; cam.rotation.order = 'YXZ';
    this.p = { x: 0, y: 0, z: -1.6 };
    this.vy = 0; this.grounded = true;
    this.yaw = 0; this.pitch = 0; this.k = {}; this.active = false; this.tour = null;
    this.stick = [0, 0]; this.stepT = 0; this.bobT = 0;
    this.touch = matchMedia('(pointer:coarse)').matches;
    this.onTourEnd = () => {};
    this.onRespawn = () => {};
    this.s = { sens: 1, fov: 70, invert: false, bob: !matchMedia('(prefers-reduced-motion: reduce)').matches };

    addEventListener('keydown', e => {
      if (this.tour) this.stopTour();
      if (e.code === 'Space' && this.active) {
        e.preventDefault();
        if (this.grounded) { this.vy = 6.2; this.grounded = false; }
      }
      this.k[e.code] = 1;
    });
    addEventListener('keyup', e => { delete this.k[e.code]; });
    addEventListener('mousemove', e => {
      if (document.pointerLockElement !== el) return;
      this.yaw -= e.movementX * .0022 * this.s.sens;
      this.pitch = Math.max(-1.45, Math.min(1.45, this.pitch - e.movementY * .0022 * this.s.sens * (this.s.invert ? -1 : 1)));
    });
    addEventListener('mousedown', () => this.tour && this.stopTour());

    let ms = null, ls = null; // touch: left half = stick, right half = look
    el.addEventListener('touchstart', e => {
      if (this.tour) this.stopTour();
      for (const t of e.changedTouches) {
        if (t.clientX < innerWidth / 2 && !ms) ms = { id: t.identifier, x: t.clientX, y: t.clientY };
        else if (!ls) ls = { id: t.identifier, x: t.clientX, y: t.clientY };
      }
    }, { passive: true });
    el.addEventListener('touchmove', e => {
      for (const t of e.changedTouches) {
        if (ms && t.identifier === ms.id) this.stick = [Math.max(-1, Math.min(1, (t.clientX - ms.x) / 60)), Math.max(-1, Math.min(1, (t.clientY - ms.y) / 60))];
        else if (ls && t.identifier === ls.id) {
          this.yaw -= (t.clientX - ls.x) * .005 * this.s.sens;
          this.pitch = Math.max(-1.45, Math.min(1.45, this.pitch - (t.clientY - ls.y) * .005 * this.s.sens));
          ls.x = t.clientX; ls.y = t.clientY;
        }
      }
    }, { passive: true });
    el.addEventListener('touchend', e => {
      for (const t of e.changedTouches) {
        if (ms && t.identifier === ms.id) { ms = null; this.stick = [0, 0]; }
        if (ls && t.identifier === ls.id) ls = null;
      }
    });
  }

  teleport(x, z, yaw, y = 0) {
    this.p.x = x; this.p.y = y; this.p.z = z;
    this.vy = 0; this.grounded = true;
    this.yaw = yaw; this.pitch = 0;
  }

  startTour(w) { this.p.y = 0; this.vy = 0; this.grounded = true; this.tour = { w, i: 0, wait: 0 }; }
  stopTour() { this.tour = null; this.onTourEnd(); }

  runTour(dt) {
    const t = this.tour, w = t.w[t.i]; if (!w) return this.stopTour();
    const dx = w[0] - this.p.x, dz = w[1] - this.p.z, d = Math.hypot(dx, dz);
    if (d > .06) {
      const s = Math.min(d, 2.8 * dt);
      this.p.x += dx / d * s; this.p.z += dz / d * s;
      this.stepT += s; if (this.stepT > 1.6) { this.stepT = 0; footstep(); }
    } else if ((t.wait += dt) >= w[4]) { t.i++; t.wait = 0; }
    const want = Math.atan2(-(w[2] - this.p.x), -(w[3] - this.p.z));
    let dy = want - this.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy));
    this.yaw += dy * Math.min(1, dt * 2.5);
    this.pitch *= 1 - Math.min(1, dt * 3);
    this.p.y = 0;
  }

  update(dt) {
    const k = this.k; let moving = false;
    if (this.tour) {
      this.runTour(dt);
    } else if (this.active) {
      let f = (k.KeyW || k.ArrowUp ? 1 : 0) - (k.KeyS || k.ArrowDown ? 1 : 0) - this.stick[1];
      let r = (k.KeyD || k.ArrowRight ? 1 : 0) - (k.KeyA || k.ArrowLeft ? 1 : 0) + this.stick[0];
      const l = Math.hypot(f, r); if (l > 1) { f /= l; r /= l; }
      const run = k.ShiftLeft || k.ShiftRight;
      const sp = (run ? 5.8 : 3.5) * dt, sy = Math.sin(this.yaw), cy = Math.cos(this.yaw);
      if (l > .05) {
        moving = true;
        this.p.x += (-sy * f + cy * r) * sp;
        this.p.z += (-cy * f - sy * r) * sp;
        resolve(this.p, .34, this.p.y);
        if (this.grounded) {
          this.bobT += dt * (run ? 10 : 7);
          this.stepT += sp;
          if (this.stepT > (run ? 2.2 : 1.6)) { this.stepT = 0; footstep(); }
        }
      }
      // Vertical physics & platform landings
      const prevY = this.p.y;
      this.vy -= 15.8 * dt;
      this.p.y += this.vy * dt;
      const floorY = supportY(this.p.x, this.p.z, this.p.y, prevY);
      if (this.vy <= 0 && floorY > -900 && this.p.y <= floorY) {
        this.p.y = floorY;
        this.vy = 0;
        this.grounded = true;
      } else {
        this.grounded = false;
      }
      // Safe respawn back onto the Sky Overlook Balcony if player falls off parkour
      if (this.p.y < -6.5) {
        this.teleport(12.8, -33.8, 0, 0);
        this.onRespawn();
      }
    }
    const c = this.cam;
    const bob = (this.s.bob && moving && this.grounded) ? Math.sin(this.bobT) * .032 : 0;
    c.position.set(this.p.x, this.p.y + 1.65 + bob, this.p.z);
    c.rotation.set(this.pitch, this.yaw, 0);
    if (c.fov !== this.s.fov) { c.fov = this.s.fov; c.updateProjectionMatrix(); }
  }
}
