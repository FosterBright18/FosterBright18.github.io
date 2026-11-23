# The Build Floor, After Dark — First-Person 3D Portfolio

Static site, no build step. Three.js `0.160.0` (and `three/addons/` for `BufferGeometryUtils` and post-processing) loads from jsDelivr through the import map in `index.html`.

## Run locally
ES modules require an HTTP server (not `file://`):
```bash
npx serve .
# or
python3 -m http.server 8000
```
Open `http://localhost:8000` (or the port printed by `serve`).

## Deploy to GitHub Pages
Copy all files from this folder directly into the root of `FosterBright18.github.io` (do **not** overwrite your existing `.git/` directory) and push to `main`.

## Update the static SEO fallback block
Whenever you edit `src/content.js`, regenerate the crawlable static HTML inside `index.html` and commit both files:
```bash
node tools/generate-static.mjs
```

## Placeholders to fill in
All website placeholders live in `src/content.js` (and corresponding metric/link placeholders live in `/job-kit/*.md`):
- `linkedin` (`[LINKEDIN URL PLACEHOLDER]`)
- `facts`: `Role interests` (`[ROLE INTERESTS PLACEHOLDER]`), `Availability` (`[AVAILABILITY PLACEHOLDER]`), `Work authorization` (`[WORK AUTHORIZATION PLACEHOLDER]`)
- `job.dates`: verify `Sept 2026 to Present [FOSTER TO CONFIRM dates]`
- `unomiVerify`: confirm sponsor repository disclosure wording (`[FOSTER TO CONFIRM]`)
- `projects[*].next`: fill in `"What I would improve next"` for each project (`[FOSTER TO CONFIRM]`)
- `timeline`: confirm project dates (`[FOSTER TO CONFIRM]`)
- `refs`: optional array of `{ who, what }` references (section stays hidden while empty)

## Sponsor confirmation note (UNOMi / Pixel Pirate Studio)
Before sharing widely, confirm with your Pixel Pirate Studio sponsor engineers what details about the UNOMi Emotion Engine and `UNOMi-Solutions/Unreal_Engine_Plugin` may remain public. No proprietary code, UI captures, or screenshots are included anywhere in this repository; the in-world workbench is an illustrative primitive control panel built from scratch in Three.js.

## Play Mode iframe embedding note (Battle Tetris on Render)
GitHub Pages sites (`webaudio-rhythm-generator` and `surf-forecast-dashboard`) allow iframe embedding by default. If your `multiplayer-battle-tetris` Express server on Render uses `helmet()` or sets `X-Frame-Options: SAMEORIGIN`, browsers will block the Play Mode iframe (falling back to the "Open in new tab" link). To allow embedding from your portfolio domain, update your Express server middleware:

```js
// If using helmet:
app.use(
  helmet({
    frameguard: false,
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        'frame-ancestors': ["'self'", 'https://fosterbright18.github.io'],
      },
    },
  })
);

// Or without helmet:
app.use((req, res, next) => {
  res.removeHeader('X-Frame-Options');
  res.setHeader(
    'Content-Security-Policy',
    "frame-ancestors 'self' https://fosterbright18.github.io"
  );
  next();
});
```

## File structure
- `index.html` — Static SEO fallback, import map, overlays, and printable resume container.
- `styles.css` — Typographic After Dark UI and clean 1-page print stylesheet.
- `src/content.js` — Single source of truth for all facts, signage, page view, print resume, and `.txt` export.
- `src/world.js` — Cyberpunk studio rooms, wet concrete floors with one-time CubeCamera environment, instanced skyline/traffic/rain, panoramic windows + Sky Overlook balcony, UNOMi Emotion Engine & `SFacialExpressionPanel` demo, and playable project stations.
- `src/main.js` — Renderer, half-res `UnrealBloomPass` + subtle vignette/grain, `Quality` controller (`auto`/`high`/`medium`/`low`), and main loop.
- `src/player.js`, `src/collision.js` — First-person movement, touch controls, Recruiter path tour, 2D circle-vs-AABB collision.
- `src/ui.js` — Case study panels, Play Mode iframe overlay, page view, print resume, and plain-text download.
- `src/audio.js` — Procedural Web Audio synth, FFT analyser, room tone, and footsteps.
- `tools/generate-static.mjs` — Local script to sync `index.html` static fallback from `src/content.js`.
- `job-kit/` — Recruiter-ready pitch, LinkedIn copy, STAR stories, resume variants, cover letter & outreach templates, interview prep, and application tracker CSV.
