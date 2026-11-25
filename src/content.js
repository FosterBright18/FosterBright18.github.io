// Single source of truth. The 3D signage, 4-video UNOMi showcase, page view, printable resume, and text download all read this.
// Anything in [BRACKETS] is a placeholder to fill in. Nothing here is a measured claim unless you add one.
export const C = {
  name: 'Foster Bright',
  title: 'Software Engineer & Game Systems Developer',
  loc: 'Tempe, Arizona',
  gh: 'https://github.com/FosterBright18',
  site: 'https://fosterbright18.github.io/',
  email: 'fosterbright18@gmail.com',
  linkedin: '[LINKEDIN URL PLACEHOLDER]',
  // Live anonymous multiplayer presence via Firebase Realtime Database
  multiplayerWs: 'https://mywesbite-60d3a-default-rtdb.firebaseio.com',
  summary: 'Computer Science (Software Engineering) senior at Arizona State University. I build Unreal Engine 5.8 C++ editor plugins communicating with external AI inference servers (UNOMi Emotion Engine), real-time multiplayer networking, marine forecast analytics, and audio DSP tooling.',
  facts: [
    ['Location', 'Tempe, Arizona'],
    ['Graduation', 'Expected 2027 (B.S. Computer Science, Software Engineering, ASU)'],
    ['Role interests', '[ROLE INTERESTS PLACEHOLDER]'],
    ['Availability', '[AVAILABILITY PLACEHOLDER]'],
    ['Work authorization', '[WORK AUTHORIZATION PLACEHOLDER]'],
    ['Contact', 'fosterbright18@gmail.com (business cards in the contact office)']
  ],
  edu: {
    school: 'Arizona State University',
    degree: 'B.S. Computer Science (Software Engineering)',
    note: 'Senior standing. Expected graduation 2027.'
  },
  job: {
    role: 'Software Engineering Intern and ASU Senior Capstone (CSE 485)',
    org: 'UNOMi Software Update (Emotion Engine), Pixel Pirate Studio',
    dates: 'Sept 2026 to Present [FOSTER TO CONFIRM dates]',
    shortDates: 'Sept 2026 - Present',
    context: 'The UNOMi Emotion Engine automates 3D character facial expressions from speech. Because heavyweight acoustic and speech-emotion ML models cannot run inside the Unreal Editor game thread without stalling frame times or bloating plugin distribution, the Unreal Engine 5.8 C++ plugin offloads inference asynchronously over HTTP/JSON to an external FastAPI backend on Cloud Run.',
    architecture: [
      'UE 5.8 C++ Editor Module sends audio/requests asynchronously over HTTP to an external FastAPI server running on Cloud Run.',
      'External server runs Kaldi forced alignment (phoneme timings / visemes) and an INT8-quantized Wav2Vec2 Speech Emotion Recognition (SER) model in parallel.',
      'Structured JSON payloads (phoneme timings + emotionFrames probabilities) return to Unreal Engine, where C++ maps curves and bakes them directly into UAnimSequence assets via IAnimationDataController.'
    ],
    fixes: [
      'Async HTTP / Tab-Closure Crash Fix: Resolved Unreal Editor crashes where asynchronous HTTP callbacks captured raw pointers to Slate UI widgets that had already been destroyed when a user closed the plugin tab.',
      'Numeric Version Checks: Replaced fragile string-based version comparisons in plugin update checks with proper numeric version parsing.',
      'Morph Slider Name Alignment: Aligned facial morph-target sliders cleanly by morph target name across rigged meshes.',
      'UE 5.8 Build & Rendering Fixes: Resolved UTextureRenderTarget2D compilation errors and stabilized animation data export workflows.'
    ],
    bullets: [
      'Build and test C++ editor module functionality for an Unreal Engine 5.8 plugin (UNOMi-Solutions/Unreal_Engine_Plugin) communicating asynchronously over HTTP/JSON with an external Cloud Run FastAPI backend running Kaldi forced alignment and an INT8-quantized Wav2Vec2 SER model in parallel.',
      'Bake returned phoneme timings and emotionFrames curves into Unreal UAnimSequence assets via IAnimationDataController, alongside Material UV-driven eye jitter mechanics and lip-sync animation handling.',
      'Implement and refine C++ Slate UI components, including SFacialExpressionPanel with name-aligned facial morph-target sliders, physics toggles (brows, eyes, cheeks, nose, ears, mouth), and 14 preloaded/saved emotion presets persisted to EmotionPresets.json.',
      'Diagnose and fix critical Unreal Editor stability issues, including raw-pointer crashes in async HTTP callbacks on UI tab closure, numeric version comparison in plugin update checks, and UTextureRenderTarget2D compilation errors.',
      'Collaborate with ASU Capstone Team 2 and Pixel Pirate Studio sponsor engineers across Unreal Engine 5.8, Blender, Maya, and Cinema 4D workflows using Git/GitHub, Taiga, Discord, and Zoom.'
    ]
  },
  // Four video showcase bays in the UNOMi room. Drop your .mp4 files into assets/unomi/ with these exact names.
  unomiMedia: [
    {
      id: 'morph-sliders',
      slot: 'VIDEO 01 / 04',
      type: 'video',
      src: 'assets/unomi/morph-sliders.mp4',
      title: 'Morph-Target Sliders // Live Rig',
      subtitle: 'SFacialExpressionPanel Driving 3D Facial Morphs',
      caption: 'Live Unreal Engine 5.8 capture moving the character rig in real time via name-aligned C++ Slate UI morph-target sliders and physics toggles across brows, eyes, cheeks, nose, ears, and mouth.'
    },
    {
      id: 'saved-emotions',
      slot: 'VIDEO 02 / 04',
      type: 'video',
      src: 'assets/unomi/saved-emotions.mp4',
      title: 'Preloaded Saved Emotions',
      subtitle: '14 Emotion Presets via EmotionPresets.json',
      caption: 'Opening and applying preloaded saved emotion presets stored in EmotionPresets.json (strength values + morph target bindings) directly inside the Unreal Engine 5.8 editor panel.'
    },
    {
      id: 'speaking-emotions-1',
      slot: 'VIDEO 03 / 04',
      type: 'video',
      src: 'assets/unomi/speaking-emotions-1.mp4',
      title: 'Final Output I // Speaking with Emotions',
      subtitle: 'External FastAPI Server (Kaldi + Wav2Vec2) -> UAnimSequence',
      caption: 'End-to-end character dialogue generated by the external Cloud Run FastAPI inference server (parallel Kaldi forced alignment + INT8 Wav2Vec2 SER) and baked into a UAnimSequence via IAnimationDataController.'
    },
    {
      id: 'speaking-emotions-2',
      slot: 'VIDEO 04 / 04',
      type: 'video',
      src: 'assets/unomi/speaking-emotions-2.mp4',
      title: 'Final Output II // Full Emotional Performance',
      subtitle: 'Speech-Driven Expressions, Lip Sync & Material UV Eye Jitter',
      caption: 'Second full speaking performance demonstrating emotional transitions, synchronized lip sync, and Material UV-driven eye jitter running live inside Unreal Engine 5.8.'
    }
  ],
  projects: [
    {
      id: 'multiplayer-battle-tetris',
      name: 'Multiplayer Battle Tetris',
      short: 'Real-time 1v1 Tetris with arcade power-ups, Elo matchmaking, and a server-authoritative game room.',
      stack: ['Node.js', 'Express', 'WebSockets (ws)', 'PostgreSQL (auto migration, in-memory fallback)', 'JWT and bcrypt', 'HTML5 Canvas', 'Web Audio synth'],
      repo: 'https://github.com/FosterBright18/multiplayer-battle-tetris',
      demo: 'https://multiplayer-battle-tetris.onrender.com',
      cold: true,
      bullets: [
        'Server-authoritative rooms with a seeded 7-bag RNG so both players get identical piece sequences, plus SRS wall kicks.',
        'Garbage and power-up validation: Fog, Speed Surge, Clear Bottom 3, Piece Scramble, and Shield.',
        'K=32 Elo queue, private room codes, an adaptive server-side AI bot, and a simulated-latency HUD.'
      ],
      trade: [
        'Hosted on Render Free Tier, so the first load after idle is slow.',
        'Clients simulate their own board locally, and the server validates what they report.'
      ],
      next: '[FOSTER TO CONFIRM]',
      flow: ['Browser Canvas engine', 'WebSocket', 'Matchmaking queue', 'gameRoom.js (authoritative)', 'PostgreSQL or memory'],
      challenges: [
        ['Identical pieces', 'One seed per match. Both clients run the same 7-bag RNG, so pieces are never streamed and cannot diverge.'],
        ['Not trusting clients', 'The server owns garbage queues, inventories, and shields. A cast is rejected unless the server granted that item.'],
        ['Latency', 'Clients simulate locally and report locks. A latency slider and ping/tick HUD make the behavior visible.']
      ],
      data: 'Piece locks and casts go to the server, which validates them and pushes garbage, power, and state events to both players. At match end it records the result and Elo.'
    },
    {
      id: 'surf-report',
      name: 'Real-Time Surf Report and Marine Forecast',
      short: 'Modular surf forecast web app covering ~100 surf breaks with swell maps, ratings, and custom Canvas charts.',
      stack: ['JavaScript (ES6+)', 'Open-Meteo Marine and Weather APIs', 'NOAA CO-OPS Tides and Currents', 'HTML5 Canvas', 'localStorage TTL cache'],
      repo: 'https://github.com/FosterBright18/surf-report',
      demo: 'https://fosterbright18.github.io/surf-report/',
      bullets: [
        'Parallel fetching (Promise.all) of swell, wind, and NOAA tide predictions behind a 20-minute localStorage cache across ~100 surf breaks.',
        'Wave energy (kJ proportional to H squared times T), swell/wind alignment ratings, and a wetsuit advisor.',
        'A transparent heuristic crowd estimator and custom Canvas tide and 7-day charts.'
      ],
      trade: [
        'The crowd estimator is a heuristic, not a headcount.',
        'A 20-minute cache trades freshness for fewer requests.'
      ],
      next: '[FOSTER TO CONFIRM]',
      flow: ['Open-Meteo', 'NOAA CO-OPS', 'Promise.all', 'TTL cache (20 min)', 'Analytics', 'Canvas charts'],
      challenges: [
        ['Request volume', 'Three sources load concurrently, and a 20-minute cache avoids refetching.'],
        ['Data to judgment', 'Energy scales with H squared times T, so period matters as much as height. Alignment compares swell and wind to the spot orientation.'],
        ['Honest estimates', 'The crowd estimator is a heuristic with visible inputs, not a headcount.']
      ],
      data: 'Check cache, otherwise fetch in parallel, normalize the hourly series, run analytics, render ratings and charts, then write results back with a timestamp.'
    },
    {
      id: 'webaudio-rhythm-generator',
      name: 'Web Audio Rhythm Beatmap Generator and Visualizer',
      short: 'Generates playable 4-lane charts from any audio file and plays them on a drift-free highway.',
      stack: ['Vanilla JavaScript (ES6+)', 'Web Audio API (AudioContext, OfflineAudioContext)', 'FFT DSP', 'HTML5 Canvas'],
      repo: 'https://github.com/FosterBright18/webaudio-rhythm-generator',
      demo: 'https://fosterbright18.github.io/webaudio-rhythm-generator/',
      bullets: [
        'Spectral-flux peak detection across sub-bass, mid, and high bands makes 4-lane (D, F, J, K) charts from an upload or a built-in synth track.',
        'Highway rendering locked to AudioContext.currentTime to prevent audio-visual drift.',
        'PERFECT window of +/-35 ms, adjustable threshold and spacing controls, JSON beatmap import and export.'
      ],
      trade: [
        'Chart quality depends on the threshold and spacing settings.'
      ],
      next: '[FOSTER TO CONFIRM]',
      flow: ['Audio or synth track', 'Offline decode', 'FFT, 3 bands', 'Spectral flux peaks', 'Lane chart', 'Canvas highway'],
      challenges: [
        ['Drift', 'Every note position derives from AudioContext.currentTime, the audio hardware clock, never a frame counter.'],
        ['Onsets', 'Spectral flux per band lets bass, mids, and highs drive different lanes.'],
        ['Playability', 'Threshold and minimum spacing controls keep note density reasonable.']
      ],
      data: 'Audio is decoded, split into FFT frames, reduced to per-band flux, and peaks become timestamped notes that can be exported as JSON. Play compares key times to note times.'
    }
  ],
  unomiVerify: 'Sponsor repository (UNOMi-Solutions/Unreal_Engine_Plugin), details on request [FOSTER TO CONFIRM]',
  how: [
    'Source control and code review workflow with Git and GitHub.',
    'Task and milestone tracking in Taiga.',
    'Day-to-day technical communication on Discord and Zoom.',
    'Collaborating with ASU Capstone Team 2 and Pixel Pirate Studio sponsor engineers across Unreal Engine 5.8, Blender, Maya, and Cinema 4D pipelines.'
  ],
  support: 'CSE 330 (Operating Systems), CSE 445 (Distributed Software Development), and CSE 464 (Software Quality Assurance & Testing) directly support the distributed client-server architecture, async networking, and verification work across UNOMi and these projects.',
  timeline: [
    ['Sept 2026 to Present [FOSTER TO CONFIRM]', 'UNOMi Software Update (Emotion Engine), Pixel Pirate Studio — Software Engineering Intern and ASU Senior Capstone (CSE 485)'],
    ['Expected 2027', 'B.S. Computer Science (Software Engineering), Arizona State University'],
    ['Projects', 'Multiplayer Battle Tetris, Real-Time Surf Report (surf-report), Web Audio Rhythm Beatmap Generator (dates [FOSTER TO CONFIRM])']
  ],
  refs: [],
  skills: {
    'Languages': ['C++', 'C#', 'Python', 'JavaScript (ES6+)', 'SQL', 'HTML5', 'CSS3'],
    'Engines, Graphics and Tools': ['Unreal Engine 5.8 (Slate UI, IAnimationDataController, Morph Targets, Material UVs)', 'Blender API', 'Maya', 'HTML5 Canvas', 'Web Audio API', 'Git/GitHub', 'Visual Studio 2022', 'VS Code'],
    'Backend, Testing and Architecture': ['Node.js', 'Express', 'WebSockets', 'PostgreSQL', 'REST APIs', 'FastAPI / Cloud Run Integration', 'C# WCF & ASP.NET', 'JUnit', 'Basis-Path & Control-Flow Graph Testing']
  },
  courses: [
    'CSE 485 — Computer Science Capstone I',
    'CSE 445 — Distributed Software Development',
    'CSE 460 — Software Analysis and Design',
    'CSE 464 — Software Quality Assurance and Testing',
    'CSE 330 — Operating Systems',
    'CSE 340 — Principles of Programming Languages',
    'CSE 355 — Theoretical Computer Science',
    'CSE 365 — Information Assurance',
    'MAT 343 — Applied Linear Algebra',
    'IEE 380 — Probability and Statistics for Engineering'
  ]
};
