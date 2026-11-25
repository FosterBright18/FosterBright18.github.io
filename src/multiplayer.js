import * as THREE from 'three';

const FB_VER = '13.4.0';

// Anonymous live visitor presence via Firebase Realtime Database (always-on, zero server).
export class Presence {
  constructor(scene, url, onCount = () => {}) {
    this.scene = scene;
    this.url = (url || '').trim().replace(/\/+$/, '');
    if (this.url && !/^(https?|wss?):\/\//i.test(this.url)) this.url = 'https://' + this.url;
    this.onCount = onCount;
    this.peers = new Map();
    this.ws = null;
    this.fb = null;
    this.lastSend = 0;
    this.lastState = null;
    this.id = (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)).slice(0, 10);

    const badge = document.querySelector('#online');
    if (badge) badge.style.zIndex = '36';

    this.bodyMat = new THREE.MeshStandardMaterial({ color: 0x1e252e, roughness: 0.4, metalness: 0.5 });
    this.visorMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.35, 1.45, 1.32), toneMapped: false });
    this.trimMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.45, 0.50, 0.14), toneMapped: false });
    this.ringMat = new THREE.MeshBasicMaterial({ color: 0x3dffe3, transparent: true, opacity: 0.4, side: THREE.DoubleSide });

    if (this.url.startsWith('https://')) this.connectFirebase();
    else if (this.url.startsWith('ws://') || this.url.startsWith('wss://')) this.connectWs();
  }

  async connectFirebase() {
    try {
      const host = new URL(this.url).hostname;
      const projectId = host.split('-default-rtdb')[0].split('.')[0] || 'portfolio';
      const [
        { initializeApp },
        { getDatabase, ref, set, onValue, onDisconnect, serverTimestamp }
      ] = await Promise.all([
        import(`https://www.gstatic.com/firebasejs/${FB_VER}/firebase-app.js`),
        import(`https://www.gstatic.com/firebasejs/${FB_VER}/firebase-database.js`)
      ]);

      const app = initializeApp({ databaseURL: this.url, projectId });
      const db = getDatabase(app, this.url);
      const myRef = ref(db, `presence/${this.id}`);
      const allRef = ref(db, 'presence');
      const connRef = ref(db, '.info/connected');

      this.fb = { set, myRef, serverTimestamp, connected: false };

      onValue(connRef, snap => {
        const ok = snap.val() === true;
        this.fb.connected = ok;
        if (!ok) { this.onCount(0); return; }
        this.onCount(this.peers.size + 1);
        onDisconnect(myRef).remove().then(() => {
          const s = this.lastState || { x: 0, y: 0, z: -1.6, yaw: 0 };
          return set(myRef, { ...s, t: serverTimestamp() });
        }).catch(err => console.error('[Multiplayer] Firebase write error:', err));
      });

      onValue(allRef, snap => {
        const data = snap.val() || {};
        const nowMs = Date.now();
        const seen = new Set();
        for (const [id, p] of Object.entries(data)) {
          if (!p || id === this.id) continue;
          if (typeof p.t === 'number' && nowMs - p.t > 180000) continue;
          seen.add(id);
          this.upsertPeer({ id, ...p });
        }
        for (const [id, peer] of this.peers.entries()) {
          if (!seen.has(id)) { this.scene.remove(peer.mesh); this.peers.delete(id); }
        }
        this.onCount(this.peers.size + (this.fb.connected ? 1 : 0));
      }, err => console.error('[Multiplayer] Firebase read error:', err));
    } catch (err) {
      console.error('[Multiplayer] Firebase init failed:', err);
    }
  }

  connectWs() {
    try {
      this.ws = new WebSocket(this.url);
      this.ws.onopen = () => this.onCount(this.peers.size + 1);
      this.ws.onmessage = ev => {
        try {
          const msg = JSON.parse(ev.data);
          if (msg.type === 'state' && Array.isArray(msg.players)) {
            const seen = new Set();
            for (const p of msg.players) {
              if (!p || p.id === msg.selfId) continue;
              seen.add(p.id);
              this.upsertPeer(p);
            }
            for (const [id, peer] of this.peers.entries()) {
              if (!seen.has(id)) { this.scene.remove(peer.mesh); this.peers.delete(id); }
            }
            this.onCount(this.peers.size + 1);
          } else if (msg.type === 'leave' && msg.id && this.peers.has(msg.id)) {
            this.scene.remove(this.peers.get(msg.id).mesh);
            this.peers.delete(msg.id);
            this.onCount(this.peers.size + 1);
          }
        } catch {}
      };
      this.ws.onclose = () => {
        for (const peer of this.peers.values()) this.scene.remove(peer.mesh);
        this.peers.clear();
        this.onCount(0);
        setTimeout(() => this.connectWs(), 8000);
      };
      this.ws.onerror = () => { try { this.ws.close(); } catch {} };
    } catch {}
  }

  makeAvatar() {
    const g = new THREE.Group();
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.23, 0.94, 12), this.bodyMat);
    torso.position.y = 0.88; g.add(torso);
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.20, 0.05, 12), this.trimMat);
    collar.position.y = 1.32; g.add(collar);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 14, 12), this.bodyMat);
    head.position.y = 1.56; g.add(head);
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.07, 0.09), this.visorMat);
    visor.position.set(0, 1.57, -0.13); g.add(visor);
    const halo = new THREE.Mesh(new THREE.RingGeometry(0.26, 0.33, 18), this.ringMat);
    halo.rotation.x = -Math.PI / 2; halo.position.y = 0.03; g.add(halo);
    this.scene.add(g);
    return g;
  }

  upsertPeer(p) {
    let peer = this.peers.get(p.id);
    if (!peer) {
      const mesh = this.makeAvatar();
      mesh.position.set(p.x || 0, p.y || 0, p.z || 0);
      mesh.rotation.y = p.yaw || 0;
      peer = { mesh, tx: p.x || 0, ty: p.y || 0, tz: p.z || 0, tyaw: p.yaw || 0 };
      this.peers.set(p.id, peer);
    } else {
      peer.tx = p.x || 0; peer.ty = p.y || 0; peer.tz = p.z || 0; peer.tyaw = p.yaw || 0;
    }
  }

  update(now, dt, player) {
    const yaw = +Math.atan2(Math.sin(player.yaw), Math.cos(player.yaw)).toFixed(2);
    const cur = {
      x: +Math.max(-30, Math.min(35, player.p.x)).toFixed(2),
      y: +Math.max(-10, Math.min(20, player.p.y)).toFixed(2),
      z: +Math.max(-90, Math.min(15, player.p.z)).toFixed(2),
      yaw
    };

    const moved = !this.lastState ||
      Math.abs(cur.x - this.lastState.x) > 0.02 ||
      Math.abs(cur.y - this.lastState.y) > 0.02 ||
      Math.abs(cur.z - this.lastState.z) > 0.02 ||
      Math.abs(cur.yaw - this.lastState.yaw) > 0.04;

    if (now - this.lastSend > 0.1 && (moved || now - this.lastSend > 25)) {
      this.lastSend = now;
      this.lastState = cur;
      if (this.fb && this.fb.connected) {
        this.fb.set(this.fb.myRef, { ...cur, t: this.fb.serverTimestamp() }).catch(() => {});
      } else if (this.ws && this.ws.readyState === 1) {
        this.ws.send(JSON.stringify({ type: 'move', ...cur }));
      }
    }

    const k = Math.min(1, dt * 10);
    for (const peer of this.peers.values()) {
      peer.mesh.position.x += (peer.tx - peer.mesh.position.x) * k;
      peer.mesh.position.y += (peer.ty - peer.mesh.position.y) * k + Math.sin(now * 2.5) * 0.0008;
      peer.mesh.position.z += (peer.tz - peer.mesh.position.z) * k;
      let dy = peer.tyaw - peer.mesh.rotation.y;
      dy = Math.atan2(Math.sin(dy), Math.cos(dy));
      peer.mesh.rotation.y += dy * k;
    }
  }
}
