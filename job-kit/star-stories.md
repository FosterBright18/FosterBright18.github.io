# STAR Stories — Foster Bright

> Metric placeholders (`[METRIC PLACEHOLDER]`) are left intentionally blank—only fill in numbers you have personally measured.

## 1. UNOMi Emotion Engine & Unreal Engine 5.8 Plugin (Pixel Pirate Studio)
- **Situation**: As a Software Engineering Intern and ASU Senior Capstone developer (Capstone Team 2) with Pixel Pirate Studio, our team is building updates for the UNOMi Emotion Engine—an AI-powered facial animation system that maps acoustic prosody and speech-emotion recognition probabilities to 3D character morph targets across Unreal Engine, Blender, Maya, and Cinema 4D workflows.
- **Task**: Build and stabilize C++ Unreal Engine 5.8 plugin features in `UNOMi-Solutions/Unreal_Engine_Plugin`, including artist-facing Slate UI controls (`SFacialExpressionPanel`), facial morph-target sliders, preset emotion shape blends, Material UV-driven eye jitter mechanics, and Unreal Editor lifecycle stability.
- **Action**: Implemented and refined Slate UI widgets in C++ to expose facial morph-target sliders and preset emotion blends directly inside Unreal Editor; worked on Material UV offset logic for realistic eye jitter behavior alongside lip-sync animation handling and animation data export workflows; tracked down and fixed plugin update-check behavior and editor crashes triggered when closing the plugin's UI tab; coordinated reviews and milestones with teammates and sponsor engineers via Git/GitHub, Taiga, Discord, and Zoom.
- **Result**: Delivered working Unreal Engine 5.8 C++ plugin UI, animation control features, and editor stability fixes aligned with the cross-DCC Emotion Engine workflow (`[METRIC PLACEHOLDER — e.g., number of PRs merged or bugs closed if verified]`).

## 2. Multiplayer Battle Tetris
- **Situation**: Real-time competitive browser games are prone to piece desync, client-side cheating, and unresponsive feel when network latency spikes.
- **Task**: Architect a full-stack 1v1 Battle Tetris game with arcade power-ups, Elo matchmaking, private rooms, and a solo AI opponent while keeping the server authoritative.
- **Action**: Built a Node.js + Express + WebSockets (`ws`) backend with `gameRoom.js` as the authoritative game room and PostgreSQL persistence (with auto-migration and in-memory fallback). Generated one shared RNG seed per match so both clients run identical 7-bag piece sequences without streaming pieces; validated all garbage queues, inventories, and power-up casts (Fog, Speed Surge, Clear Bottom 3, Piece Scramble, Shield) on the server; added a K=32 Elo queue, an adaptive server-side AI bot, and a simulated-latency HUD.
- **Result**: Deployed a live playable multiplayer system (`multiplayer-battle-tetris.onrender.com`) where clients get responsive local board simulation while match fairness, power-ups, and Elo remain server-validated (`[METRIC PLACEHOLDER]`).

## 3. Web Audio Rhythm Beatmap Generator & Visualizer
- **Situation**: Rhythm games built on `requestAnimationFrame` counters drift out of sync with audio playback, and manually charting tracks is time-consuming.
- **Task**: Create a browser tool that analyzes any uploaded audio file (or built-in synth track) into a playable 4-lane rhythm chart and renders it without audio-visual drift.
- **Action**: Used Web Audio API (`OfflineAudioContext` and `AudioContext`) to decode audio, run FFT spectral-flux peak detection across sub-bass, mid, and high frequency bands, and map detected onsets to 4 lanes (`D`, `F`, `J`, `K`) with user-adjustable threshold and minimum-spacing controls plus JSON beatmap import/export. Locked highway rendering strictly to `AudioContext.currentTime` with a +/-35 ms PERFECT hit window.
- **Result**: Published a zero-dependency vanilla JS rhythm generator and playable highway on GitHub Pages (`fosterbright18.github.io/webaudio-rhythm-generator/`) with drift-free playback (`[METRIC PLACEHOLDER]`).

## 4. Real-Time Surf Report & Marine Forecast Dashboard
- **Situation**: Checking surf conditions often requires cross-referencing separate swell, wind, and tide sources while avoiding redundant API calls.
- **Task**: Combine live marine, weather, and tide data into clear ratings and custom charts in a lightweight static web app.
- **Action**: Built parallel API fetching (`Promise.all`) across Open-Meteo Marine/Weather APIs and NOAA CO-OPS Tides and Currents behind a 20-minute `localStorage` TTL cache. Computed wave energy (`kJ` proportional to `H^2 * T`), swell/wind alignment ratings, a wetsuit advisor, a transparent heuristic crowd estimator, and custom HTML5 Canvas tide and 7-day forecast charts.
- **Result**: Deployed a responsive live marine forecast dashboard on GitHub Pages (`fosterbright18.github.io/surf-report/`) that turns multi-source hourly series into readable forecasts (`[METRIC PLACEHOLDER]`).
