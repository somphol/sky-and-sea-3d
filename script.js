/* ==========================================================================
   Sky & Sea 3D — Ambient Study & Focus Sanctuary
   Vanilla ES6 · Three.js r128 · Web Audio API
   ========================================================================== */

(() => {
  "use strict";

  const APP_ID = "sky-and-sea-3d";
  const APP_VERSION = "1.0.0";
  const STORAGE_KEY = "sky_and_sea_sanctuary_v1";
  const FOCUS_SECONDS = 25 * 60;
  const BREAK_SECONDS = 5 * 60;
  const TIMER_DURATIONS = { focus: FOCUS_SECONDS, break: BREAK_SECONDS };
  const RING_CIRCUMFERENCE = 2 * Math.PI * 86;

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smoothstep = (t) => t * t * (3 - 2 * t);
  const todayKey = () => {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  };
  const formatClockTime = (seconds) => {
    const safe = Math.max(0, Math.ceil(seconds));
    return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
  };
  const formatStudyTime = (seconds) => {
    const totalMinutes = Math.floor(Math.max(0, seconds) / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
  };
  const asFinite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

  /* ------------------------------------------------------------------------
     Content and visual presets
     ------------------------------------------------------------------------ */

  const SCENES = {
    ocean: {
      label: "Ocean Drift",
      micro: "waves · 60 fps",
      caption: {
        title: "Let the horizon<br><em>carry your thoughts.</em>",
        text: "A slow orbit over an emerald sea, tuned to the last warm hour of daylight."
      }
    },
    sky: {
      label: "SkyCraft Soar",
      micro: "clouds · 60 fps",
      caption: {
        title: "Drift above the<br><em>quiet world.</em>",
        text: "Floating sanctuaries and a slow sea of cloud, far from the noise below."
      }
    }
  };

  const PRESETS = {
    sunset: {
      label: "Golden Sunset",
      time: "18:42",
      wind: "6.2 kn",
      swell: "0.8 m",
      accent: "#e7c78d",
      caption: {
        ocean: {
          title: "Let the horizon<br><em>carry your thoughts.</em>",
          text: "A slow orbit over an emerald sea, tuned to the last warm hour of daylight."
        },
        sky: {
          title: "Drift above the<br><em>golden world.</em>",
          text: "Warm light spills between floating islands while the clouds turn to amber."
        }
      },
      state: {
        exposure: 1.04,
        fogColor: "#8b5b52",
        fogDensity: 0.00155,
        hemiSky: "#ffc18a",
        hemiGround: "#0c333c",
        hemiIntensity: 0.82,
        dirColor: "#ffd09a",
        dirIntensity: 1.28,
        dirPos: [125, 33, -190],
        skyTop: "#112a46",
        skyHorizon: "#e39b69",
        skyBottom: "#1d4952",
        sunColor: "#ffd09a",
        sunGlow: 1.15,
        sunScale: 1,
        waterDeep: "#052b35",
        waterShallow: "#1e6b6c",
        waterSky: "#d48967",
        waterSun: "#ffd4a0",
        waterFoam: "#ffe6c7",
        waterGlow: "#1c7b78",
        waterGlowIntensity: 0.24,
        waveHeight: 1.05,
        starsOpacity: 0.04,
        cloudOpacity: 0.34,
        cloudTint: "#f2b890"
      }
    },
    moonlit: {
      label: "Moonlit Bioluminescent Night",
      time: "00:17",
      wind: "3.8 kn",
      swell: "1.2 m",
      accent: "#8ee1d8",
      caption: {
        ocean: {
          title: "The sea keeps<br><em>its own small stars.</em>",
          text: "Under a moonlit sky, bioluminescent currents trace slow constellations across the water."
        },
        sky: {
          title: "A quieter kind<br><em>of midnight.</em>",
          text: "Moonlit islands drift through a deep blue cloud sea, lit by tiny living constellations."
        }
      },
      state: {
        exposure: 0.9,
        fogColor: "#061623",
        fogDensity: 0.00215,
        hemiSky: "#4b6c9e",
        hemiGround: "#06151c",
        hemiIntensity: 0.55,
        dirColor: "#b7d6ff",
        dirIntensity: 0.86,
        dirPos: [108, 126, -172],
        skyTop: "#030918",
        skyHorizon: "#0b2742",
        skyBottom: "#071d2b",
        sunColor: "#d7ecff",
        sunGlow: 1.32,
        sunScale: 0.48,
        waterDeep: "#020f18",
        waterShallow: "#0a4854",
        waterSky: "#0e3850",
        waterSun: "#a8e7ff",
        waterFoam: "#b8fff2",
        waterGlow: "#35e0d0",
        waterGlowIntensity: 1.85,
        waveHeight: 0.86,
        starsOpacity: 1,
        cloudOpacity: 0.22,
        cloudTint: "#7fa4bb"
      }
    },
    dawn: {
      label: "Misty Morning Dawn",
      time: "06:12",
      wind: "2.1 kn",
      swell: "0.4 m",
      accent: "#f1c8bd",
      caption: {
        ocean: {
          title: "Begin again,<br><em>softly.</em>",
          text: "Pearl mist rests on a silver sea while the first pale light finds the water."
        },
        sky: {
          title: "The world,<br><em>before it wakes.</em>",
          text: "Floating gardens emerge from a pearl-coloured cloud sea in the hush before morning."
        }
      },
      state: {
        exposure: 1.08,
        fogColor: "#aeb2af",
        fogDensity: 0.00235,
        hemiSky: "#f6d7c8",
        hemiGround: "#4a6467",
        hemiIntensity: 0.92,
        dirColor: "#ffdfc2",
        dirIntensity: 0.82,
        dirPos: [-95, 28, -205],
        skyTop: "#8ea8bd",
        skyHorizon: "#e8c7bd",
        skyBottom: "#9cb2b2",
        sunColor: "#fff0dc",
        sunGlow: 0.78,
        sunScale: 0.78,
        waterDeep: "#27444b",
        waterShallow: "#5b8382",
        waterSky: "#c7c0b8",
        waterSun: "#ffe5c6",
        waterFoam: "#f8f4eb",
        waterGlow: "#86b4ae",
        waterGlowIntensity: 0.06,
        waveHeight: 0.62,
        starsOpacity: 0,
        cloudOpacity: 0.66,
        cloudTint: "#e9d7cf"
      }
    },
    dusk: {
      label: "Deep Dusk",
      time: "20:06",
      wind: "5.4 kn",
      swell: "0.9 m",
      accent: "#c6a8e8",
      caption: {
        ocean: {
          title: "Between day and dark,<br><em>stay a while.</em>",
          text: "Violet light gathers on the water as the last ember of the sun slips below the world."
        },
        sky: {
          title: "The last light<br><em>before the stars.</em>",
          text: "Floating islands turn to silhouettes beneath a deep dusk of violet and fading rose."
        }
      },
      state: {
        exposure: 0.97,
        fogColor: "#2f2744",
        fogDensity: 0.00195,
        hemiSky: "#9b6a86",
        hemiGround: "#12182b",
        hemiIntensity: 0.7,
        dirColor: "#ff997f",
        dirIntensity: 1.08,
        dirPos: [178, 18, -150],
        skyTop: "#16152f",
        skyHorizon: "#c57d79",
        skyBottom: "#34334d",
        sunColor: "#ffb38c",
        sunGlow: 1.08,
        sunScale: 0.9,
        waterDeep: "#14172f",
        waterShallow: "#4b4568",
        waterSky: "#6d5167",
        waterSun: "#ffb28f",
        waterFoam: "#e3bca9",
        waterGlow: "#6c6aa3",
        waterGlowIntensity: 0.35,
        waveHeight: 1,
        starsOpacity: 0.3,
        cloudOpacity: 0.33,
        cloudTint: "#d69b9e"
      }
    }
  };

  const STREAMS = [
    { id: "CFGLoQIhmow", title: "Lofi Girl · beats to relax/study to (2h 50m)" },
    { id: "5yx6BWlEVcY", title: "Chillhop Music · jazzy & chill beats (live)" },
    { id: "4xDzrJKXOOY", title: "Lofi Girl · synthwave radio (live)" },
    { id: "sjkrrmBnpGE", title: "Quiet Quest · 4 hours of ambient study music" }
  ];

  /* ------------------------------------------------------------------------
     State
     ------------------------------------------------------------------------ */

  function createDefaultState() {
    return {
      app: APP_ID,
      version: APP_VERSION,
      stats: {
        totalFocusSeconds: 0,
        completedPomodoros: 0,
        sessions: [],
        daily: {}
      },
      preferences: {
        scene: "ocean",
        preset: "sunset",
        volumes: { ocean: 52, rain: 20, chimes: 36, binaural: 14, master: 72 },
        muted: false,
        autoBreak: true
      },
      timer: {
        mode: "focus",
        remaining: FOCUS_SECONDS,
        running: false,
        endAt: null,
        lastTickAt: null
      },
      youtube: {
        lastStream: null
      },
      savedAt: null
    };
  }

  function sanitizeState(raw) {
    const base = createDefaultState();
    if (!raw || typeof raw !== "object") return base;

    const stats = raw.stats && typeof raw.stats === "object" ? raw.stats : {};
    base.stats.totalFocusSeconds = clamp(asFinite(stats.totalFocusSeconds, 0), 0, 60 * 60 * 24 * 365 * 10);
    base.stats.completedPomodoros = Math.floor(clamp(asFinite(stats.completedPomodoros, 0), 0, 1000000));
    base.stats.sessions = Array.isArray(stats.sessions)
      ? stats.sessions.filter((entry) => entry && typeof entry === "object").slice(0, 1000).map((entry) => ({
          completedAt: typeof entry.completedAt === "string" ? entry.completedAt : new Date().toISOString(),
          minutes: clamp(asFinite(entry.minutes, 25), 0, 600),
          type: entry.type === "break" ? "break" : "focus"
        }))
      : [];
    base.stats.daily = {};
    if (stats.daily && typeof stats.daily === "object" && !Array.isArray(stats.daily)) {
      Object.entries(stats.daily).slice(0, 800).forEach(([key, value]) => {
        if (/^\d{4}-\d{2}-\d{2}$/.test(key)) {
          base.stats.daily[key] = clamp(asFinite(value, 0), 0, 60 * 60 * 24);
        }
      });
    }

    const prefs = raw.preferences && typeof raw.preferences === "object" ? raw.preferences : {};
    if (prefs.scene === "ocean" || prefs.scene === "sky") base.preferences.scene = prefs.scene;
    if (PRESETS[prefs.preset]) base.preferences.preset = prefs.preset;
    if (prefs.volumes && typeof prefs.volumes === "object") {
      Object.keys(base.preferences.volumes).forEach((channel) => {
        base.preferences.volumes[channel] = Math.round(clamp(asFinite(prefs.volumes[channel], base.preferences.volumes[channel]), 0, 100));
      });
    }
    base.preferences.muted = Boolean(prefs.muted);
    base.preferences.autoBreak = prefs.autoBreak !== false;

    const timer = raw.timer && typeof raw.timer === "object" ? raw.timer : {};
    base.timer.mode = timer.mode === "break" ? "break" : "focus";
    base.timer.remaining = clamp(asFinite(timer.remaining, TIMER_DURATIONS[base.timer.mode]), 0, TIMER_DURATIONS[base.timer.mode]);
    base.timer.running = Boolean(timer.running);
    base.timer.endAt = asFinite(timer.endAt, 0) || null;
    base.timer.lastTickAt = asFinite(timer.lastTickAt, 0) || null;
    if (!base.timer.running) {
      base.timer.endAt = null;
    }

    if (raw.youtube && typeof raw.youtube === "object" && typeof raw.youtube.lastStream === "string") {
      const id = extractYouTubeId(raw.youtube.lastStream);
      if (id) base.youtube.lastStream = id;
    }

    base.savedAt = typeof raw.savedAt === "string" ? raw.savedAt : null;
    return base;
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? sanitizeState(JSON.parse(raw)) : createDefaultState();
    } catch (error) {
      console.warn("Sky & Sea: could not load the local study log.", error);
      return createDefaultState();
    }
  }

  function extractYouTubeId(input) {
    if (typeof input !== "string") return null;
    const value = input.trim();
    if (/^[A-Za-z0-9_-]{11}$/.test(value)) return value;
    let url;
    try {
      url = new URL(value);
    } catch {
      return null;
    }
    const host = url.hostname.replace(/^www\./, "").replace(/^m\./, "");
    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return /^[A-Za-z0-9_-]{11}$/.test(id || "") ? id : null;
    }
    if (host === "youtube.com" || host === "youtube-nocookie.com" || host === "music.youtube.com") {
      const v = url.searchParams.get("v");
      if (/^[A-Za-z0-9_-]{11}$/.test(v || "")) return v;
      const pieces = url.pathname.split("/").filter(Boolean);
      const candidate = pieces[0] === "embed" || pieces[0] === "live" || pieces[0] === "shorts" ? pieces[1] : null;
      return /^[A-Za-z0-9_-]{11}$/.test(candidate || "") ? candidate : null;
    }
    return null;
  }

  /* ------------------------------------------------------------------------
     Procedural Web Audio soundscape
     ------------------------------------------------------------------------ */

  class SoundGarden {
    constructor(preferences) {
      this.ctx = null;
      this.master = null;
      this.compressor = null;
      this.layers = {};
      this.enabled = false;
      this.muted = Boolean(preferences.muted);
      this.volumes = { ...preferences.volumes };
      this.chimeTimer = null;
      this.chimeGain = null;
      this.alertGain = null;
      this.built = false;
      this.failed = false;
    }

    async resumeContext() {
      if (!this.ctx || this.ctx.state !== "suspended") return;
      try {
        await Promise.race([
          this.ctx.resume(),
          new Promise((resolve) => window.setTimeout(resolve, 800))
        ]);
      } catch {
        /* The browser may still be waiting for a direct gesture. */
      }
    }

    async prepare() {
      if (this.failed) throw new Error("Audio is unavailable.");
      if (this.ctx) {
        await this.resumeContext();
        return this.ctx;
      }

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) throw new Error("Web Audio is not supported by this browser.");

      this.ctx = new AudioCtx();
      await this.resumeContext();

      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.value = -18;
      this.compressor.knee.value = 20;
      this.compressor.ratio.value = 4;
      this.compressor.attack.value = 0.004;
      this.compressor.release.value = 0.25;
      this.compressor.connect(this.ctx.destination);

      this.master = this.ctx.createGain();
      this.master.gain.value = 0;
      this.master.connect(this.compressor);

      this.alertGain = this.ctx.createGain();
      this.alertGain.gain.value = 0.46;
      this.alertGain.connect(this.compressor);

      this.buildLayers();
      this.built = true;
      this.applyAllVolumes();
      this.applyMute();
      return this.ctx;
    }

    noiseBuffer(channelCount = 2, seconds = 5, brown = false) {
      const length = Math.floor(this.ctx.sampleRate * seconds);
      const buffer = this.ctx.createBuffer(channelCount, length, this.ctx.sampleRate);
      for (let channel = 0; channel < channelCount; channel += 1) {
        const data = buffer.getChannelData(channel);
        let last = 0;
        for (let i = 0; i < length; i += 1) {
          const white = Math.random() * 2 - 1;
          if (brown) {
            last = (last + 0.018 * white) / 1.018;
            data[i] = clamp(last * 3.4, -1, 1);
          } else {
            data[i] = white * 0.55;
          }
        }
      }
      return buffer;
    }

    createLoopingNoise(brown, seconds = 6) {
      const source = this.ctx.createBufferSource();
      source.buffer = this.noiseBuffer(2, seconds, brown);
      source.loop = true;
      source.start();
      return source;
    }

    buildLayers() {
      const ctx = this.ctx;

      // Ocean surf: brown noise, low-passed and breathing through two slow LFOs.
      this.layers.ocean = ctx.createGain();
      this.layers.ocean.gain.value = 0;
      this.layers.ocean.connect(this.master);

      const oceanNoise = this.createLoopingNoise(true, 8);
      const oceanLow = ctx.createBiquadFilter();
      oceanLow.type = "lowpass";
      oceanLow.frequency.value = 760;
      oceanLow.Q.value = 0.35;
      const oceanHigh = ctx.createBiquadFilter();
      oceanHigh.type = "highpass";
      oceanHigh.frequency.value = 85;
      const oceanBody = ctx.createGain();
      oceanBody.gain.value = 0.62;
      oceanNoise.connect(oceanHigh).connect(oceanLow).connect(oceanBody).connect(this.layers.ocean);

      const swell = ctx.createOscillator();
      swell.type = "sine";
      swell.frequency.value = 0.072;
      const swellAmount = ctx.createGain();
      swellAmount.gain.value = 0.25;
      swell.connect(swellAmount).connect(oceanBody.gain);
      swell.start();

      const undertow = ctx.createOscillator();
      undertow.type = "sine";
      undertow.frequency.value = 0.021;
      const undertowAmount = ctx.createGain();
      undertowAmount.gain.value = 190;
      undertow.connect(undertowAmount).connect(oceanLow.frequency);
      undertow.start();

      // Soft rain: filtered white noise with a very gentle high-shelf.
      this.layers.rain = ctx.createGain();
      this.layers.rain.gain.value = 0;
      this.layers.rain.connect(this.master);

      const rainNoise = this.createLoopingNoise(false, 5);
      const rainHigh = ctx.createBiquadFilter();
      rainHigh.type = "highpass";
      rainHigh.frequency.value = 1250;
      const rainLow = ctx.createBiquadFilter();
      rainLow.type = "lowpass";
      rainLow.frequency.value = 8200;
      const rainBody = ctx.createGain();
      rainBody.gain.value = 0.55;
      rainNoise.connect(rainHigh).connect(rainLow).connect(rainBody).connect(this.layers.rain);

      const rainBreathe = ctx.createOscillator();
      rainBreathe.type = "sine";
      rainBreathe.frequency.value = 0.045;
      const rainBreatheAmount = ctx.createGain();
      rainBreatheAmount.gain.value = 0.12;
      rainBreathe.connect(rainBreatheAmount).connect(rainBody.gain);
      rainBreathe.start();

      // Wind chimes are scheduled, but share a dedicated gain layer.
      this.layers.chimes = ctx.createGain();
      this.layers.chimes.gain.value = 0;
      this.layers.chimes.connect(this.master);
      this.chimeGain = this.layers.chimes;

      // 432 Hz binaural focus tone: 432 L, 438 R — a soft 6 Hz beat.
      this.layers.binaural = ctx.createGain();
      this.layers.binaural.gain.value = 0;
      this.layers.binaural.connect(this.master);

      const makeTone = (frequency, panValue, gainValue, type = "sine") => {
        const oscillator = ctx.createOscillator();
        oscillator.type = type;
        oscillator.frequency.value = frequency;
        const gain = ctx.createGain();
        gain.gain.value = gainValue;
        const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
        if (pan) {
          pan.pan.value = panValue;
          oscillator.connect(gain).connect(pan).connect(this.layers.binaural);
        } else {
          oscillator.connect(gain).connect(this.layers.binaural);
        }
        oscillator.start();
      };

      makeTone(432, -0.92, 0.11);
      makeTone(438, 0.92, 0.11);
      makeTone(216, -0.5, 0.025);
      makeTone(219, 0.5, 0.025);

      // A very low harmonic bed keeps the tone warm on laptop speakers.
      const warm = ctx.createOscillator();
      warm.type = "triangle";
      warm.frequency.value = 108;
      const warmGain = ctx.createGain();
      warmGain.gain.value = 0.018;
      warm.connect(warmGain).connect(this.layers.binaural);
      warm.start();
    }

    applyAllVolumes() {
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const map = { ocean: 0.42, rain: 0.3, chimes: 0.46, binaural: 0.26 };
      Object.entries(map).forEach(([channel, scale]) => {
        if (this.layers[channel]) {
          const value = (this.volumes[channel] / 100) * scale;
          this.layers[channel].gain.setTargetAtTime(value, now, 0.12);
        }
      });
      this.setMasterGain();
    }

    setVolume(channel, value) {
      if (!(channel in this.volumes)) return;
      this.volumes[channel] = Math.round(clamp(value, 0, 100));
      if (channel === "master") {
        this.setMasterGain();
      } else if (this.ctx && this.layers[channel]) {
        const map = { ocean: 0.42, rain: 0.3, chimes: 0.46, binaural: 0.26 };
        this.layers[channel].gain.setTargetAtTime(
          (this.volumes[channel] / 100) * map[channel],
          this.ctx.currentTime,
          0.12
        );
      }
    }

    setMasterGain() {
      if (!this.ctx || !this.master) return;
      const audible = this.enabled && !this.muted;
      const target = audible ? (this.volumes.master / 100) * 0.86 : 0;
      this.master.gain.setTargetAtTime(target, this.ctx.currentTime, 0.15);
    }

    applyMute() {
      this.muted = Boolean(this.muted);
      this.setMasterGain();
    }

    async enable() {
      await this.prepare();
      await this.resumeContext();
      this.enabled = true;
      this.setMasterGain();
      this.scheduleChime();
      return true;
    }

    disable() {
      this.enabled = false;
      this.setMasterGain();
      this.clearChimeTimer();
    }

    clearChimeTimer() {
      if (this.chimeTimer) {
        window.clearTimeout(this.chimeTimer);
        this.chimeTimer = null;
      }
    }

    scheduleChime() {
      this.clearChimeTimer();
      if (!this.ctx || !this.enabled) return;
      const delay = 4200 + Math.random() * 9000;
      this.chimeTimer = window.setTimeout(() => {
        if (this.enabled && !this.muted) this.playWindChime();
        this.scheduleChime();
      }, delay);
    }

    playWindChime() {
      if (!this.ctx || !this.chimeGain) return;
      const ctx = this.ctx;
      const now = ctx.currentTime + 0.02;
      const scale = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66];
      const count = 1 + Math.floor(Math.random() * 3);

      for (let i = 0; i < count; i += 1) {
        const frequency = scale[Math.floor(Math.random() * scale.length)];
        const start = now + i * (0.22 + Math.random() * 0.35);
        const duration = 3.4 + Math.random() * 2.2;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.17 + Math.random() * 0.08, start + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
        const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
        if (pan) pan.pan.value = Math.random() * 1.5 - 0.75;
        const oscillator = ctx.createOscillator();
        oscillator.type = "sine";
        oscillator.frequency.value = frequency;
        const overtone = ctx.createOscillator();
        overtone.type = "sine";
        overtone.frequency.value = frequency * 2.004;
        const overtoneGain = ctx.createGain();
        overtoneGain.gain.value = 0.18;
        oscillator.connect(gain);
        overtone.connect(overtoneGain).connect(gain);
        if (pan) gain.connect(pan).connect(this.chimeGain);
        else gain.connect(this.chimeGain);
        oscillator.start(start);
        overtone.start(start);
        oscillator.stop(start + duration + 0.1);
        overtone.stop(start + duration + 0.1);
      }
    }

    playCompletionChime(kind = "focus") {
      if (!this.ctx || this.muted) return;
      const ctx = this.ctx;
      if (ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }
      const now = ctx.currentTime + 0.03;
      const notes = kind === "break"
        ? [392, 523.25, 659.25]
        : [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((frequency, index) => {
        const start = now + index * 0.22;
        const duration = 3.1 + index * 0.25;
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.value = frequency;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.24, start + 0.018);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
        const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
        if (pan) pan.pan.value = index % 2 ? 0.28 : -0.28;
        osc.connect(gain);
        if (pan) gain.connect(pan).connect(this.alertGain);
        else gain.connect(this.alertGain);
        osc.start(start);
        osc.stop(start + duration + 0.1);
      });
    }
  }

  /* ------------------------------------------------------------------------
     Procedural Three.js scenery engine
     ------------------------------------------------------------------------ */

  class SceneryEngine {
    constructor(options = {}) {
      if (!window.THREE) throw new Error("Three.js did not load.");
      this.THREE = window.THREE;
      this.container = options.container;
      this.onFps = options.onFps || (() => {});
      this.onContextLost = options.onContextLost || (() => {});
      this.sceneMode = options.scene || "ocean";
      this.presetName = options.preset || "sunset";
      this.manual = false;
      this.manualUntil = 0;
      this.orbitTime = 2.1;
      this.elapsed = 0;
      this.lastFrame = performance.now();
      this.fpsAccumulator = 0;
      this.fpsFrames = 0;
      this.lastFpsAt = performance.now();
      this.lookTarget = new this.THREE.Vector3(0, 4, 0);
      this.blendFrom = null;
      this.blendAt = 0;
      this.isBlending = false;
      this.presetTransition = null;
      this.islands = [];
      this.birds = [];
      this.cloudMats = [];
      this.waterUniforms = null;

      this.initRenderer();
      this.initScene();
      this.buildSky();
      this.buildOcean();
      this.buildSkyWorld();
      this.buildStars();
      this.buildLights();
      this.setPreset(this.presetName, true);
      this.setScene(this.sceneMode, true);
      this.bindInteraction();
      this.bindResize();
      this.animate = this.animate.bind(this);
      this.raf = requestAnimationFrame(this.animate);
    }

    initRenderer() {
      const THREE = this.THREE;
      this.renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: "high-performance"
      });
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.outputEncoding = THREE.sRGBEncoding;
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1;
      this.renderer.setClearColor(0x07131c, 1);
      this.renderer.domElement.setAttribute("aria-hidden", "true");
      this.container.appendChild(this.renderer.domElement);
      this.renderer.domElement.addEventListener("webglcontextlost", (event) => {
        event.preventDefault();
        this.onContextLost();
      });
    }

    initScene() {
      const THREE = this.THREE;
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x07131c);
      this.scene.fog = new THREE.FogExp2(0x8b5b52, 0.0016);
      this.particleTexture = this.makeParticleTexture();
      this.camera = new THREE.PerspectiveCamera(
        55,
        window.innerWidth / window.innerHeight,
        0.1,
        1500
      );
      this.camera.position.set(68, 22, 68);

      if (THREE.OrbitControls) {
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.045;
        this.controls.enablePan = false;
        this.controls.rotateSpeed = 0.42;
        this.controls.zoomSpeed = 0.6;
        this.controls.minDistance = 10;
        this.controls.maxDistance = 260;
        this.controls.minPolarAngle = 0.22;
        this.controls.maxPolarAngle = Math.PI * 0.54;
        this.controls.target.copy(this.lookTarget);
        this.controls.enabled = false;
      }
    }

    buildSky() {
      const THREE = this.THREE;
      const uniforms = {
        uTop: { value: new THREE.Color("#112a46") },
        uHorizon: { value: new THREE.Color("#e39b69") },
        uBottom: { value: new THREE.Color("#1d4952") },
        uSunColor: { value: new THREE.Color("#ffd09a") },
        uSunDir: { value: new THREE.Vector3(0.4, 0.2, -0.9).normalize() },
        uSunGlow: { value: 1.1 }
      };

      const material = new THREE.ShaderMaterial({
        uniforms,
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        vertexShader: `
          varying vec3 vWorldDir;
          void main() {
            vec4 worldPosition = modelMatrix * vec4(position, 1.0);
            vWorldDir = normalize(worldPosition.xyz - cameraPosition);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 uTop;
          uniform vec3 uHorizon;
          uniform vec3 uBottom;
          uniform vec3 uSunColor;
          uniform vec3 uSunDir;
          uniform float uSunGlow;
          varying vec3 vWorldDir;
          void main() {
            vec3 dir = normalize(vWorldDir);
            float upper = smoothstep(0.0, 0.62, max(dir.y, 0.0));
            vec3 color = mix(uHorizon, uTop, pow(upper, 0.72));
            color = mix(uBottom, color, smoothstep(-0.26, 0.025, dir.y));
            float sunDot = max(dot(dir, normalize(uSunDir)), 0.0);
            float disk = pow(sunDot, 1800.0);
            float halo = pow(sunDot, 180.0);
            float wideHalo = pow(sunDot, 6.0);
            color += uSunColor * disk * 1.55 * uSunGlow;
            color += uSunColor * halo * 0.16 * uSunGlow;
            color += uSunColor * wideHalo * 0.012 * uSunGlow;
            float horizonHaze = exp(-abs(dir.y) * 18.0);
            color += uHorizon * horizonHaze * 0.055;
            gl_FragColor = vec4(color, 1.0);
          }
        `
      });

      this.skyUniforms = uniforms;
      this.skyDome = new THREE.Mesh(new THREE.SphereGeometry(620, 32, 24), material);
      this.skyDome.frustumCulled = false;
      this.scene.add(this.skyDome);

      this.sunGlow = this.makeGlowSprite("#ffd09a", 0.14, 0.34);
      this.sunGlow.scale.set(20, 20, 1);
      this.sunCore = this.makeGlowSprite("#fff3d9", 0.9, 1);
      this.sunCore.scale.set(3.2, 3.2, 1);
      this.sunGlow.material.depthWrite = false;
      this.sunCore.material.depthWrite = false;
      this.sunGlow.renderOrder = 1;
      this.sunCore.renderOrder = 2;
      this.scene.add(this.sunGlow, this.sunCore);
    }

    makeGlowSprite(color, opacity, core) {
      const THREE = this.THREE;
      const canvas = document.createElement("canvas");
      canvas.width = 128;
      canvas.height = 128;
      const context = canvas.getContext("2d");
      const gradient = context.createRadialGradient(64, 64, core > 0.6 ? 2 : 0, 64, 64, 64);
      gradient.addColorStop(0, "rgba(255,255,255,1)");
      gradient.addColorStop(core > 0.6 ? 0.22 : 0.08, "rgba(255,255,255,.9)");
      gradient.addColorStop(core > 0.6 ? 0.32 : 0.3, "rgba(255,255,255,.3)");
      gradient.addColorStop(1, "rgba(255,255,255,0)");
      context.fillStyle = gradient;
      context.fillRect(0, 0, 128, 128);
      const texture = new THREE.CanvasTexture(canvas);
      texture.minFilter = THREE.LinearFilter;
      const material = new THREE.SpriteMaterial({
        map: texture,
        color: new THREE.Color(color),
        transparent: true,
        opacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false
      });
      return new THREE.Sprite(material);
    }

    makeCloudTexture() {
      const THREE = this.THREE;
      const canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 160;
      const context = canvas.getContext("2d");
      context.clearRect(0, 0, 256, 160);
      const puffs = [
        [76, 91, 62, 0.85],
        [118, 69, 76, 0.8],
        [167, 82, 64, 0.8],
        [205, 102, 46, 0.58],
        [40, 108, 38, 0.5],
        [127, 115, 68, 0.58],
        [177, 118, 44, 0.42]
      ];
      puffs.forEach(([x, y, radius, alpha]) => {
        const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, `rgba(255,255,255,${alpha})`);
        gradient.addColorStop(0.45, `rgba(255,255,255,${alpha * 0.55})`);
        gradient.addColorStop(1, "rgba(255,255,255,0)");
        context.fillStyle = gradient;
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();
      });
      const texture = new THREE.CanvasTexture(canvas);
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      return texture;
    }

    makeParticleTexture() {
      const THREE = this.THREE;
      const canvas = document.createElement("canvas");
      canvas.width = 64;
      canvas.height = 64;
      const context = canvas.getContext("2d");
      const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
      gradient.addColorStop(0, "rgba(255,255,255,1)");
      gradient.addColorStop(0.28, "rgba(255,255,255,.95)");
      gradient.addColorStop(0.62, "rgba(255,255,255,.28)");
      gradient.addColorStop(1, "rgba(255,255,255,0)");
      context.fillStyle = gradient;
      context.fillRect(0, 0, 64, 64);
      const texture = new THREE.CanvasTexture(canvas);
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      return texture;
    }

    makeCloudMaterials() {
      const THREE = this.THREE;
      const texture = this.makeCloudTexture();
      this.cloudTexture = texture;
      const make = (opacity) => new THREE.SpriteMaterial({
        map: texture,
        color: new THREE.Color("#f2b890"),
        transparent: true,
        opacity,
        depthWrite: false,
        depthTest: true,
        fog: true
      });
      this.cloudMats = [make(0.32), make(0.5), make(0.74)];
    }

    makeCloudCluster(scale, puffCount, spread, materialIndex) {
      const THREE = this.THREE;
      const group = new THREE.Group();
      const material = this.cloudMats[materialIndex % this.cloudMats.length];
      for (let i = 0; i < puffCount; i += 1) {
        const sprite = new THREE.Sprite(material);
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * spread;
        sprite.position.set(
          Math.cos(angle) * radius,
          (Math.random() - 0.5) * spread * 0.26,
          Math.sin(angle) * radius * 0.42
        );
        const puff = scale * (0.42 + Math.random() * 0.65);
        sprite.scale.set(puff, puff * 0.58, 1);
        sprite.material.rotation = Math.random() * Math.PI * 2;
        group.add(sprite);
      }
      return group;
    }

    buildOcean() {
      const THREE = this.THREE;
      this.oceanGroup = new THREE.Group();
      this.scene.add(this.oceanGroup);
      this.makeCloudMaterials();

      const uniforms = {
        uTime: { value: 0 },
        uDeep: { value: new THREE.Color("#052b35") },
        uShallow: { value: new THREE.Color("#1e6b6c") },
        uSky: { value: new THREE.Color("#d48967") },
        uSun: { value: new THREE.Color("#ffd4a0") },
        uFoam: { value: new THREE.Color("#ffe6c7") },
        uGlow: { value: new THREE.Color("#1c7b78") },
        uGlowIntensity: { value: 0.24 },
        uLightDir: { value: new THREE.Vector3(0.4, 0.2, -0.9).normalize() },
        uWaveHeight: { value: 1.05 }
      };
      this.waterUniforms = uniforms;

      const material = new THREE.ShaderMaterial({
        uniforms,
        side: THREE.FrontSide,
        fog: false,
        vertexShader: `
          uniform float uTime;
          uniform float uWaveHeight;
          varying float vElevation;
          varying vec3 vWorldPos;
          varying vec3 vNormalW;

          float waveField(vec2 p, float t) {
            float e = 0.0;
            e += sin(p.x * 0.105 + t * 1.02) * 0.25;
            e += sin(p.y * 0.132 - t * 0.86) * 0.18;
            e += sin((p.x + p.y) * 0.061 + t * 0.66) * 0.15;
            e += sin((p.x * 0.68 - p.y * 0.53) * 0.174 + t * 1.34) * 0.07;
            e += sin(length(p) * 0.035 - t * 0.31) * 0.09;
            return e;
          }

          void main() {
            vec3 pos = position;
            float e = waveField(pos.xy, uTime);
            pos.z += e * uWaveHeight;
            float offset = 1.7;
            float ex = waveField(pos.xy + vec2(offset, 0.0), uTime) * uWaveHeight;
            float ey = waveField(pos.xy + vec2(0.0, offset), uTime) * uWaveHeight;
            vec3 normalLocal = normalize(vec3(-(ex - e * uWaveHeight) / offset, -(ey - e * uWaveHeight) / offset, 1.0));
            vec4 worldPos = modelMatrix * vec4(pos, 1.0);
            vWorldPos = worldPos.xyz;
            vNormalW = normalize(mat3(modelMatrix) * normalLocal);
            vElevation = e;
            gl_Position = projectionMatrix * viewMatrix * worldPos;
          }
        `,
        fragmentShader: `
          uniform vec3 uDeep;
          uniform vec3 uShallow;
          uniform vec3 uSky;
          uniform vec3 uSun;
          uniform vec3 uFoam;
          uniform vec3 uGlow;
          uniform vec3 uLightDir;
          uniform float uGlowIntensity;
          uniform float uTime;
          varying float vElevation;
          varying vec3 vWorldPos;
          varying vec3 vNormalW;

          void main() {
            vec3 normal = normalize(vNormalW);
            vec3 viewDir = normalize(cameraPosition - vWorldPos);
            float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 3.1);
            float heightMix = smoothstep(-1.1, 0.85, vElevation);
            vec3 base = mix(uDeep, uShallow, heightMix);

            vec3 reflected = reflect(-viewDir, normal);
            float skyReflection = pow(max(dot(reflected, vec3(0.0, 1.0, 0.0)), 0.0), 1.1);
            vec3 reflectedSky = mix(uSky * 0.65, uSky, skyReflection);
            vec3 color = mix(base, reflectedSky, clamp(fresnel * 0.84, 0.0, 0.82));

            float specular = pow(max(dot(reflected, normalize(uLightDir)), 0.0), 210.0);
            float broadGlint = pow(max(dot(reflected, normalize(uLightDir)), 0.0), 14.0);
            color += uSun * specular * 0.5;
            color += uSun * broadGlint * 0.03;

            float crest = smoothstep(0.65, 1.45, vElevation);
            float foamNoise = sin(vWorldPos.x * 0.13 + uTime * 0.2) * sin(vWorldPos.z * 0.17 - uTime * 0.17);
            color = mix(color, uFoam, crest * (0.07 + 0.04 * foamNoise));

            float distanceToCamera = distance(cameraPosition, vWorldPos);
            color = mix(color, uSky * 0.82, smoothstep(150.0, 420.0, distanceToCamera));

            vec3 cyan = uGlow * vec3(0.18, 0.82, 0.86);
            float livingLight = sin(vWorldPos.x * 0.11 + uTime * 0.9) * sin(vWorldPos.z * 0.13 - uTime * 0.7);
            livingLight = smoothstep(0.82, 1.0, livingLight);
            color += cyan * livingLight * uGlowIntensity * 0.4;

            gl_FragColor = vec4(color, 1.0);
          }
        `
      });

      const geometry = new THREE.PlaneGeometry(760, 760, 170, 170);
      this.water = new THREE.Mesh(geometry, material);
      this.water.rotation.x = -Math.PI / 2;
      this.water.position.y = 0;
      this.water.frustumCulled = false;
      this.oceanGroup.add(this.water);

      // Living plankton / bioluminescent surface flecks.
      const count = 780;
      const positions = new Float32Array(count * 3);
      for (let i = 0; i < count; i += 1) {
        positions[i * 3] = (Math.random() - 0.5) * 330;
        positions[i * 3 + 1] = 0.25 + Math.random() * 1.2;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 330;
      }
      const glowGeometry = new THREE.BufferGeometry();
      glowGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      this.glowMaterial = new THREE.PointsMaterial({
        color: new THREE.Color("#43e5d4"),
        map: this.particleTexture,
        alphaTest: 0.015,
        size: 0.58,
        transparent: true,
        opacity: 0.2,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
        fog: false
      });
      this.oceanGlow = new THREE.Points(glowGeometry, this.glowMaterial);
      this.oceanGlow.frustumCulled = false;
      this.oceanGroup.add(this.oceanGlow);

      // A small distant sailboat gives the horizon a sense of scale.
      this.boat = this.makeSailboat();
      this.boat.position.set(54, 0.6, -48);
      this.boat.rotation.y = -0.6;
      this.oceanGroup.add(this.boat);

      // Low horizon cloud banks.
      this.oceanClouds = new THREE.Group();
      const cloudPositions = [
        [-220, 32, -230, 1.2], [-120, 48, -290, 0.9], [22, 30, -310, 1.4],
        [150, 39, -260, 1], [265, 27, -190, 0.8], [-295, 23, -100, 0.75],
        [-180, 58, 220, 0.7], [240, 47, 230, 0.8]
      ];
      cloudPositions.forEach(([x, y, z, scale], index) => {
        const cluster = this.makeCloudCluster(scale * 34, 7, 24, index % 3);
        cluster.position.set(x, y, z);
        this.oceanClouds.add(cluster);
      });
      this.oceanGroup.add(this.oceanClouds);
    }

    makeSailboat() {
      const THREE = this.THREE;
      const group = new THREE.Group();
      const hullMaterial = new THREE.MeshLambertMaterial({ color: 0x172b33, flatShading: true });
      const sailMaterial = new THREE.MeshBasicMaterial({ color: 0xf4e4c5, side: THREE.DoubleSide, fog: true });
      const hull = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.52, 0.35, 5), hullMaterial);
      hull.scale.set(1, 1, 2.7);
      group.add(hull);
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 3.1, 5), hullMaterial);
      mast.position.y = 1.55;
      group.add(mast);
      const sailGeometry = new THREE.BufferGeometry();
      sailGeometry.setAttribute("position", new THREE.Float32BufferAttribute([
        0, 2.95, 0,
        0, 0.55, 0,
        0, 1.05, -1.65
      ], 3));
      sailGeometry.computeVertexNormals();
      const sail = new THREE.Mesh(sailGeometry, sailMaterial);
      group.add(sail);
      group.scale.setScalar(1.6);
      return group;
    }

    buildSkyWorld() {
      const THREE = this.THREE;
      this.skyGroup = new THREE.Group();
      this.skyGroup.visible = false;
      this.scene.add(this.skyGroup);

      // High-altitude cloudscape.
      for (let i = 0; i < 15; i += 1) {
        const angle = (i / 15) * Math.PI * 2 + Math.random() * 0.5;
        const radius = 65 + Math.random() * 150;
        const cluster = this.makeCloudCluster(28 + Math.random() * 30, 10, 20, i % 3);
        cluster.position.set(
          Math.cos(angle) * radius,
          20 + Math.random() * 48,
          Math.sin(angle) * radius
        );
        cluster.rotation.y = Math.random() * Math.PI;
        cluster.userData.drift = 0.15 + Math.random() * 0.35;
        cluster.userData.phase = Math.random() * Math.PI * 2;
        this.skyGroup.add(cluster);
      }

      // A dense sea of cloud below the islands.
      this.cloudSea = new THREE.Group();
      for (let i = 0; i < 30; i += 1) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 18 + Math.random() * 185;
        const cluster = this.makeCloudCluster(22 + Math.random() * 42, 6, 22, i % 3);
        cluster.position.set(
          Math.cos(angle) * radius,
          -24 + Math.random() * 18,
          Math.sin(angle) * radius
        );
        cluster.userData.phase = Math.random() * Math.PI * 2;
        cluster.userData.originY = cluster.position.y;
        this.cloudSea.add(cluster);
      }
      this.skyGroup.add(this.cloudSea);

      this.islandsGroup = new THREE.Group();
      this.skyGroup.add(this.islandsGroup);
      const islandDefs = [
        { angle: 0, radius: 30, y: 9, size: 6.3, trees: 7, crystal: true, rotate: 0.2 },
        { angle: Math.PI * 0.52, radius: 46, y: 25, size: 8.2, trees: 10, crystal: false, rotate: -0.4 },
        { angle: Math.PI * 0.98, radius: 36, y: 3, size: 5.4, trees: 5, crystal: true, rotate: 0.8 },
        { angle: Math.PI * 1.43, radius: 54, y: 18, size: 7.1, trees: 8, crystal: false, rotate: -0.2 },
        { angle: Math.PI * 1.76, radius: 23, y: 31, size: 4.4, trees: 4, crystal: true, rotate: 1.2 }
      ];

      islandDefs.forEach((definition, index) => {
        const island = this.makeIsland(definition, index);
        island.position.set(
          Math.cos(definition.angle) * definition.radius,
          definition.y,
          Math.sin(definition.angle) * definition.radius
        );
        island.rotation.y = definition.rotate;
        this.islands.push(island);
        this.islandsGroup.add(island);
      });

      const birdMaterial = new THREE.LineBasicMaterial({
        color: 0x2b3b3f,
        transparent: true,
        opacity: 0.65,
        fog: true
      });
      for (let i = 0; i < 10; i += 1) {
        const bird = new THREE.Group();
        const points = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(-0.7, 0, 0),
          new THREE.Vector3(0, 0.05, 0),
          new THREE.Vector3(0.7, 0, 0)
        ]);
        const wing = new THREE.Line(points, birdMaterial);
        bird.add(wing);
        bird.userData = {
          phase: Math.random() * Math.PI * 2,
          radius: 25 + Math.random() * 35,
          height: 15 + Math.random() * 25,
          speed: 0.03 + Math.random() * 0.035
        };
        bird.scale.setScalar(0.8 + Math.random() * 1.2);
        this.birds.push(bird);
        this.skyGroup.add(bird);
      }
    }

    makeIsland(definition, index) {
      const THREE = this.THREE;
      const group = new THREE.Group();
      const size = definition.size;

      const rockMaterial = new THREE.MeshLambertMaterial({
        color: index % 2 ? 0x35444a : 0x3d3d42,
        flatShading: true
      });
      const grassMaterial = new THREE.MeshLambertMaterial({
        color: index % 2 ? 0x3e6d58 : 0x4f7257,
        flatShading: true
      });
      const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x4b382f, flatShading: true });
      const leafMaterials = [
        new THREE.MeshLambertMaterial({ color: 0x315e4e, flatShading: true }),
        new THREE.MeshLambertMaterial({ color: 0x43725b, flatShading: true }),
        new THREE.MeshLambertMaterial({ color: 0x294f49, flatShading: true })
      ];

      const rock = new THREE.Mesh(new THREE.ConeGeometry(size * 0.88, size * 2.8, 9, 3), rockMaterial);
      rock.position.y = -size * 1.25;
      rock.rotation.y = Math.random() * Math.PI;
      group.add(rock);

      const top = new THREE.Mesh(new THREE.CylinderGeometry(size, size * 0.94, size * 0.22, 9), grassMaterial);
      top.position.y = 0.08;
      group.add(top);

      for (let rockIndex = 0; rockIndex < 3; rockIndex += 1) {
        const shardSize = 0.4 + Math.random() * 0.9;
        const shard = new THREE.Mesh(new THREE.IcosahedronGeometry(shardSize, 0), rockMaterial);
        shard.position.set(
          (Math.random() - 0.5) * size * 1.2,
          -size * 0.6 - Math.random() * size,
          (Math.random() - 0.5) * size * 1.2
        );
        shard.rotation.set(Math.random(), Math.random(), Math.random());
        group.add(shard);
      }

      for (let treeIndex = 0; treeIndex < definition.trees; treeIndex += 1) {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * size * 0.72;
        const treeHeight = 0.9 + Math.random() * 1.7;
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.09, treeHeight, 5), trunkMaterial);
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        trunk.position.set(x, treeHeight / 2 + 0.18, z);
        group.add(trunk);

        const foliageMaterial = leafMaterials[Math.floor(Math.random() * leafMaterials.length)];
        const foliage = new THREE.Mesh(new THREE.ConeGeometry(treeHeight * 0.42, treeHeight * 1.2, 7), foliageMaterial);
        foliage.position.set(x, treeHeight + 0.5, z);
        foliage.rotation.y = Math.random() * Math.PI;
        group.add(foliage);
        if (treeHeight > 1.6) {
          const crown = new THREE.Mesh(new THREE.ConeGeometry(treeHeight * 0.29, treeHeight * 0.75, 7), foliageMaterial);
          crown.position.set(x, treeHeight + 1.2, z);
          group.add(crown);
        }
      }

      if (definition.crystal) {
        const crystalMaterial = new THREE.MeshStandardMaterial({
          color: 0x75d7c5,
          emissive: 0x2d9f93,
          emissiveIntensity: 0.9,
          roughness: 0.3,
          metalness: 0.1
        });
        const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.48, 0), crystalMaterial);
        crystal.position.set(size * 0.32, 1.4, -size * 0.15);
        crystal.userData.spin = 0.25 + Math.random() * 0.2;
        group.add(crystal);
        group.userData.crystal = crystal;
      }

      if (index === 1) {
        const ruinMaterial = new THREE.MeshLambertMaterial({ color: 0x6b6257, flatShading: true });
        for (let pillar = 0; pillar < 4; pillar += 1) {
          const angle = (pillar / 4) * Math.PI * 2;
          const column = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 1.4, 6), ruinMaterial);
          column.position.set(Math.cos(angle) * 1.1, 0.9, Math.sin(angle) * 1.1);
          group.add(column);
        }
        const ring = new THREE.Mesh(new THREE.TorusGeometry(1.12, 0.07, 5, 20), ruinMaterial);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = 1.62;
        group.add(ring);
      }

      group.userData.baseY = definition.y;
      group.userData.phase = index * 1.31;
      group.userData.bobSpeed = 0.22 + index * 0.035;
      return group;
    }

    buildStars() {
      const THREE = this.THREE;
      const count = 1800;
      const positions = new Float32Array(count * 3);
      const colors = new Float32Array(count * 3);
      const color = new THREE.Color();
      for (let i = 0; i < count; i += 1) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(1 - Math.random() * 0.95);
        const radius = 410 + Math.random() * 95;
        positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = radius * Math.cos(phi) * 0.9 + 30;
        positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
        color.setHSL(0.52 + Math.random() * 0.12, 0.25, 0.7 + Math.random() * 0.28);
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      this.starMaterial = new THREE.PointsMaterial({
        size: 1.5,
        map: this.particleTexture,
        alphaTest: 0.01,
        vertexColors: true,
        transparent: true,
        opacity: 0.04,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        fog: false,
        sizeAttenuation: true
      });
      this.stars = new THREE.Points(geometry, this.starMaterial);
      this.stars.frustumCulled = false;
      this.scene.add(this.stars);
    }

    buildLights() {
      const THREE = this.THREE;
      this.hemi = new THREE.HemisphereLight(0xffc18a, 0x0c333c, 0.82);
      this.scene.add(this.hemi);

      this.sunLight = new THREE.DirectionalLight(0xffd09a, 1.28);
      this.sunLight.position.set(125, 42, -190);
      this.sunLight.target.position.set(0, 0, 0);
      this.scene.add(this.sunLight, this.sunLight.target);

      this.fill = new THREE.PointLight(0x7bd8ce, 0, 90, 2);
      this.fill.position.set(-18, 12, 24);
      this.scene.add(this.fill);
    }

    setScene(mode, instant = false) {
      if (!(mode in SCENES)) return;
      const changed = this.sceneMode !== mode;
      this.sceneMode = mode;
      if (this.oceanGroup) this.oceanGroup.visible = mode === "ocean";
      if (this.skyGroup) this.skyGroup.visible = mode === "sky";
      this.manual = false;
      this.manualUntil = 0;
      if (this.controls) this.controls.enabled = false;
      if (!instant) this.orbitTime = 2.1;
      this.updateCamera(0, true);
      if (changed && !instant) {
        this.flashScene();
        this.isBlending = true;
        this.blendFrom = this.camera.position.clone();
        this.blendAt = performance.now();
      }
    }

    flashScene() {
      let flash = document.querySelector(".scene-flash");
      if (!flash) {
        flash = document.createElement("div");
        flash.className = "scene-flash";
        document.body.appendChild(flash);
      }
      flash.classList.remove("is-active");
      void flash.offsetWidth;
      flash.classList.add("is-active");
    }

    setPreset(name, instant = false) {
      if (!PRESETS[name]) return;
      this.presetName = name;
      const target = this.buildPresetState(PRESETS[name].state);
      if (instant) {
        this.currentState = target;
        this.applyState(target);
        this.presetTransition = null;
        return;
      }
      const from = this.captureState();
      this.presetTransition = {
        from,
        to: target,
        startedAt: performance.now(),
        duration: 2200
      };
      this.currentState = target;
    }

    buildPresetState(source) {
      const THREE = this.THREE;
      const color = (hex) => {
        const value = new THREE.Color(hex);
        return [value.r, value.g, value.b];
      };
      return {
        exposure: source.exposure,
        fogColor: color(source.fogColor),
        fogDensity: source.fogDensity,
        hemiSky: color(source.hemiSky),
        hemiGround: color(source.hemiGround),
        hemiIntensity: source.hemiIntensity,
        dirColor: color(source.dirColor),
        dirIntensity: source.dirIntensity,
        dirPos: [...source.dirPos],
        skyTop: color(source.skyTop),
        skyHorizon: color(source.skyHorizon),
        skyBottom: color(source.skyBottom),
        sunColor: color(source.sunColor),
        sunGlow: source.sunGlow,
        sunScale: source.sunScale,
        waterDeep: color(source.waterDeep),
        waterShallow: color(source.waterShallow),
        // Kept as arrays so the preset transition can interpolate every channel.
        waterSky: color(source.waterSky),
        waterSun: color(source.waterSun),
        waterFoam: color(source.waterFoam),
        waterGlow: color(source.waterGlow),
        waterGlowIntensity: source.waterGlowIntensity,
        waveHeight: source.waveHeight,
        starsOpacity: source.starsOpacity,
        cloudOpacity: source.cloudOpacity,
        cloudTint: color(source.cloudTint)
      };
    }

    captureState() {
      return {
        exposure: this.renderer.toneMappingExposure,
        fogColor: this.scene.fog.color.toArray(),
        fogDensity: this.scene.fog.density,
        hemiSky: this.hemi.color.toArray(),
        hemiGround: this.hemi.groundColor.toArray(),
        hemiIntensity: this.hemi.intensity,
        dirColor: this.sunLight.color.toArray(),
        dirIntensity: this.sunLight.intensity,
        dirPos: this.sunLight.position.toArray(),
        skyTop: this.skyUniforms.uTop.value.toArray(),
        skyHorizon: this.skyUniforms.uHorizon.value.toArray(),
        skyBottom: this.skyUniforms.uBottom.value.toArray(),
        sunColor: this.skyUniforms.uSunColor.value.toArray(),
        sunGlow: this.skyUniforms.uSunGlow.value,
        sunScale: this.sunCore.scale.x / 34,
        waterDeep: this.waterUniforms.uDeep.value.toArray(),
        waterShallow: this.waterUniforms.uShallow.value.toArray(),
        waterSky: this.waterUniforms.uSky.value.toArray(),
        waterSun: this.waterUniforms.uSun.value.toArray(),
        waterFoam: this.waterUniforms.uFoam.value.toArray(),
        waterGlow: this.waterUniforms.uGlow.value.toArray(),
        waterGlowIntensity: this.waterUniforms.uGlowIntensity.value,
        waveHeight: this.waterUniforms.uWaveHeight.value,
        starsOpacity: this.starMaterial.opacity,
        cloudOpacity: this.cloudMats[1] ? this.cloudMats[1].opacity : 0.4,
        cloudTint: this.cloudMats[1] ? this.cloudMats[1].color.toArray() : [1, 1, 1]
      };
    }

    mixStates(a, b, t) {
      const output = {};
      Object.keys(a).forEach((key) => {
        if (Array.isArray(a[key])) {
          output[key] = a[key].map((value, index) => lerp(value, b[key][index], t));
        } else {
          output[key] = lerp(a[key], b[key], t);
        }
      });
      return output;
    }

    applyState(state) {
      const THREE = this.THREE;
      this.renderer.toneMappingExposure = state.exposure;
      this.scene.fog.color.fromArray(state.fogColor);
      this.scene.fog.density = state.fogDensity;

      this.hemi.color.fromArray(state.hemiSky);
      this.hemi.groundColor.fromArray(state.hemiGround);
      this.hemi.intensity = state.hemiIntensity;

      this.sunLight.color.fromArray(state.dirColor);
      this.sunLight.intensity = state.dirIntensity;
      this.sunLight.position.fromArray(state.dirPos);

      this.skyUniforms.uTop.value.fromArray(state.skyTop);
      this.skyUniforms.uHorizon.value.fromArray(state.skyHorizon);
      this.skyUniforms.uBottom.value.fromArray(state.skyBottom);
      this.skyUniforms.uSunColor.value.fromArray(state.sunColor);
      this.skyUniforms.uSunGlow.value = state.sunGlow;

      const sunDirection = new THREE.Vector3().fromArray(state.dirPos).normalize();
      this.sunDirection = sunDirection.clone();
      this.skyUniforms.uSunDir.value.copy(sunDirection);
      this.sunGlow.position.copy(this.camera.position).addScaledVector(sunDirection, 500);
      this.sunCore.position.copy(this.sunGlow.position);
      this.sunGlow.scale.setScalar(24 * state.sunScale);
      this.sunCore.scale.setScalar(4 * state.sunScale);
      this.sunGlow.material.color.fromArray(state.sunColor);
      this.sunCore.material.color.fromArray(state.sunColor);

      this.waterUniforms.uDeep.value.fromArray(state.waterDeep);
      this.waterUniforms.uShallow.value.fromArray(state.waterShallow);
      this.waterUniforms.uSky.value.fromArray(state.waterSky);
      this.waterUniforms.uSun.value.fromArray(state.waterSun);
      this.waterUniforms.uFoam.value.fromArray(state.waterFoam);
      this.waterUniforms.uGlow.value.fromArray(state.waterGlow);
      this.waterUniforms.uGlowIntensity.value = state.waterGlowIntensity;
      this.waterUniforms.uLightDir.value.copy(sunDirection);
      this.waterUniforms.uWaveHeight.value = state.waveHeight;

      this.starMaterial.opacity = state.starsOpacity;
      this.cloudMats.forEach((material, index) => {
        const base = [0.32, 0.5, 0.74][index] || 0.5;
        material.color.fromArray(state.cloudTint);
        material.opacity = state.cloudOpacity * (base / 0.5);
      });

      this.glowMaterial.opacity = clamp(0.16 + state.waterGlowIntensity * 0.36, 0.14, 0.92);
      this.fill.intensity = state.starsOpacity * 0.9;
      this.fill.color.fromArray(state.waterGlow);
    }

    bindInteraction() {
      const canvas = this.renderer.domElement;
      const activateManual = () => {
        this.manual = true;
        this.manualUntil = performance.now() + 9000;
        if (this.controls) {
          this.controls.enabled = true;
          this.controls.target.copy(this.lookTarget);
        }
      };
      canvas.addEventListener("pointerdown", activateManual, { capture: true, passive: true });
      canvas.addEventListener("wheel", activateManual, { capture: true, passive: true });
      canvas.addEventListener("touchstart", activateManual, { capture: true, passive: true });
    }

    bindResize() {
      this.resize = () => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
        this.renderer.setSize(width, height);
      };
      window.addEventListener("resize", this.resize);
    }

    updateCamera(delta, immediate = false) {
      const now = performance.now();
      if (this.manual) {
        if (now < this.manualUntil) {
          if (this.controls) this.controls.update();
          return;
        }
        this.manual = false;
        if (this.controls) this.controls.enabled = false;
        this.isBlending = true;
        this.blendFrom = this.camera.position.clone();
        this.blendAt = now;
      }

      this.orbitTime += delta * (this.sceneMode === "ocean" ? 0.047 : 0.036);
      const t = this.orbitTime;
      let desired;
      let target;

      if (this.sceneMode === "ocean") {
        const radius = 63 + Math.sin(t * 0.51) * 11;
        desired = new this.THREE.Vector3(
          Math.cos(t) * radius,
          18 + Math.sin(t * 0.68) * 4.2 + Math.sin(t * 1.7) * 0.6,
          Math.sin(t) * radius
        );
        target = new this.THREE.Vector3(
          Math.sin(t * 0.23) * 8,
          4.6 + Math.sin(t * 0.42) * 1.8,
          Math.cos(t * 0.19) * 8
        );
      } else {
        const radius = 76 + Math.sin(t * 0.36) * 13;
        desired = new this.THREE.Vector3(
          Math.cos(t * 0.73) * radius,
          29 + Math.sin(t * 0.52) * 8 + Math.sin(t * 1.13) * 1.5,
          Math.sin(t * 0.73) * radius
        );
        target = new this.THREE.Vector3(
          Math.sin(t * 0.19) * 7,
          8 + Math.sin(t * 0.31) * 4,
          Math.cos(t * 0.17) * 7
        );
      }

      if (immediate || !this.lookTarget) {
        this.camera.position.copy(desired);
        this.lookTarget.copy(target);
        this.camera.lookAt(target);
        return;
      }

      if (this.isBlending) {
        const elapsed = (now - this.blendAt) / 2300;
        if (elapsed >= 1) {
          this.isBlending = false;
        } else {
          const p = smoothstep(clamp(elapsed, 0, 1));
          this.camera.position.lerpVectors(this.blendFrom, desired, p);
        }
      }

      if (!this.isBlending) {
        this.camera.position.copy(desired);
      }
      this.lookTarget.lerp(target, clamp(delta * 1.8, 0.02, 0.16));
      this.camera.lookAt(this.lookTarget);
    }

    animate(now) {
      this.raf = requestAnimationFrame(this.animate);
      const delta = Math.min((now - this.lastFrame) / 1000, 0.08);
      this.lastFrame = now;
      this.elapsed += delta;

      if (this.waterUniforms) {
        this.waterUniforms.uTime.value = this.elapsed;
      }

      if (this.presetTransition) {
        const progress = clamp((now - this.presetTransition.startedAt) / this.presetTransition.duration, 0, 1);
        const mixed = this.mixStates(this.presetTransition.from, this.presetTransition.to, smoothstep(progress));
        this.applyState(mixed);
        if (progress >= 1) this.presetTransition = null;
      }

      if (this.oceanGroup && this.oceanGroup.visible) {
        if (this.boat) {
          this.boat.position.y = 0.6 + Math.sin(this.elapsed * 0.72) * 0.22;
          this.boat.rotation.z = Math.sin(this.elapsed * 0.55) * 0.035;
          this.boat.rotation.y = -0.7 + Math.sin(this.elapsed * 0.04) * 0.16;
        }
        if (this.glowMaterial) {
          const glowBase = this.currentState ? this.currentState.waterGlowIntensity : 0.24;
          this.glowMaterial.opacity = clamp(0.16 + glowBase * 0.36, 0.14, 0.92) * (0.84 + Math.sin(this.elapsed * 1.7) * 0.16);
        }
        if (this.oceanClouds) {
          this.oceanClouds.children.forEach((cluster, index) => {
            cluster.position.x += Math.sin(this.elapsed * 0.01 + index) * 0.0015;
          });
        }
      }

      if (this.skyGroup && this.skyGroup.visible) {
        this.islands.forEach((island) => {
          const data = island.userData;
          island.position.y = data.baseY + Math.sin(this.elapsed * data.bobSpeed + data.phase) * 1.1;
          island.rotation.y += delta * 0.008;
          if (data.crystal) {
            data.crystal.rotation.y += delta * data.crystal.userData.spin;
            data.crystal.position.y = 1.4 + Math.sin(this.elapsed * 0.9 + data.phase) * 0.12;
          }
        });
        this.cloudSea.children.forEach((cluster) => {
          cluster.position.y = cluster.userData.originY + Math.sin(this.elapsed * 0.075 + cluster.userData.phase) * 1.6;
        });
        this.birds.forEach((bird) => {
          const data = bird.userData;
          const angle = this.elapsed * data.speed + data.phase;
          bird.position.set(
            Math.cos(angle) * data.radius,
            data.height + Math.sin(this.elapsed * 0.35 + data.phase) * 2.2,
            Math.sin(angle) * data.radius
          );
          bird.rotation.y = -angle;
          bird.rotation.z = Math.sin(this.elapsed * 2 + data.phase) * 0.14;
        });
      }

      this.updateCamera(delta);
      this.updateSunSprites();
      this.renderer.render(this.scene, this.camera);
      this.updateFps(now);
    }

    updateSunSprites() {
      if (!this.sunDirection || !this.sunGlow || !this.sunCore) return;
      const position = this.sunDirection.clone().multiplyScalar(500).add(this.camera.position);
      this.sunGlow.position.copy(position);
      this.sunCore.position.copy(position);
    }

    updateFps(now) {
      this.fpsFrames += 1;
      if (now - this.lastFpsAt >= 1000) {
        const fps = Math.round((this.fpsFrames * 1000) / (now - this.lastFpsAt));
        this.fpsFrames = 0;
        this.lastFpsAt = now;
        this.lastFps = fps;
        this.onFps(fps);
      }
    }

    getCameraInfo() {
      return {
        mode: this.sceneMode,
        preset: this.presetName,
        autopilot: !this.manual,
        position: this.camera.position.toArray().map((value) => Math.round(value * 10) / 10)
      };
    }
  }

  /* ------------------------------------------------------------------------
     Main application controller
     ------------------------------------------------------------------------ */

  class SanctuaryApp {
    constructor() {
      this.state = loadState();
      this.stats = this.state.stats;
      this.preferences = this.state.preferences;
      this.timer = this.state.timer;

      // Optional deep links: ?scene=sky&preset=moonlit
      const params = new URLSearchParams(window.location.search);
      if (params.get("scene") in SCENES) this.preferences.scene = params.get("scene");
      if (PRESETS[params.get("preset")]) this.preferences.preset = params.get("preset");
      this.engine = null;
      this.audio = new SoundGarden(this.preferences);
      this.lastPersist = 0;
      this.saveIndicatorTimer = null;
      this.captionTimer = null;
      this.zenHintTimer = null;
      this.idleTimer = null;
      this.modalHistory = [];
      this.currentStream = null;
      this.pendingCompletion = null;
      this.loaderHidden = false;
      this.storageFailed = false;
      this.lastClockMinute = "";
      this.audioPrompted = false;
      this.fallBackMode = false;

      this.cacheDom();
      this.bindInterface();
      this.restoreTimerState();
      this.renderPreferences();
      this.renderAll();
      this.updateClock();
      this.initScenery();
      this.startTicker();
      this.initIdleCursor();

      setTimeout(() => {
        this.hideLoader();
        this.maybeWelcome();
      }, 1550);

      if (this.pendingCompletion) {
        const completed = this.pendingCompletion;
        this.pendingCompletion = null;
        setTimeout(() => this.handleTimerCompletion(completed, true), 700);
      }
    }

    cacheDom() {
      this.dom = {
        clock: $("#worldClock"),
        statusScene: $("#statusScene"),
        statusPreset: $("#statusPreset"),
        statusSwatch: $("#statusSwatch"),
        sceneMicro: $("#sceneMicro"),
        lightMicro: $("#lightMicro"),
        metaWind: $("#metaWind"),
        metaSwell: $("#metaSwell"),
        metaLight: $("#metaLight"),
        caption: $("#sceneCaption"),
        captionKicker: $("#captionKicker"),
        captionTitle: $("#captionTitle"),
        captionText: $("#captionText"),
        timerTime: $("#timerTime"),
        timerMode: $("#timerModeLabel"),
        timerState: $("#timerState"),
        timerRing: $("#timerRing"),
        timerWrap: $(".timer-wrap"),
        timerPrimary: $("#primaryTimerBtn"),
        timerPrimaryText: $("#primaryTimerText"),
        timerReset: $("#resetTimerBtn"),
        timerSkip: $("#skipTimerBtn"),
        focusBadge: $("#focusBadge"),
        focusTotal: $("#focusTotal"),
        focusSessions: $("#focusSessions"),
        focusNote: $("#focusNote"),
        logTotal: $("#logTotal"),
        logSessions: $("#logSessions"),
        sessionDots: $("#sessionDots"),
        autoBreak: $("#autoBreakToggle"),
        modeTabs: $$(".mode-tab"),
        sceneButtons: $$(".scene-btn"),
        presetButtons: $$(".preset-btn"),
        audioPower: $("#audioPower"),
        audioPowerText: $("#audioPowerText"),
        audioStatus: $("#audioStatus"),
        muteBtn: $("#muteBtn"),
        volumes: {
          ocean: $("#vol-ocean"),
          rain: $("#vol-rain"),
          chimes: $("#vol-chimes"),
          binaural: $("#vol-binaural"),
          master: $("#vol-master")
        },
        outputs: {
          ocean: $("#out-ocean"),
          rain: $("#out-rain"),
          chimes: $("#out-chimes"),
          binaural: $("#out-binaural"),
          master: $("#out-master")
        },
        loader: $("#loader"),
        loaderStatus: $("#loaderStatus"),
        loaderProgress: $("#loaderProgress"),
        fatal: $("#fatalFallback"),
        exportBtn: $("#exportBtn"),
        importBtn: $("#importBtn"),
        importFile: $("#importFile"),
        saveState: $("#saveState"),
        hideUiBtn: $("#hideUiBtn"),
        zenBtn: $("#zenBtn"),
        zenHint: $("#zenHint"),
        guideBtn: $("#guideBtn"),
        guideOverlay: $("#guideOverlay"),
        musicOverlay: $("#musicOverlay"),
        musicBtn: $("#musicBtn"),
        player: $("#youtubePlayer"),
        playerPlaceholder: $("#playerPlaceholder"),
        nowPlaying: $("#nowPlaying"),
        openYouTube: $("#openYouTube"),
        stopMusic: $("#stopMusicBtn"),
        streamCards: $$(".stream-card"),
        streamGrid: $("#streamGrid"),
        customForm: $("#customStreamForm"),
        customUrl: $("#customStreamUrl"),
        toastRegion: $("#toastRegion"),
        mobileDock: $(".mobile-dock"),
        mobileButtons: $$("[data-mobile-panel]"),
        panelCloseButtons: $$("[data-close-panel]"),
        fallbackContinue: $("#fallbackContinue")
      };
    }

    bindInterface() {
      this.dom.sceneButtons.forEach((button) => {
        button.addEventListener("click", () => this.setScene(button.dataset.scene));
      });

      this.dom.presetButtons.forEach((button) => {
        button.addEventListener("click", () => this.setPreset(button.dataset.preset));
      });

      this.dom.modeTabs.forEach((button) => {
        button.addEventListener("click", () => this.setTimerMode(button.dataset.mode));
      });

      this.dom.timerPrimary.addEventListener("click", () => this.toggleTimer());
      this.dom.timerReset.addEventListener("click", () => this.resetTimer());
      this.dom.timerSkip.addEventListener("click", () => this.skipTimer());
      this.dom.autoBreak.addEventListener("change", () => {
        this.preferences.autoBreak = this.dom.autoBreak.checked;
        this.persist(true);
        this.toast(this.preferences.autoBreak ? "Auto-break is on." : "Auto-break is off.");
      });

      Object.entries(this.dom.volumes).forEach(([channel, input]) => {
        input.addEventListener("input", () => {
          const value = Number(input.value);
          this.preferences.volumes[channel] = value;
          this.audio.setVolume(channel, value);
          this.updateVolumeUI(channel, value);
          this.persist();
        });
      });

      this.dom.muteBtn.addEventListener("click", () => this.toggleMute());
      this.dom.audioPower.addEventListener("click", () => this.toggleAudioPower());
      this.dom.exportBtn.addEventListener("click", () => this.exportLog());
      this.dom.importBtn.addEventListener("click", () => this.dom.importFile.click());
      this.dom.importFile.addEventListener("change", (event) => this.importLog(event));
      this.dom.hideUiBtn.addEventListener("click", () => this.toggleUi());
      this.dom.zenBtn.addEventListener("click", () => this.toggleUi(true));
      this.dom.zenHint.addEventListener("click", () => {
        if (document.body.classList.contains("ui-hidden")) this.toggleUi(false);
      });
      this.dom.zenHint.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && document.body.classList.contains("ui-hidden")) {
          event.preventDefault();
          this.toggleUi(false);
        }
      });
      document.addEventListener("pointerdown", () => {
        this.audio.prepare().catch(() => {});
      }, { once: true });

      this.dom.guideBtn.addEventListener("click", () => this.openModal("guide"));
      this.dom.musicBtn.addEventListener("click", () => this.openModal("music"));
      this.dom.player.addEventListener("load", () => {
        // The iframe can remain blank when a stream is blocked; the surrounding UI stays usable.
      });

      $$("[data-close-modal]").forEach((button) => {
        button.addEventListener("click", () => this.closeModal(button.dataset.closeModal));
      });

      this.dom.streamCards.forEach((card) => {
        card.addEventListener("click", () => {
          this.loadStream(card.dataset.video, card.dataset.streamTitle, card);
        });
      });

      this.dom.stopMusic.addEventListener("click", () => this.stopStream());
      this.dom.customForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const id = extractYouTubeId(this.dom.customUrl.value);
        if (!id) {
          this.toast("That does not look like a YouTube link.");
          return;
        }
        this.loadStream(id, "Custom YouTube stream");
        this.dom.customUrl.value = "";
      });

      this.dom.panelCloseButtons.forEach((button) => {
        button.addEventListener("click", () => this.closeMobilePanels());
      });

      this.dom.mobileButtons.forEach((button) => {
        button.addEventListener("click", () => {
          const target = button.dataset.mobilePanel;
          if (target === "music") {
            this.openModal("music");
            return;
          }
          const openClass = target === "audio" ? "show-sound" : `show-${target}`;
          const isOpen = document.body.classList.contains(openClass);
          this.closeMobilePanels();
          if (!isOpen) {
            document.body.classList.add(openClass);
            this.dom.mobileButtons.forEach((item) => item.classList.toggle("is-active", item === button));
          }
        });
      });

      this.dom.fallbackContinue.addEventListener("click", () => {
        this.dom.fatal.hidden = true;
        this.fallBackMode = true;
        this.toast("Focus timer, sound and study log are ready.");
      });

      document.addEventListener("keydown", (event) => this.onKeyDown(event));
      document.addEventListener("click", (event) => {
        if (!this.audio.enabled && !this.audioPrompted && !event.target.closest("button, a, input, label")) {
          this.audioPrompted = true;
          this.toast("Tap Awaken in the sound garden when you are ready for ambience.");
        }
      }, { passive: true });

      window.addEventListener("beforeunload", () => this.persist(true));
      document.addEventListener("visibilitychange", () => {
        if (!document.hidden) this.tickTimer();
        else this.persist(true);
      });
    }

    initScenery() {
      this.setLoader(18, "Shaping the first horizon…");
      if (!window.THREE) {
        this.showFatal("Three.js could not load from the CDN. Check your connection.");
        return;
      }
      if (!window.THREE.OrbitControls) {
        this.showFatal("OrbitControls could not load from the CDN. Check your connection.");
        return;
      }

      try {
        this.engine = new SceneryEngine({
          container: $("#webgl"),
          scene: this.preferences.scene,
          preset: this.preferences.preset,
          onFps: (fps) => this.updateFps(fps),
          onContextLost: () => {
            this.toast("The 3D context was interrupted. Reload to restore the scenery.");
            this.showFatal("WebGL context was lost.");
          }
        });
        this.setLoader(100, "The horizon is ready.");
      } catch (error) {
        console.error(error);
        this.showFatal(error.message || "WebGL could not start.");
      }
    }

    setLoader(progress, label) {
      if (!this.dom) return;
      if (this.dom.loaderProgress) this.dom.loaderProgress.style.width = `${clamp(progress, 0, 100)}%`;
      if (label && this.dom.loaderStatus) this.dom.loaderStatus.textContent = label;
    }

    hideLoader() {
      if (this.loaderHidden || !this.dom.loader) return;
      this.loaderHidden = true;
      this.dom.loader.classList.add("is-done");
      document.documentElement.dataset.appReady = "true";
      setTimeout(() => {
        if (this.dom.loader) this.dom.loader.hidden = true;
      }, 1200);
    }

    showFatal(message) {
      this.hideLoader();
      if (this.dom.fatal) {
        this.dom.fatal.hidden = false;
        const paragraph = this.dom.fatal.querySelector("p");
        if (paragraph && message) paragraph.textContent = message;
      }
      document.documentElement.dataset.sceneryFallback = "true";
    }

    maybeWelcome() {
      const hasVisited = sessionStorage.getItem("sky-and-sea-welcomed");
      if (hasVisited) return;
      try { sessionStorage.setItem("sky-and-sea-welcomed", "1"); } catch { /* ignore */ }
      setTimeout(() => {
        this.toast("Welcome. The camera is on auto-pilot — press H when you want only the view.");
      }, 900);
    }

    startTicker() {
      this.ticker = window.setInterval(() => {
        this.tickTimer();
        const minute = new Date().toTimeString().slice(0, 5);
        if (minute !== this.lastClockMinute) this.updateClock();
      }, 300);
    }

    restoreTimerState() {
      const now = Date.now();
      if (this.timer.running && this.timer.endAt) {
        const clampedEnd = Math.min(now, this.timer.endAt);
        const last = this.timer.lastTickAt || this.timer.endAt - this.timer.remaining * 1000;
        if (this.timer.mode === "focus" && clampedEnd > last) {
          const elapsed = Math.min((clampedEnd - last) / 1000, this.timer.remaining);
          if (elapsed > 0) {
            this.stats.totalFocusSeconds += elapsed;
            const key = todayKey();
            this.stats.daily[key] = (this.stats.daily[key] || 0) + elapsed;
          }
        }
        this.timer.remaining = Math.max(0, (this.timer.endAt - now) / 1000);
        if (now >= this.timer.endAt) {
          this.timer.remaining = 0;
          this.timer.running = false;
          this.timer.endAt = null;
          this.pendingCompletion = this.timer.mode;
        }
      }
      this.timer.lastTickAt = now;
    }

    tickTimer() {
      if (!this.timer.running) return;
      const now = Date.now();
      const previousRemaining = this.timer.remaining;
      const last = this.timer.lastTickAt || now;
      const elapsed = Math.max(0, (now - last) / 1000);
      const remaining = Math.max(0, (this.timer.endAt - now) / 1000);

      if (this.timer.mode === "focus") {
        const focused = Math.min(elapsed, previousRemaining);
        if (focused > 0) {
          this.stats.totalFocusSeconds += focused;
          const key = todayKey();
          this.stats.daily[key] = (this.stats.daily[key] || 0) + focused;
        }
      }

      this.timer.remaining = remaining;
      this.timer.lastTickAt = now;
      this.renderTimer();

      if (remaining <= 0) {
        this.handleTimerCompletion(this.timer.mode, false);
      } else if (now - this.lastPersist > 5000) {
        this.persist();
      }
    }

    startTimer() {
      if (this.timer.remaining <= 0) {
        this.timer.remaining = TIMER_DURATIONS[this.timer.mode];
      }
      this.timer.running = true;
      this.timer.endAt = Date.now() + this.timer.remaining * 1000;
      this.timer.lastTickAt = Date.now();
      this.audio.prepare().catch(() => {});
      this.renderTimer();
      this.persist(true);
      this.toast(this.timer.mode === "focus" ? "Focus session started. The horizon will keep moving." : "Break started. Let your eyes rest on the horizon.");
    }

    pauseTimer() {
      if (!this.timer.running) return;
      this.tickTimer();
      if (this.timer.running) {
        this.timer.running = false;
        this.timer.endAt = null;
        this.timer.lastTickAt = Date.now();
        this.renderTimer();
        this.persist(true);
        this.toast("Timer paused. Your focus time is saved.");
      }
    }

    toggleTimer() {
      if (this.timer.running) this.pauseTimer();
      else this.startTimer();
    }

    resetTimer() {
      this.timer.running = false;
      this.timer.endAt = null;
      this.timer.remaining = TIMER_DURATIONS[this.timer.mode];
      this.timer.lastTickAt = Date.now();
      this.renderTimer();
      this.persist(true);
      this.toast("Timer reset. A fresh start.");
    }

    skipTimer() {
      const next = this.timer.mode === "focus" ? "break" : "focus";
      this.setTimerMode(next);
      this.toast(next === "break" ? "Skipped ahead to a five-minute break." : "Back to a focused block.");
    }

    setTimerMode(mode, options = {}) {
      if (!(mode in TIMER_DURATIONS)) return;
      this.timer.mode = mode;
      this.timer.remaining = TIMER_DURATIONS[mode];
      this.timer.running = false;
      this.timer.endAt = null;
      this.timer.lastTickAt = Date.now();
      this.renderTimer();
      if (options.start) this.startTimer();
      else {
        this.persist(true);
        this.toast(mode === "focus" ? "Focus mode ready." : "Break mode ready.");
      }
    }

    handleTimerCompletion(mode, restored) {
      if (this.timer.running) {
        this.timer.running = false;
      }
      this.timer.endAt = null;
      this.timer.remaining = 0;
      this.timer.lastTickAt = Date.now();

      if (mode === "focus") {
        this.stats.completedPomodoros += 1;
        this.stats.sessions.unshift({
          completedAt: new Date().toISOString(),
          minutes: Math.round(FOCUS_SECONDS / 60),
          type: "focus"
        });
        this.stats.sessions = this.stats.sessions.slice(0, 500);
        this.audio.playCompletionChime("focus");
        this.toast(restored ? "A finished focus session was recovered from your saved log." : "Focus complete. Twenty-five minutes recorded. Well done.");

        if (this.preferences.autoBreak) {
          setTimeout(() => {
            this.setTimerMode("break", { start: true });
          }, 900);
        } else {
          this.setTimerMode("break");
        }
      } else {
        this.audio.playCompletionChime("break");
        this.toast("Break complete. The next focus block is waiting.");
        this.setTimerMode("focus");
      }

      this.renderAll();
      this.persist(true);
    }

    renderAll() {
      this.renderTimer();
      this.renderStats();
      this.renderPreferences();
      this.renderAudioUI();
      this.updateCaption(true);
      this.updateClock();
    }

    renderTimer() {
      if (!this.dom) return;
      const duration = TIMER_DURATIONS[this.timer.mode];
      const remaining = clamp(this.timer.remaining, 0, duration);
      const progress = remaining / duration;
      const offset = RING_CIRCUMFERENCE * (1 - progress);
      if (this.dom.timerRing) {
        this.dom.timerRing.style.strokeDasharray = String(RING_CIRCUMFERENCE);
        this.dom.timerRing.style.strokeDashoffset = String(offset);
      }
      this.dom.timerTime.textContent = formatClockTime(remaining);
      this.dom.timerMode.textContent = this.timer.mode === "focus" ? "FOCUS SESSION" : "RESTING BREAK";
      this.dom.timerWrap.classList.toggle("is-running", this.timer.running);
      this.dom.timerPrimary.classList.toggle("is-running", this.timer.running);

      if (this.timer.running) {
        this.dom.timerState.innerHTML = "<i></i> " + (this.timer.mode === "focus" ? "in focus · the world can wait" : "resting · breathe with the horizon");
        this.dom.timerState.classList.add("is-running");
      } else if (remaining < duration - 0.5) {
        this.dom.timerState.innerHTML = "<i></i> paused · your place is kept";
        this.dom.timerState.classList.remove("is-running");
      } else {
        this.dom.timerState.innerHTML = "<i></i> ready when you are";
        this.dom.timerState.classList.remove("is-running");
      }

      if (this.timer.running) {
        this.dom.timerPrimaryText.textContent = this.timer.mode === "focus" ? "Pause focus" : "Pause break";
      } else if (remaining < duration - 0.5 && remaining > 0.2) {
        this.dom.timerPrimaryText.textContent = this.timer.mode === "focus" ? "Resume focus" : "Resume break";
      } else {
        this.dom.timerPrimaryText.textContent = this.timer.mode === "focus" ? "Begin focus" : "Begin break";
      }

      this.dom.focusBadge.classList.toggle("is-running", this.timer.running);
      this.dom.focusBadge.innerHTML = this.timer.running ? "<i></i> RUNNING" : (remaining < duration - 0.5 ? "<i></i> PAUSED" : "<i></i> READY");

      this.dom.modeTabs.forEach((tab) => {
        const active = tab.dataset.mode === this.timer.mode;
        tab.classList.toggle("is-active", active);
        tab.setAttribute("aria-selected", String(active));
      });

      const completedInCycle = this.stats.completedPomodoros % 4;
      const dots = this.stats.completedPomodoros > 0 && completedInCycle === 0 ? 4 : completedInCycle;
      Array.from(this.dom.sessionDots.children).forEach((dot, index) => {
        dot.classList.toggle("is-complete", index < dots);
      });

      this.dom.focusNote.textContent = this.timer.running
        ? (this.timer.mode === "focus" ? "One thing at a time. The sea is keeping time for you." : "Look far away. Let your shoulders drop. This is part of the work.")
        : "Settle in. The horizon will keep moving for you.";
    }

    renderStats() {
      if (!this.dom) return;
      const total = formatStudyTime(this.stats.totalFocusSeconds);
      const sessions = String(this.stats.completedPomodoros);
      if (this.dom.focusTotal) this.dom.focusTotal.textContent = total;
      if (this.dom.logTotal) this.dom.logTotal.textContent = total;
      if (this.dom.focusSessions) this.dom.focusSessions.textContent = sessions;
      if (this.dom.logSessions) this.dom.logSessions.textContent = sessions;
    }

    renderPreferences() {
      if (!this.dom) return;
      document.body.dataset.scene = this.preferences.scene;
      document.body.dataset.preset = this.preferences.preset;

      this.dom.sceneButtons.forEach((button) => {
        const active = button.dataset.scene === this.preferences.scene;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-pressed", String(active));
      });
      this.dom.presetButtons.forEach((button) => {
        const active = button.dataset.preset === this.preferences.preset;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-pressed", String(active));
      });

      const scene = SCENES[this.preferences.scene];
      const preset = PRESETS[this.preferences.preset];
      this.dom.statusScene.textContent = scene.label;
      this.dom.statusPreset.textContent = preset.label;
      this.dom.sceneMicro.textContent = scene.micro;
      this.dom.lightMicro.textContent = preset.time;
      this.dom.metaLight.textContent = preset.time;
      this.dom.metaWind.textContent = preset.wind;
      this.dom.metaSwell.textContent = preset.swell;
      this.dom.statusSwatch.style.background = preset.accent;
      this.dom.autoBreak.checked = this.preferences.autoBreak;

      Object.entries(this.dom.volumes).forEach(([channel, input]) => {
        input.value = String(this.preferences.volumes[channel]);
        this.updateVolumeUI(channel, this.preferences.volumes[channel]);
      });

      this.dom.muteBtn.classList.toggle("is-muted", this.preferences.muted);
      this.dom.muteBtn.setAttribute("aria-label", this.preferences.muted ? "Unmute ambient sound" : "Mute ambient sound");
      this.audio.muted = this.preferences.muted;
      this.audio.setVolume("master", this.preferences.volumes.master);
      this.audio.applyMute();
    }

    updateVolumeUI(channel, value) {
      if (this.dom.outputs[channel]) this.dom.outputs[channel].textContent = String(Math.round(value));
      if (this.dom.volumes[channel]) {
        this.dom.volumes[channel].style.setProperty("--fill", `${clamp(value, 0, 100)}%`);
      }
    }

    renderAudioUI() {
      if (!this.dom) return;
      const on = this.audio.enabled;
      this.dom.audioPower.classList.toggle("is-on", on);
      this.dom.audioPower.setAttribute("aria-pressed", String(on));
      this.dom.audioPowerText.textContent = on ? "Pause" : (this.audio.built ? "Resume" : "Awaken");
      if (this.audio.failed) {
        this.dom.audioStatus.textContent = "Audio could not start on this device.";
      } else if (this.preferences.muted) {
        this.dom.audioStatus.textContent = "Muted · unmute to hear the garden.";
      } else if (on) {
        this.dom.audioStatus.textContent = "Four procedural layers are alive.";
      } else if (this.audio.built) {
        this.dom.audioStatus.textContent = "Sound garden resting · press Resume.";
      } else {
        this.dom.audioStatus.textContent = "Tap to let the soundscape bloom.";
      }
      this.dom.muteBtn.classList.toggle("is-muted", this.preferences.muted);
      this.dom.muteBtn.setAttribute("aria-label", this.preferences.muted ? "Unmute ambient sound" : "Mute ambient sound");
    }

    updateCaption(instant = false) {
      const scene = SCENES[this.preferences.scene];
      const preset = PRESETS[this.preferences.preset];
      const caption = (preset.caption && preset.caption[this.preferences.scene]) || scene.caption;
      const apply = () => {
        this.dom.captionKicker.textContent = `${scene.label} · ${preset.label}`;
        this.dom.captionTitle.innerHTML = caption.title;
        this.dom.captionText.textContent = caption.text;
        this.dom.caption.classList.remove("is-changing");
      };
      if (instant) {
        apply();
        return;
      }
      this.dom.caption.classList.add("is-changing");
      window.clearTimeout(this.captionTimer);
      this.captionTimer = window.setTimeout(apply, 520);
    }

    setScene(scene) {
      if (!(scene in SCENES) || scene === this.preferences.scene) {
        if (scene === this.preferences.scene) this.closeMobilePanels();
        return;
      }
      this.preferences.scene = scene;
      if (this.engine) this.engine.setScene(scene);
      this.renderPreferences();
      this.updateCaption();
      this.persist();
      this.closeMobilePanels();
      this.toast(scene === "ocean" ? "Ocean Drift · the camera has begun a slow orbit." : "SkyCraft Soar · rising into the cloud sea.");
    }

    setPreset(preset) {
      if (!PRESETS[preset] || preset === this.preferences.preset) {
        if (preset === this.preferences.preset) this.closeMobilePanels();
        return;
      }
      this.preferences.preset = preset;
      if (this.engine) this.engine.setPreset(preset);
      this.renderPreferences();
      this.updateCaption();
      this.persist();
      this.closeMobilePanels();
      this.toast(`${PRESETS[preset].label} · the light is changing.`);
    }

    toggleMute() {
      this.preferences.muted = !this.preferences.muted;
      this.audio.muted = this.preferences.muted;
      this.audio.applyMute();
      this.renderAudioUI();
      this.persist();
      this.toast(this.preferences.muted ? "Ambience muted." : "Ambience unmuted.");
    }

    async toggleAudioPower() {
      try {
        if (this.audio.enabled) {
          this.audio.disable();
          this.renderAudioUI();
          this.toast("Sound garden asleep. The visuals keep drifting.");
          return;
        }
        await this.audio.enable();
        this.renderAudioUI();
        this.audioPrompted = true;
        this.toast("Sound garden awake. Balance the layers to taste.");
      } catch (error) {
        console.warn("Sky & Sea audio:", error);
        this.audio.failed = true;
        this.renderAudioUI();
        this.toast("Audio could not start. Try a browser with Web Audio support.");
      }
    }

    updateFps(fps) {
      if (!this.dom || !fps) return;
      const sceneLabel = this.preferences.scene === "ocean" ? "waves" : "clouds";
      this.dom.sceneMicro.textContent = fps >= 24
        ? `${sceneLabel} · ${fps} fps`
        : `${sceneLabel} · auto-pilot`;
    }

    updateClock() {
      if (!this.dom || !this.dom.clock) return;
      const now = new Date();
      this.dom.clock.textContent = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
      this.lastClockMinute = now.toTimeString().slice(0, 5);
    }

    /* ---------- Study log ---------- */

    persist(force = false) {
      const now = Date.now();
      if (!force && now - this.lastPersist < 1200) return;
      this.lastPersist = now;
      this.state.stats = this.stats;
      this.state.preferences = this.preferences;
      this.state.timer = this.timer;
      this.state.savedAt = new Date(now).toISOString();
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
        this.storageFailed = false;
        this.flashSaveState();
      } catch (error) {
        if (!this.storageFailed) {
          this.storageFailed = true;
          this.toast("This browser is blocking local storage. Export a study log before closing.");
        }
        console.warn("Sky & Sea: local save failed.", error);
      }
    }

    flashSaveState() {
      if (!this.dom.saveState) return;
      this.dom.saveState.classList.add("is-saving");
      window.clearTimeout(this.saveIndicatorTimer);
      this.saveIndicatorTimer = window.setTimeout(() => {
        this.dom.saveState.classList.remove("is-saving");
      }, 500);
    }

    exportLog() {
      this.persist(true);
      const exported = {
        app: APP_ID,
        appVersion: APP_VERSION,
        exportedAt: new Date().toISOString(),
        stats: {
          totalFocusSeconds: Math.round(this.stats.totalFocusSeconds),
          totalFocusHours: Math.round((this.stats.totalFocusSeconds / 3600) * 100) / 100,
          completedPomodoros: this.stats.completedPomodoros,
          sessions: this.stats.sessions,
          daily: this.stats.daily
        },
        preferences: {
          scene: this.preferences.scene,
          preset: this.preferences.preset,
          volumes: { ...this.preferences.volumes },
          muted: this.preferences.muted,
          autoBreak: this.preferences.autoBreak
        },
        timer: {
          mode: this.timer.mode,
          remaining: Math.round(this.timer.remaining),
          running: this.timer.running
        }
      };
      const blob = new Blob([JSON.stringify(exported, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "focus_sanctuary_log.json";
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1200);
      this.toast("Study log saved as focus_sanctuary_log.json.");
    }

    importLog(event) {
      const file = event.target.files && event.target.files[0];
      if (!file) return;
      if (file.size > 4 * 1024 * 1024) {
        this.toast("That log is too large to import.");
        event.target.value = "";
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(String(reader.result));
          const imported = sanitizeState(parsed);
          this.stats = imported.stats;
          this.preferences = imported.preferences;
          this.audio.volumes = { ...this.preferences.volumes };
          this.audio.muted = this.preferences.muted;
          this.audio.applyAllVolumes();
          this.audio.applyMute();
          this.state.stats = this.stats;
          this.state.preferences = this.preferences;
          if (this.engine) {
            this.engine.setScene(this.preferences.scene);
            this.engine.setPreset(this.preferences.preset);
          }
          this.renderAll();
          this.persist(true);
          this.toast("Study log restored. Your horizon and history are back.");
        } catch (error) {
          console.warn("Sky & Sea import:", error);
          this.toast("That file is not a valid Sky & Sea study log.");
        }
        event.target.value = "";
      };
      reader.onerror = () => {
        this.toast("The study log could not be read.");
        event.target.value = "";
      };
      reader.readAsText(file);
    }

    /* ---------- Modals and overlays ---------- */

    openModal(name) {
      const overlay = name === "music" ? this.dom.musicOverlay : this.dom.guideOverlay;
      if (!overlay) return;
      overlay.hidden = false;
      this.modalHistory.push(name);
      this.closeMobilePanels();
      const focusTarget = overlay.querySelector("button, a, input");
      if (focusTarget) setTimeout(() => focusTarget.focus({ preventScroll: true }), 60);
      if (name === "music") {
        const last = this.state.youtube && this.state.youtube.lastStream;
        if (last && !this.currentStream) {
          const card = this.dom.streamCards.find((item) => item.dataset.video === last);
          if (card) card.classList.add("is-active");
        }
      }
      document.body.classList.add("modal-open");
    }

    closeModal(name) {
      const overlay = name === "music" ? this.dom.musicOverlay : this.dom.guideOverlay;
      if (!overlay) return;
      overlay.hidden = true;
      this.dom.musicOverlay.hidden = this.dom.musicOverlay.hidden;
      if (this.dom.musicOverlay.hidden && this.dom.guideOverlay.hidden) {
        document.body.classList.remove("modal-open");
      }
      this.modalHistory = this.modalHistory.filter((entry) => entry !== name);
      if (name === "music" && this.currentStream) {
        this.toast("Music continues in the background. Stop the player from the stream panel.");
      }
    }

    loadStream(videoId, title, card) {
      if (!videoId || !/^[A-Za-z0-9_-]{11}$/.test(videoId)) {
        this.toast("That video could not be loaded.");
        return;
      }
      this.currentStream = { id: videoId, title: title || "YouTube stream" };
      const params = new URLSearchParams({
        autoplay: "1",
        rel: "0",
        modestbranding: "1",
        playsinline: "1"
      });
      this.dom.player.src = `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
      this.dom.player.hidden = false;
      this.dom.playerPlaceholder.hidden = true;
      this.dom.nowPlaying.textContent = this.currentStream.title;
      this.dom.openYouTube.href = `https://www.youtube.com/watch?v=${videoId}`;
      this.dom.streamCards.forEach((item) => item.classList.toggle("is-active", item === card || (!card && item.dataset.video === videoId)));
      this.state.youtube.lastStream = videoId;
      this.persist(true);
      if (this.dom.musicOverlay.hidden) this.openModal("music");
    }

    stopStream() {
      this.currentStream = null;
      this.dom.player.src = "";
      this.dom.player.hidden = true;
      this.dom.playerPlaceholder.hidden = false;
      this.dom.nowPlaying.textContent = "Nothing selected";
      this.dom.openYouTube.href = "https://www.youtube.com/";
      this.dom.streamCards.forEach((item) => item.classList.remove("is-active"));
      this.state.youtube.lastStream = null;
      this.persist(true);
      this.toast("YouTube player stopped.");
    }

    closeMobilePanels() {
      document.body.classList.remove("show-atmosphere", "show-focus", "show-sound");
      this.dom.mobileButtons.forEach((button) => button.classList.remove("is-active"));
    }

    toggleUi(forceHide = false) {
      const shouldHide = forceHide ? true : !document.body.classList.contains("ui-hidden");
      document.body.classList.toggle("ui-hidden", shouldHide);
      this.dom.hideUiBtn.setAttribute("aria-label", shouldHide ? "Show the interface" : "Hide the interface");
      if (shouldHide) {
        this.closeMobilePanels();
        const coarsePointer = navigator.maxTouchPoints > 0
          || window.matchMedia("(pointer: coarse)").matches
          || window.matchMedia("(hover: none)").matches;
        this.dom.zenHint.innerHTML = coarsePointer
          ? "Tap to restore the interface"
          : 'Press <kbd>H</kbd> to restore the interface';
        this.dom.zenHint.classList.add("is-visible");
        window.clearTimeout(this.zenHintTimer);
        if (!coarsePointer) {
          this.zenHintTimer = window.setTimeout(() => this.dom.zenHint.classList.remove("is-visible"), 4200);
        }
      } else {
        this.dom.zenHint.classList.remove("is-visible");
      }
    }

    initIdleCursor() {
      const reset = () => {
        document.body.classList.remove("is-idle");
        window.clearTimeout(this.idleTimer);
        this.idleTimer = window.setTimeout(() => {
          if (document.body.classList.contains("ui-hidden")) document.body.classList.add("is-idle");
        }, 3200);
      };
      window.addEventListener("pointermove", reset, { passive: true });
      window.addEventListener("pointerdown", reset, { passive: true });
      reset();
    }

    onKeyDown(event) {
      const target = event.target;
      const typing = target instanceof HTMLElement && (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable
      );
      if (typing) return;

      if (event.key === "Escape") {
        if (!this.dom.musicOverlay.hidden) { this.closeModal("music"); return; }
        if (!this.dom.guideOverlay.hidden) { this.closeModal("guide"); return; }
        if (document.body.classList.contains("show-atmosphere") ||
            document.body.classList.contains("show-focus") ||
            document.body.classList.contains("show-sound")) {
          this.closeMobilePanels();
          return;
        }
        if (document.body.classList.contains("ui-hidden")) this.toggleUi();
        return;
      }

      if (event.metaKey || event.ctrlKey || event.altKey) return;

      switch (event.key.toLowerCase()) {
        case "h":
          event.preventDefault();
          this.toggleUi();
          break;
        case "m":
          event.preventDefault();
          this.toggleMute();
          break;
        case " ":
          event.preventDefault();
          this.toggleTimer();
          break;
        case "o":
          event.preventDefault();
          this.setScene(this.preferences.scene === "ocean" ? "sky" : "ocean");
          break;
        case "1":
        case "2":
        case "3":
        case "4": {
          const keys = ["sunset", "moonlit", "dawn", "dusk"];
          event.preventDefault();
          this.setPreset(keys[Number(event.key) - 1]);
          break;
        }
        case "?":
          event.preventDefault();
          this.openModal("guide");
          break;
        default:
          break;
      }
    }

    toast(message) {
      if (!this.dom || !this.dom.toastRegion) return;
      const node = document.createElement("div");
      node.className = "toast";
      node.textContent = message;
      this.dom.toastRegion.appendChild(node);
      window.setTimeout(() => {
        node.classList.add("is-leaving");
        window.setTimeout(() => node.remove(), 350);
      }, 3600);
      while (this.dom.toastRegion.children.length > 3) {
        this.dom.toastRegion.firstElementChild.remove();
      }
    }

    /* ---------- Diagnostics / self-test ---------- */

    runSelfTests(log = false) {
      const results = [];
      const test = (name, condition, detail = "") => {
        results.push({ name, pass: Boolean(condition), detail });
      };

      test("state schema and defaults", this.stats && this.preferences && this.timer);
      test("four atmosphere presets", Object.keys(PRESETS).length === 4);
      test("two scenery modes", Object.keys(SCENES).length === 2);
      test("four procedural audio layers", ["ocean", "rain", "chimes", "binaural"].every((channel) => channel in this.preferences.volumes));
      test("master volume persisted", Number.isFinite(this.preferences.volumes.master));
      test("timer duration logic", TIMER_DURATIONS.focus === 1500 && TIMER_DURATIONS.break === 300);
      test("timer formatter", formatClockTime(1499) === "24:59" && formatClockTime(0) === "00:00");
      test("study formatter", formatStudyTime(3780) === "1h 3m");
      test("YouTube ID parser", extractYouTubeId("https://www.youtube.com/watch?v=CFGLoQIhmow") === "CFGLoQIhmow" && extractYouTubeId("CFGLoQIhmow") === "CFGLoQIhmow");
      test("YouTube ID rejects invalid input", extractYouTubeId("not a url") === null);
      test("export payload is serialisable", (() => {
        try { JSON.stringify({ stats: this.stats, preferences: this.preferences }); return true; } catch { return false; }
      })());
      test("local storage is available", (() => {
        try { localStorage.setItem("sky-and-sea-test", "1"); localStorage.removeItem("sky-and-sea-test"); return true; } catch { return false; }
      })());
      test("core interface nodes exist", Boolean(this.dom.timerTime && this.dom.timerRing && this.dom.player && this.dom.exportBtn));
      test("Three.js renderer active", Boolean(this.engine && this.engine.renderer && !this.engine.renderer.getContext().isContextLost()));
      test("cinematic camera is automatic", Boolean(this.engine && !this.engine.manual));
      test("scenery camera position is finite", Boolean(this.engine && this.engine.camera.position.toArray().every(Number.isFinite)));

      const passed = results.filter((result) => result.pass).length;
      const output = { passed, total: results.length, results };
      document.documentElement.dataset.selftest = `${passed}/${results.length}`;
      document.documentElement.dataset.runtimeErrors = String(window.__skySeaRuntimeErrors || 0);
      let node = document.getElementById("selftest-output");
      if (!node) {
        node = document.createElement("pre");
        node.id = "selftest-output";
        node.hidden = true;
        node.style.display = "none";
        document.body.appendChild(node);
      }
      node.textContent = JSON.stringify(output);
      if (log) console.table(results);
      return output;
    }
  }

  /* ------------------------------------------------------------------------
     Runtime error capture + boot
     ------------------------------------------------------------------------ */

  window.__skySeaRuntimeErrors = 0;
  window.addEventListener("error", (event) => {
    window.__skySeaRuntimeErrors += 1;
    document.documentElement.dataset.runtimeError = event.message || "Unknown runtime error";
    const app = window.__skySeaApp;
    if (app && typeof app.toast === "function") {
      app.toast("A small error occurred. The sanctuary is still running.");
    }
  });

  window.addEventListener("unhandledrejection", () => {
    window.__skySeaRuntimeErrors += 1;
    document.documentElement.dataset.runtimeError = "Unhandled promise rejection";
  });

  function boot() {
    try {
      const app = new SanctuaryApp();
      window.__skySeaApp = app;
      window.SkySea = {
        version: APP_VERSION,
        app,
        state: app.state,
        scene: () => app.engine,
        audio: app.audio,
        setScene: (scene) => app.setScene(scene),
        setPreset: (preset) => app.setPreset(preset),
        toggleTimer: () => app.toggleTimer(),
        exportLog: () => app.exportLog(),
        importLog: () => app.dom.importFile.click(),
        runSelfTests: (log = true) => app.runSelfTests(log),
        getCameraInfo: () => app.engine ? app.engine.getCameraInfo() : null
      };

      if (new URLSearchParams(window.location.search).has("selftest")) {
        setTimeout(() => {
          try {
            const result = app.runSelfTests(true);
            console.info(`Sky & Sea self-test: ${result.passed}/${result.total}`);
          } catch (error) {
            window.__skySeaRuntimeErrors += 1;
            document.documentElement.dataset.runtimeError = String(error);
          }
        }, 1900);
      }
    } catch (error) {
      console.error("Sky & Sea failed to boot:", error);
      window.__skySeaRuntimeErrors += 1;
      document.documentElement.dataset.runtimeError = error.message || String(error);
      const loader = document.getElementById("loader");
      if (loader) loader.hidden = true;
      const fatal = document.getElementById("fatalFallback");
      if (fatal) {
        fatal.hidden = false;
        const paragraph = fatal.querySelector("p");
        if (paragraph) paragraph.textContent = `The sanctuary could not start: ${error.message || error}`;
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
