# Build State

| Field | Value |
| --- | --- |
| Project | **Sky & Sea 3D — Ambient Study & Focus Sanctuary** (`sky-and-sea-3d`) |
| Started | 2026-11-01 07:28:10 UTC |
| Packaged | 2026-11-01 08:00:45 UTC |
| Duration | **32m 35s** (1,955 seconds) |
| Harness | OpenCode 2.2.5 |
| Model | DeepSeek V4.1 Flash (`opencode-go/deepseek-v4.1-flash`) |
| Session | `ses_e69fdc73dffeZoGaFIXXZkL8tO` |
| Repository | <https://github.com/somphol/sky-and-sea-3d> |
| Live demo | <https://somphol.github.io/sky-and-sea-3d/> |

## Token usage

| Metric | Tokens |
| --- | ---: |
| Input | 486,195 |
| Output | 110,962 |
| Reasoning | 66,976 |
| **Total (input + output + reasoning)** | **664,133** |
| Cache read | 19,606,400 |
| Cache write | 1,142 |
| Total including cache | 20,270,533 |

> Final snapshot taken from the OpenCode session record at 2026-11-01 08:00:43 UTC, after GitHub publication and live Pages verification, immediately before the final state commit. That final commit adds only a marginal number of tokens. Total cost reported by the session: **$0.00**.

## What was built

A complete, no-build interactive 3D ambient study sanctuary across three modular source files:

- `index.html` — 28,930 bytes, 515 lines
- `style.css` — 60,029 bytes, 2,817 lines
- `script.js` — 110,216 bytes, 2,909 lines
- `README.md` — 11,670 bytes, 264 lines

### Scenery engine

- **Ocean Drift** — a 760 × 760 water plane with 170 × 170 segments and a custom GLSL vertex/fragment shader. Five overlapping wave fields feed analytical normals, Fresnel sky reflection, sun and moon glints, crest foam, distance haze and bioluminescent surface light. A sailboat, horizon clouds, stars, sun/moon sprites and fog complete the scene.
- **SkyCraft Soar** — volumetric-style cloud banks built from layered procedural canvas sprites, a dense sea of cloud, five floating island ecosystems with low-poly rock cones, grass caps, pine forests, ruins, floating shards, glowing crystals and a flock of birds.
- **Four atmosphere studies** — Golden Sunset, Moonlit Bioluminescent Night, Misty Morning Dawn and Deep Dusk. Preset changes interpolate exposure, fog, hemisphere and directional light, sky gradient, sun/moon direction and scale, water uniforms, cloud tint and star opacity over 2.2 seconds.
- **Cinematic auto-pilot** — slow elliptical orbit with vertical drift and a smoothed look target. Dragging the scenery enables OrbitControls; auto-pilot resumes after nine seconds. Sun sprites are anchored to the camera so they stay aligned with the shader sun.

### Ambient audio

- Custom Web Audio graph with a compressor and master bus.
- Ocean surf: looping brown noise, high/low-pass filters and slow swell/undertow LFOs.
- Soft rain: filtered white noise with a breathing LFO.
- Wind chimes: scheduled pentatonic sine chimes with overtones, random timing, stereo panning and long decay tails.
- 432 Hz focus tone: 432 Hz left / 438 Hz right binaural pair, 6 Hz beat, sub-harmonics and a warm triangle bed.
- Persistent four-channel + master mixer, mute, dormant-until-gesture start, and a separate gentle completion chime.

### Focus and productivity

- 25-minute focus / 5-minute break Pomodoro with start, pause, resume, reset, skip and auto-break.
- Wall-clock countdown survives tab throttling and reloads.
- Focus seconds are recorded as they happen; completed sessions and daily totals are logged.
- Four-cycle session dots, gold focus badge, contextual study prompts.

### Music and persistence

- Privacy-enhanced YouTube drawer with four curated long-form streams: a 2 h 50 m Lofi Girl mix, Chillhop Radio, Synthwave Radio and a 4-hour Quiet Quest ambient mix.
- Custom YouTube URL parser supports watch, live, Short, `youtu.be` and bare 11-character IDs.
- localStorage autosave with `focus_sanctuary_log.json` export and validated JSON import.
- Imported values are sanitized and clamped; timer state is preserved during import.

### Interface

- Minimalist glassmorphic zen design with gold focus badges and a live atmosphere indicator.
- Responsive desktop, tablet and 390 × 844 mobile layouts.
- Mobile bottom-sheet panels and a four-button dock.
- Hide UI mode via `H`, the eye button or the dock; on touch devices a persistent “Tap to restore the interface” chip remains available.
- Auto-hiding cursor in desktop hidden mode, reduced-motion support, WebGL fallback and a 16-check self-test surface.

## Verification

- **16/16** self-tests pass (`?selftest=1`, or `SkySea.runSelfTests()`).
- **0** uncaught exceptions and **0** application console errors in the Chrome DevTools Protocol interaction run.
- Verified ocean/sky group visibility, all four presets, auto-pilot camera state and finite camera coordinates.
- Verified timer start/pause, a simulated focus completion, statistics increment, automatic break start and restored state.
- Verified the synthesized audio graph builds, four channels update, mute state persists and completion chimes use a separate path.
- Verified `focus_sanctuary_log.json` download and a real synthetic File import with sanitized values.
- Verified keyboard shortcuts `H`, `2`, `O` and `Space`.
- Verified mobile layout at 390 × 844 with no horizontal overflow, four dock buttons, bottom-sheet panels and the touch restore chip.
- Verified the YouTube iframe loads the long-form Lofi Girl mix.
- Captured six clean screenshots: desktop Golden Sunset, moonlit SkyCraft, Misty Dawn, mobile SkyCraft, mobile focus panel and hide-UI mode.
- Published to GitHub, enabled Pages, and re-ran the live site at <https://somphol.github.io/sky-and-sea-3d/?selftest=1>: **16/16** tests pass with **0** runtime errors.

## Files

| File | Size |
| --- | ---: |
| `index.html` | 28,930 bytes |
| `style.css` | 60,029 bytes |
| `script.js` | 110,216 bytes |
| `README.md` | 11,670 bytes |
| `favicon.svg` | 1,088 bytes |
| `screenshot.png` | 1,120,239 bytes |
| `screenshot-sky.png` | 1,227,914 bytes |
| `screenshot-dawn.png` | 1,104,704 bytes |
| `screenshot-mobile.png` | 1,088,575 bytes |
| `screenshot-mobile-focus.png` | 539,690 bytes |
| `screenshot-hidden.png` | 1,065,514 bytes |
| `state.json` | build record |
| `LICENSE` | MIT |
| `THIRD_PARTY_NOTICES.md` | runtime credits |

## Notes

- No image, texture, 3D model or audio sample assets are included. Sea, sky, clouds, islands, particles, sailboat and soundscape are generated at runtime.
- The only network dependencies are the Three.js CDN, Google Fonts and optional YouTube embeds.
- GitHub Pages is a static root deployment; `.nojekyll` is included.
- The stored GitHub credential was read once into a temporary 0600 file, reused across repository creation, push and Pages setup, then deleted.

## Credits

Built with [OpenCode](https://opencode.ai) 2.2.5 and **DeepSeek V4.1 Flash** (`opencode-go/deepseek-v4.1-flash`) in a single agent session. The scenery engine, shaders, island generator, UI, audio synthesis, timer, persistence and verification harness were generated for this project.

Runtime libraries: [Three.js](https://threejs.org/) r128 (MIT) and OrbitControls from the Three.js r128 examples (MIT). Typefaces: **Cormorant Garamond**, **Manrope** and **IBM Plex Mono** from Google Fonts (SIL OFL 1.1). See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
