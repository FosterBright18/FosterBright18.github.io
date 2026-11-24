// Tiny anonymous multiplayer presence relay for fosterbright18.github.io
// Deploy standalone on Render, or mount on an existing Node/Express server (like multiplayer-battle-tetris).
import { WebSocketServer } from 'ws';
import { randomUUID } from 'node:crypto';

const PORT = process.env.PORT || 8080;
const wss = new WebSocketServer({ port: PORT });
const players = new Map();

function broadcast() {
  const list = Array.from(players.values());
  for (const client of wss.clients) {
    if (client.readyState === 1) {
      client.send(JSON.stringify({ type: 'state', selfId: client.id, players: list }));
    }
  }
}

wss.on('connection', ws => {
  ws.id = randomUUID().slice(0, 8);
  players.set(ws.id, { id: ws.id, x: 0, y: 0, z: -1.6, yaw: 0 });
  ws.send(JSON.stringify({ type: 'state', selfId: ws.id, players: Array.from(players.values()) }));

  ws.on('message', raw => {
    try {
      const m = JSON.parse(raw);
      if (m.type === 'move') {
        const p = players.get(ws.id);
        if (!p) return;
        p.x = Math.max(-25, Math.min(30, Number(m.x) || 0));
        p.y = Math.max(-5, Math.min(15, Number(m.y) || 0));
        p.z = Math.max(-85, Math.min(10, Number(m.z) || 0));
        p.yaw = Number(m.yaw) || 0;
      }
    } catch {}
  });

  ws.on('close', () => {
    players.delete(ws.id);
    for (const client of wss.clients) {
      if (client.readyState === 1) client.send(JSON.stringify({ type: 'leave', id: ws.id }));
    }
  });
});

// Broadcast positions at ~12 Hz whenever at least one visitor is online
setInterval(() => { if (players.size > 0) broadcast(); }, 85);
console.log(`Portfolio presence server running on port ${PORT}`);
