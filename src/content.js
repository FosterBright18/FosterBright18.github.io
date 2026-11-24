// Single source of truth. The 3D signage, media gallery, page view, printable resume, and text download all read this.
// Anything in [BRACKETS] is a placeholder to fill in. Nothing here is a measured claim unless you add one.
export const C = {
  name: 'Foster Bright',
  title: 'Software Engineer & Game Systems Developer',
  loc: 'Tempe, Arizona',
  gh: 'https://github.com/FosterBright18',
  site: 'https://fosterbright18.github.io/',
  email: 'fosterbright18@gmail.com',
  linkedin: '[LINKEDIN URL PLACEHOLDER]',
  // Optional live presence WebSocket server URL (see multiplayer-server/README.md). Leave empty '' to disable silently.
  multiplayerWs: 'https://mywesbite-60d3a-default-rtdb.firebaseio.com',
  summary: 'Computer Science (Software Engineering) senior at Arizona State University. I build Unreal Engine 5.8 C++ plugin features for the UNOMi Emotion Engine facial animation pipeline, real-time multiplayer networking, marine forecast analytics, and audio DSP tooling.',
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
    role: 'Software Engineering Intern and ASU Senior Capstone',
    org: 'UNOMi Software Update (Emotion Engine), Pixel Pirate Studio',
    dates: 'Sept 2026 to Present [FOSTER TO CONFIRM dates]',
    shortDates: 'Sept 2026 - Present',
    context: 'UNOMi Emotion Engine is an AI-powered facial animation system designed to automate character expressions by mapping acoustic prosody and speech-emotion recognition probabilities to 3D character morph targets. Working with ASU Capstone Team 2 and Pixel Pirate Studio sponsor engineers across Unreal Engine, Blender, Maya, and Cinema 4D workflows.',
    bullets: [
      'Build and test C++ functionality for an Unreal Engine 5.8 plugin in the UNOMi-Solutions/Unreal_Engine_Plugin repository supporting the UNOMi Emotion Engine facial animation pipeline.',
      'Implement and refine Slate UI components, including SFacialExpressionPanel, facial morph-target sliders, and a preset emotion system for facial shape blends that drive character expressions.',
      'Work on Material UV-driven eye jitter mechanics, lip-sync animation handling, and animation data export workflows for character animation and rendering behavior.',
      'Diagnose and resolve Unreal Editor stability issues, including plugin update checks and editor crashes during UI tab closure.',
      'Collaborate with ASU capstone teammates and Pixel Pirate Studio sponsor engineers across Unreal Engine, Blender, Maya, and Cinema 4D workflows using Git/GitHub, Taiga, Discord, and Zoom.'
    ]
  },
  // Drop your cleared videos (.mp4/.webm) and screenshots (.png/.jpg) into assets/unomi/ using these filenames
  // (or update src paths below). Missing files show a clean technical placeholder until you add them.
  unomiMedia: [
    {
      id: 'emotion-engine-demo',
      type: 'video',
      src: 'assets/unomi/emotion-engine-demo.mp4',
      title: 'UNOMi Emotion Engine // Live Demo',
      subtitle: 'UE 5.8 C++ Plugin & Facial Morph Pipeline',
      caption: 'Real-time Unreal Engine 5.8 capture of the UNOMi Emotion Engine driving 3D character facial morph targets from acoustic prosody and emotion probabilities.'
    },
    {
      id: 'slate-panel',
      type: 'image',
      src: 'assets/unomi/slate-panel.png',
      title: 'SFacialExpressionPanel // Slate UI',
      subtitle: 'Custom C++ Editor Tooling & Preset Blends',
      caption: 'Unreal Engine 5.8 Slate UI panel built in C++ featuring facial morph-target sliders and preset emotion facial shape blends.'
    },
    {
      id: 'eye-jitter-demo',
      type: 'video',
      src: 'assets/unomi/eye-jitter-demo.mp4',
      title: 'Material UV Eye Jitter & Lip Sync',
      subtitle: 'Shader-Driven Micro-Saccades & Export',
      caption: 'Material UV-driven eye jitter mechanics paired with lip-sync animation handling and animation data export inside Unreal Engine 5.8.'
    },
    {
      id: 'morph-blends',
      type: 'image',
      src: 'assets/unomi/morph-blends.png',
      title: 'Cross-DCC Workflow & Stability',
      subtitle: 'Unreal Engine 5.8, Blender, Maya & Cinema 4D',
      caption: 'Plugin workflow snapshots covering animation export compatibility, plugin update checks, and editor tab-closure stability fixes.'
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
    'Collaborating with ASU Capstone Team 2 and Pixel Pirate Studio sponsor engineers across Unreal Engine, Blender, Maya, and Cinema 4D pipelines.'
  ],
  support: 'CSE 330 (Operating Systems), CSE 445 (Distributed Software Development), and CSE 464 (Software Quality Assurance & Testing) directly support the server architecture, real-time networking, and verification work across these projects.',
  timeline: [
    ['Sept 2026 to Present [FOSTER TO CONFIRM]', 'UNOMi Software Update (Emotion Engine), Pixel Pirate Studio — Software Engineering Intern and ASU Senior Capstone (CSE 485)'],
    ['Expected 2027', 'B.S. Computer Science (Software Engineering), Arizona State University'],
    ['Projects', 'Multiplayer Battle Tetris, Real-Time Surf Report (surf-report), Web Audio Rhythm Beatmap Generator (dates [FOSTER TO CONFIRM])']
  ],
  refs: [], // Add { who, what } entries here; section stays hidden while empty.
  skills: {
    'Languages': ['C++', 'C#', 'Python', 'JavaScript (ES6+)', 'SQL', 'HTML5', 'CSS3'],
    'Engines, Graphics and Tools': ['Unreal Engine 5.8 (Slate UI, Morph Targets, Material UVs)', 'Blender API', 'Maya', 'HTML5 Canvas', 'Web Audio API', 'Git/GitHub', 'Visual Studio 2022', 'VS Code'],
    'Backend, Testing and Architecture': ['Node.js', 'Express', 'WebSockets', 'PostgreSQL', 'REST APIs', 'C# WCF & ASP.NET', 'JUnit', 'Basis-Path & Control-Flow Graph Testing']
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
