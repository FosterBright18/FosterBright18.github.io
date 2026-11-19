# The Build Floor: first-person resume

Static site, no build step. Three.js 0.160.0 loads from jsDelivr through the import map in `index.html`.

## Run locally
ES modules need a web server (not file://): `python3 -m http.server 8000`, then open http://localhost:8000.

## Deploy
Put these files in the root of the `FosterBright18.github.io` repository and push. Pages serves them as-is.

## Fill these placeholders (all in `src/content.js`)
- `email` (also used by Copy Email, the resume header and the plain-text download)
- `linkedin`
- Quick-facts rows: role interests, availability, work authorization

## Where things live
- `src/content.js`: every fact. The 3D signs, the page view, the print resume and the .txt download read it.
- `src/world.js`: rooms, installations, the rig toy, the booth analyser, the surf station.
- `src/player.js`, `collision.js`: first-person controls, touch, tour, capsule-vs-box collision.
- `src/audio.js`: procedural synth loop, analyser, room tone and footsteps (off until a user gesture).
- Lighting is easy to tune in `world.js` (`lamp(...)` intensity, `hemi`).
