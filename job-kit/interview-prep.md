# Technical Interview Prep — Foster Bright

> Every answer below stays strictly within verified work—no invented metrics, no unreleased/proprietary code details.

## UNOMi Software Update & Emotion Engine (Pixel Pirate Studio)

**Q: What is the UNOMi Emotion Engine, and what is your specific role on it?**
A: The UNOMi Emotion Engine is an AI-powered facial animation system designed to automate character expressions by mapping acoustic prosody and speech-emotion recognition probabilities to 3D character morph targets. As a Software Engineering Intern and ASU Senior Capstone developer (Capstone Team 2), my focus is on the Unreal Engine 5.8 C++ plugin (`UNOMi-Solutions/Unreal_Engine_Plugin`), building and testing C++ functionality, Slate UI panels, facial morph controls, Material UV-driven eye jitter mechanics, lip-sync/animation export workflows, and editor stability fixes.

**Q: Walk me through `SFacialExpressionPanel` and the Slate UI work.**
A: In Unreal Engine 5.8, editor panels are built declaratively in C++ using Slate. I implement and refine `SFacialExpressionPanel` along with facial morph-target sliders and a preset emotion system for facial shape blends so artists and developers can preview, adjust, and blend character expressions driven by the Emotion Engine workflow directly inside the editor.

**Q: How do Material UV-driven eye jitter mechanics work, and why use UVs?**
A: Instead of rotating an entire eye mesh or keying extra bone transforms for subtle micro-saccades, UV-driven eye jitter shifts the UV coordinates on the eye material to create small, natural-looking iris/pupil offsets during character animation and rendering. It integrates cleanly into the material rendering path alongside facial morph targets.

**Q: Tell me about a tricky bug you worked on in the Unreal plugin.**
A: Two concrete areas I worked on were fixing plugin update-check behavior and addressing Unreal Editor crashes occurring when closing the plugin's UI tab. Editor crashes on tab closure typically come down to widget/delegate lifetime management—ensuring callbacks, weak references, or state bindings are cleaned up properly when Slate tears down the tab so the editor never dereferences stale pointers.

**Q: How does your team collaborate across Unreal Engine, Blender, Maya, and Cinema 4D?**
A: I work with ASU Capstone Team 2 and Pixel Pirate Studio sponsor engineers using Git and GitHub for source control, Taiga for task tracking, and Discord and Zoom for day-to-day technical syncs so plugin behavior and animation data exports stay consistent across DCC tools.

---

## Multiplayer Battle Tetris

**Q: How do you keep both players' piece sequences synchronized without streaming every piece?**
A: The server generates one RNG seed per match and sends it to both clients. Both clients run the exact same seeded 7-bag RNG algorithm, so their piece sequences are deterministic and identical without extra network traffic.

**Q: What stops a modified client from spawning free power-ups or ignoring garbage?**
A: Clients simulate their own board locally for snappy controls and report piece locks and power-up casts, but `gameRoom.js` on the server is authoritative over garbage queues, power-up inventories, and active shields. If a client sends a cast for an item the server did not grant, the server rejects it.

**Q: What tradeoffs did you make with hosting and database setup?**
A: It runs on Render Free Tier, so cold starts after idle take around 45 seconds (which I note transparently in the UI and mitigate with an early warm-up fetch when visitors approach the project hall). For storage, PostgreSQL runs with auto-migration and falls back gracefully to in-memory state if no database is configured.

---

## Web Audio Rhythm Beatmap Generator & Visualizer

**Q: Why lock highway rendering to `AudioContext.currentTime` instead of `requestAnimationFrame` deltas?**
A: Frame deltas accumulate tiny timing errors and pause or jump on frame drops, causing notes to drift out of sync with the music. `AudioContext.currentTime` reads the audio hardware clock directly, so note positions and the +/-35 ms PERFECT hit window stay locked to the actual audio output.

**Q: How does automatic beatmap generation work?**
A: The app decodes an uploaded audio file (or built-in synth track) via `OfflineAudioContext`, slices it into FFT frames, computes spectral flux across sub-bass, mid, and high frequency bands, and converts detected flux peaks into timestamped 4-lane (`D`, `F`, `J`, `K`) notes. Users can tune the detection threshold and minimum note spacing and import/export charts as JSON.

---

## Real-Time Surf Report & Marine Forecast Dashboard

**Q: How do you handle multiple external APIs without sluggish loads or spamming rate limits?**
A: I fetch Open-Meteo Marine, Open-Meteo Weather, and NOAA CO-OPS Tides concurrently with `Promise.all` and store normalized results behind a 20-minute `localStorage` TTL cache. That cuts repeat network calls while keeping forecasts fresh enough for surf sessions.

**Q: How do you turn raw marine data into surfer-readable judgments?**
A: Wave energy scales proportionally with `H^2 * T` (wave height squared times swell period), so longer-period swells score much higher than wind chop of the same height. I combine that with swell/wind orientation alignment ratings, a wetsuit advisor, and a transparent heuristic crowd estimator whose inputs are visible rather than pretending to be a real headcount.
