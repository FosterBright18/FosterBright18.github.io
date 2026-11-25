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
Extract all files from the ZIP directly into the root of `FosterBright18.github.io` (keep your existing `.git/` folder untouched) and push to `main`.

## Adding Your 4 UNOMi Demo Videos
Room 2 (right after the Entry Hall) is the **UNOMi Emotion Engine Showcase Gallery** with 4 dedicated video bays. Drop your sponsor-cleared `.mp4` videos into `assets/unomi/`:
1. `assets/unomi/morph-sliders.mp4` — Model moving live with morph-target sliders
2. `assets/unomi/saved-emotions.mp4` — Opening and applying preloaded saved emotions (`EmotionPresets.json`)
3. `assets/unomi/speaking-emotions-1.mp4` — Final product: character speaking with emotions #1
4. `assets/unomi/speaking-emotions-2.mp4` — Final product: character speaking with emotions #2

Videos auto-play muted on the 3D gallery wall and open with full audio and playback controls when visitors press `E`.

## Live Anonymous Multiplayer Presence
Live visitor presence is wired to Firebase Realtime Database via `multiplayerWs` in `src/content.js` (`https://mywesbite-60d3a-default-rtdb.firebaseio.com`) and `src/multiplayer.js`.

## Update the static SEO fallback block
Whenever you edit `src/content.js`, run:
```bash
node tools/generate-static.mjs
```

## Placeholders to fill in (`src/content.js`)
- `linkedin` (`[LINKEDIN URL PLACEHOLDER]`)
- `facts`: `Role interests`, `Availability`, `Work authorization`
- `job.dates`: verify `Sept 2026 to Present [FOSTER TO CONFIRM dates]`
- `unomiVerify`: confirm sponsor repository disclosure wording
- `projects[*].next`: `"What I would improve next"` per project
- `timeline`: confirm project dates
- `refs`: optional `{ who, what }` references (hidden while empty)

## Sponsor confirmation note (UNOMi / Pixel Pirate Studio)
Before publishing real captures in `assets/unomi/`, confirm with your Pixel Pirate Studio sponsor engineers what footage of the UNOMi Emotion Engine and `UNOMi-Solutions/Unreal_Engine_Plugin` may be public.

## Play Mode iframe embedding note (Battle Tetris on Render)
GitHub Pages sites (`surf-report` and `webaudio-rhythm-generator`) allow iframe embedding by default. If your `multiplayer-battle-tetris` Express server on Render blocks framing via `helmet()` or `X-Frame-Options`, add:
```js
app.use((req, res, next) => {
  res.removeHeader('X-Frame-Options');
  res.setHeader('Content-Security-Policy', "frame-ancestors 'self' https://fosterbright18.github.io");
  next();
});
```
