# Technical Interview Prep — Foster Bright

> Grounded strictly in verified engineering work—no invented metrics, no proprietary code captures.

## UNOMi Software Update & Emotion Engine (Pixel Pirate Studio)

**Q: Why does the UNOMi Unreal Engine plugin rely on an external server instead of running inference locally inside Unreal?**
A: Heavyweight acoustic and speech-emotion ML models—specifically Kaldi forced alignment for phoneme timings and an INT8-quantized Wav2Vec2 Speech Emotion Recognition (SER) model—would stall the Unreal Editor game thread and dramatically bloat plugin distribution if embedded locally. Instead, the Unreal Engine 5.8 C++ plugin sends requests asynchronously over HTTP/JSON to an external FastAPI backend hosted on Cloud Run that runs both models in parallel and returns lightweight JSON (`phoneme timings` + `emotionFrames`), which our C++ code bakes cleanly into Unreal `UAnimSequence` assets via `IAnimationDataController`.

**Q: Walk me through the Slate UI (`SFacialExpressionPanel`) and saved emotion presets.**
A: In Unreal Engine 5.8, I build and refine `SFacialExpressionPanel` declaratively in C++ Slate. It exposes name-aligned facial morph-target sliders and physics toggles across brows, eyes, cheeks, nose, ears, and mouth, plus a 14-preset emotion system that persists strength values and morph bindings to `EmotionPresets.json` so artists can load, preview, and blend saved expressions directly inside Unreal Editor.

**Q: Tell me about the toughest Unreal Engine C++ bugs you fixed on UNOMi.**
A: Four concrete fixes stand out:
1. **Async HTTP Callback Tab-Closure Crash:** Asynchronous HTTP responses were capturing raw pointers to Slate widgets. If a user closed the plugin tab before the Cloud Run response arrived, the callback dereferenced a destroyed widget and crashed Unreal Editor. Fixing widget lifetime/weak-pointer safety across async callbacks eliminated that crash.
2. **Numeric Version Checks:** Plugin update checks were comparing version strings lexicographically instead of numerically (which breaks on multi-digit versions like `1.10` vs `1.2`). I updated version checks to parse and compare numeric components.
3. **Morph Slider Name Alignment:** Aligned facial morph-target sliders by morph target name so controls bind reliably across character rigs.
4. **UE 5.8 Compilation Fixes:** Resolved `UTextureRenderTarget2D` compilation errors and stabilized animation export workflows.

**Q: How do Material UV-driven eye jitter mechanics work?**
A: Instead of rotating an eye mesh or keying extra bone transforms for subtle micro-saccades, UV-driven eye jitter shifts UV coordinates directly in the eye material shader during rendering, pairing smoothly with facial morph targets and lip-sync curves.

**Q: How does your team collaborate across Unreal Engine, Blender, Maya, and Cinema 4D?**
A: I work with ASU Capstone Team 2 (CSE 485) and Pixel Pirate Studio sponsor engineers using Git/GitHub (`UNOMi-Solutions/Unreal_Engine_Plugin`), Taiga for task tracking, and Discord and Zoom for day-to-day technical syncs.

---

## Multiplayer Battle Tetris

**Q: How do you keep both players' piece sequences synchronized without streaming every piece?**
A: The server generates one RNG seed per match and sends it to both clients. Both clients run the exact same seeded 7-bag RNG algorithm, so their piece sequences are deterministic and identical without extra network traffic.

**Q: What stops a modified client from spawning free power-ups or ignoring garbage?**
A: Clients simulate their own board locally for snappy controls and report piece locks and power-up casts, but `gameRoom.js` on the server is authoritative over garbage queues, power-up inventories, and active shields. If a client sends a cast for an item the server did not grant, the server rejects it.

---

## Real-Time Surf Report (`surf-report`)

**Q: How do you handle multiple external APIs across ~100 surf breaks without sluggish loads?**
A: I fetch Open-Meteo Marine, Open-Meteo Weather, and NOAA CO-OPS Tides concurrently with `Promise.all` and store normalized results behind a 20-minute `localStorage` TTL cache, computing wave energy (`H^2 * T`), swell/wind alignment ratings, wetsuit advice, and custom HTML5 Canvas charts.

---

## Web Audio Rhythm Beatmap Generator & Visualizer

**Q: Why lock highway rendering to `AudioContext.currentTime` instead of `requestAnimationFrame` deltas?**
A: Frame deltas drift out of sync with audio playback on frame drops. `AudioContext.currentTime` reads the audio hardware clock directly, keeping note positions and the +/-35 ms PERFECT hit window strictly locked to the audio output.
