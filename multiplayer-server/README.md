# Live Anonymous Multiplayer Presence Server

GitHub Pages is static-only, so showing other live visitors walking around `fosterbright18.github.io` uses a tiny WebSocket relay (`server.js`, ~45 lines, `ws` only).

## Option A — Standalone Free Render Service (2 minutes)
1. Push the `multiplayer-server/` folder to a small GitHub repo (or point a new Render **Web Service** at it).
2. Set **Build Command** to `npm install` and **Start Command** to `npm start`.
3. Copy your Render URL (e.g., `wss://your-presence-app.onrender.com`) into `multiplayerWs` inside `src/content.js` and push `FosterBright18.github.io`.

## Option B — Add directly to your existing `multiplayer-battle-tetris` Render server
Attach a second `WebSocketServer({ noServer: true })` on the `/presence` path of your existing HTTP server so both Battle Tetris and portfolio visitors share one Render service—then set `multiplayerWs: 'wss://multiplayer-battle-tetris.onrender.com/presence'` in `src/content.js`.

Until `multiplayerWs` is set, the client stays completely silent with zero console errors.
