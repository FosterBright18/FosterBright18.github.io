# The Build Floor, After Dark — First-Person 3D Portfolio

Static site, no build step. Three.js `0.160.0` (and `three/addons/` for `BufferGeometryUtils` and post-processing) loads from jsDelivr through the import map in `index.html`.

## Run locally
ES modules require an HTTP server (not `file://`):
```bash
npx serve .
# or
python3 -m http.server 8000
```

## Deploy to GitHub Pages
Copy all files from this folder directly into the root of `FosterBright18.github.io` (keep your existing `.git/` folder untouched) and push to `main`.

## Adding Your Real UNOMi Videos & Screenshots
Room 2 (right after the Entry Hall) is a dedicated **UNOMi Emotion Engine Showcase Gallery** with 4 large framed media bays. Drop your cleared `.mp4`/`.webm` videos and `.png`/`.jpg` screenshots into `assets/unomi/`:
- `assets/unomi/emotion-engine-demo.mp4`
- `assets/unomi/slate-panel.png`
- `assets/unomi/eye-jitter-demo.mp4`
- `assets/unomi/morph-blends.png`

Each frame auto-loads your real media on the 3D wall and opens a full-screen HD lightbox / video player when visitors press `E`. Edit titles, captions, or filenames anytime in `src/content.js` (`unomiMedia`).

## Enabling Live Anonymous Multiplayer Visitors
`src/multiplayer.js` is already wired into the site. Deploy the ~45-line WebSocket server in `multiplayer-server/` (for example on Render, or mounted at `/presence` on your existing `multiplayer-battle-tetris` Render server) and paste its `wss://...` URL into `multiplayerWs` in `src/content.js`. Visitors will immediately appear as sleek anonymous avatars walking and jumping around the studio in real time.

## Update the static SEO fallback block
Whenever you edit `src/content.js`, run:
```bash
node tools/generate-static.mjs
```

## Placeholders to fill in (`src/content.js`)
- `linkedin` (`[LINKEDIN URL PLACEHOLDER]`)
- `multiplayerWs` (optional `wss://` presence server URL)
- `facts`: `Role interests`, `Availability`, `Work authorization`
- `job.dates`: verify `Sept 2026 to Present [FOSTER TO CONFIRM dates]`
- `unomiVerify`: confirm sponsor repository disclosure wording
- `projects[*].next`: `"What I would improve next"` per project
- `timeline`: confirm project dates
- `refs`: optional `{ who, what }` references (hidden while empty)

## Sponsor confirmation note (UNOMi / Pixel Pirate Studio)
Before publishing real captures in `assets/unomi/`, confirm with your Pixel Pirate Studio sponsor engineers what footage and screenshots of the UNOMi Emotion Engine and `UNOMi-Solutions/Unreal_Engine_Plugin` may be public.

## Play Mode iframe embedding note (Battle Tetris on Render)
GitHub Pages sites (`surf-report` and `webaudio-rhythm-generator`) allow iframe embedding by default. If your `multiplayer-battle-tetris` Express server on Render blocks framing via `helmet()` or `X-Frame-Options`, add:
```js
app.use((req, res, next) => {
  res.removeHeader('X-Frame-Options');
  res.setHeader('Content-Security-Policy', "frame-ancestors 'self' https://fosterbright18.github.io");
  next();
});
```
