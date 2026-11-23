/*
 * AI Orbs runtime
 * ----------------
 * Self-contained: this factory is also serialized with Function.prototype.toString()
 * by the exporter, so it MUST NOT reference anything outside its own body.
 *
 * Exposes:
 *   OrbRenderer      – one WebGL2 context, draws any orb definition (fullscreen triangle)
 *   OrbInstance      – per-orb state: config, state machine, time, audio features → uniforms
 *   AudioReactor     – mic / system audio / media element / stream → level, bass, mid, high
 *   simulateVoice    – deterministic fake voice envelope (used when no live audio)
 *   registerOrb / defineElement – <ai-orb> web component
 */
export function orbRuntimeFactory(root) {
  'use strict';

  const STATES = ['intro', 'idle', 'speaking', 'transition', 'thinking', 'auto'];

  const DEFAULT_CONFIG = {
    colorA: '#2fd4ff',
    colorB: '#0a6cff',
    colorC: '#bff4ff',
    speed: 1,
    react: 1,
    glow: 0.6,
    detail: 0.5,
    scale: 1,
    introDuration: 1.8,
  };

  // ---------------------------------------------------------------- GLSL
  const VERT = `#version 300 es
void main(){
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

  const FRAG_HEAD = `#version 300 es
precision highp float;
uniform vec2  uRes;
uniform float uTime;
uniform float uLevel, uBass, uMid, uHigh;
uniform float uIntro, uIdle, uSpeak, uThink, uTrans;
uniform vec3  uColorA, uColorB, uColorC;
uniform float uGlow, uDetail, uScale;
uniform vec4  uBg;
out vec4 fragColor;
float PX; // size of one pixel in orb space (set in main)

#define PI 3.14159265359
mat2 rot(float a){ float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }
float hash11(float n){ return fract(sin(n) * 43758.5453123); }
float hash31(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float noise3(vec3 x){
  vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash31(i + vec3(0,0,0)), hash31(i + vec3(1,0,0)), f.x),
                 mix(hash31(i + vec3(0,1,0)), hash31(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(hash31(i + vec3(0,0,1)), hash31(i + vec3(1,0,1)), f.x),
                 mix(hash31(i + vec3(0,1,1)), hash31(i + vec3(1,1,1)), f.x), f.y), f.z);
}
float fbm3(vec3 p){
  float a = 0.5, s = 0.0;
  for (int i = 0; i < 5; i++){ s += a * noise3(p); p = p * 2.02 + vec3(1.7, 9.2, 3.1); a *= 0.5; }
  return s;
}
float lum(vec3 c){ return max(max(c.r, c.g), c.b); }
// premultiplied helpers
vec4 glow(vec3 c){ return vec4(c, clamp(lum(c), 0.0, 1.0)); }
vec4 addLight(vec4 base, vec3 g){ base.rgb += g; base.a = max(base.a, clamp(lum(g), 0.0, 1.0)); return base; }
// shared state effects
float transRing(float r, float R){ float ph = fract(uTime * 0.45); return uTrans * (1.0 - ph) * exp(-abs(r - (R + ph * 0.55)) * 36.0); }
float thinkArc(vec2 p, float R){ float a = atan(p.y, p.x); return uThink * pow(max(cos(a - uTime * 2.2), 0.0), 8.0) * exp(-abs(length(p) - R) * 55.0); }
float halo(float r, float R){ return exp(-max(r - R, 0.0) * (14.0 - 8.0 * uGlow)); }
float easeOutBack(float x){ float c1 = 1.70158; float c3 = c1 + 1.0; return 1.0 + c3 * pow(x - 1.0, 3.0) + c1 * pow(x - 1.0, 2.0); }
`;

  const FRAG_TAIL = `
void main(){
  vec2 p = (gl_FragCoord.xy * 2.0 - uRes) / min(uRes.x, uRes.y);
  float edgeFade = 1.0 - smoothstep(0.8, 1.0, length(p));
  float ip = clamp(uIntro, 0.0, 1.0);
  float s = max(mix(0.02, 1.0, easeOutBack(ip)) * uScale, 1e-3);
  p /= s;
  PX = 2.0 / (min(uRes.x, uRes.y) * s);
  vec4 c = orb(p);
  c *= smoothstep(0.0, 0.55, ip);
  c = clamp(c * edgeFade, 0.0, 1.0);
  fragColor = c + uBg * (1.0 - c.a);
}`;

  // Optional particle pass: def.points = { count, vert } where vert defines
  //   void particle(int id, out vec3 pos, out float size, out vec4 color)
  // pos in orb units (sphere radius ~0.5, +z towards the viewer), size = diameter in orb units,
  // color premultiplied. Points are drawn additively on top of the fragment pass.
  const UNI_DECL = FRAG_HEAD.split('out vec4 fragColor;')[0].replace('#version 300 es', '');
  const POINTS_VERT_HEAD = `#version 300 es
${UNI_DECL}
out vec4 vColor;
#define PI 3.14159265359
float hash11(float n){ return fract(sin(n) * 43758.5453123); }
mat2 rot(float a){ float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }
float easeOutBack(float x){ float c1 = 1.70158; float c3 = c1 + 1.0; return 1.0 + c3 * pow(x - 1.0, 3.0) + c1 * pow(x - 1.0, 2.0); }
`;
  const POINTS_VERT_TAIL = `
void main(){
  vec3 pos; float size; vec4 col;
  particle(gl_VertexID, pos, size, col);
  float ip = clamp(uIntro, 0.0, 1.0);
  float s = max(mix(0.02, 1.0, easeOutBack(ip)) * uScale, 1e-3);
  float persp = 2.4 / max(2.4 - pos.z, 0.3);
  float m = min(uRes.x, uRes.y);
  vec2 sp = pos.xy * persp * s;
  gl_Position = vec4(sp * m / uRes, 0.0, 1.0);
  float px = size * persp * s * m * 0.5;
  gl_PointSize = clamp(px, 1.0, 64.0);
  vColor = col * smoothstep(0.0, 0.55, ip) * clamp(px / 1.5, 0.12, 1.0) * (1.0 - smoothstep(0.8, 1.0, length(sp)));
}`;
  const POINTS_FRAG = `#version 300 es
precision highp float;
in vec4 vColor;
out vec4 fragColor;
void main(){
  vec2 d = gl_PointCoord * 2.0 - 1.0;
  float r2 = dot(d, d);
  if (r2 > 1.0) discard;
  fragColor = vColor * (1.0 - r2) * (1.0 - r2);
}`;

  const UNIFORMS = ['uRes', 'uTime', 'uLevel', 'uBass', 'uMid', 'uHigh', 'uIntro', 'uIdle', 'uSpeak',
    'uThink', 'uTrans', 'uColorA', 'uColorB', 'uColorC', 'uGlow', 'uDetail', 'uScale', 'uBg'];

  // ---------------------------------------------------------------- utils
  const clamp01 = (v) => Math.min(1, Math.max(0, v));
  const colorCache = new Map();
  function hexToRgb(hex) {
    let c = colorCache.get(hex);
    if (c) return c;
    let h = String(hex || '#000').replace('#', '');
    if (h.length === 3) h = h.split('').map((x) => x + x).join('');
    const n = parseInt(h, 16) || 0;
    c = [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
    colorCache.set(hex, c);
    return c;
  }
  function hash1(n) { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

  /** Deterministic pseudo voice: syllables grouped in phrases with pauses. */
  function simulateVoice(t) {
    const s = t * 4.2;
    const i = Math.floor(s);
    const f = s - i;
    const ph = t / 3.1;
    const inPhrase = ph - Math.floor(ph) < 0.78 ? 1 : 0;
    const on = hash1(i) > 0.18 ? 1 : 0;
    const amp = (0.35 + 0.65 * hash1(i + 13.7)) * on * inPhrase;
    const level = amp * Math.pow(Math.sin(Math.PI * f), 0.8);
    return {
      active: true,
      level,
      bass: level * (0.6 + 0.4 * hash1(i + 3.1)),
      mid: level * (0.7 + 0.3 * hash1(i + 5.3)),
      high: level * (0.3 + 0.5 * hash1(i + 9.9)),
    };
  }

  // ---------------------------------------------------------------- renderer
  class OrbRenderer {
    constructor(canvas, opts = {}) {
      this.canvas = canvas;
      const gl = canvas.getContext('webgl2', {
        alpha: true,
        premultipliedAlpha: true,
        antialias: false,
        depth: false,
        stencil: false,
        preserveDrawingBuffer: !!opts.preserveDrawingBuffer,
        powerPreference: opts.powerPreference || 'default',
      });
      if (!gl) throw new Error('WebGL2 is not available in this browser.');
      this.gl = gl;
      this.programs = new Map();
      this.vao = gl.createVertexArray();
      this.lost = false;
      canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); this.lost = true; });
      canvas.addEventListener('webglcontextrestored', () => {
        this.lost = false;
        this.programs = new Map();
        this.vao = gl.createVertexArray();
      });
    }

    _compile(type, src) {
      const gl = this.gl;
      const sh = gl.createShader(type);
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS) && !gl.isContextLost()) {
        const log = gl.getShaderInfoLog(sh);
        const numbered = src.split('\n').map((l, i) => String(i + 1).padStart(4) + ' ' + l).join('\n');
        console.error(log + '\n' + numbered);
        throw new Error('Shader compile error: ' + log);
      }
      return sh;
    }

    _link(vs, fs) {
      const gl = this.gl;
      const prog = gl.createProgram();
      gl.attachShader(prog, this._compile(gl.VERTEX_SHADER, vs));
      gl.attachShader(prog, this._compile(gl.FRAGMENT_SHADER, fs));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS) && !gl.isContextLost()) {
        throw new Error('Program link error: ' + gl.getProgramInfoLog(prog));
      }
      const loc = {};
      for (const u of UNIFORMS) loc[u] = gl.getUniformLocation(prog, u);
      return { prog, loc };
    }

    program(def) {
      const key = def.id + ':' + def.frag.length + ':' + (def.points ? def.points.vert.length : 0);
      let p = this.programs.get(key);
      if (p) return p;
      p = this._link(VERT, FRAG_HEAD + def.frag + FRAG_TAIL);
      if (def.points) p.points = this._link(POINTS_VERT_HEAD + def.points.vert + POINTS_VERT_TAIL, POINTS_FRAG);
      this.programs.set(key, p);
      return p;
    }

    _uniforms(loc, u, w, h) {
      const gl = this.gl;
      gl.uniform2f(loc.uRes, w, h);
      gl.uniform1f(loc.uTime, u.uTime);
      gl.uniform1f(loc.uLevel, u.uLevel);
      gl.uniform1f(loc.uBass, u.uBass);
      gl.uniform1f(loc.uMid, u.uMid);
      gl.uniform1f(loc.uHigh, u.uHigh);
      gl.uniform1f(loc.uIntro, u.uIntro);
      gl.uniform1f(loc.uIdle, u.uIdle);
      gl.uniform1f(loc.uSpeak, u.uSpeak);
      gl.uniform1f(loc.uThink, u.uThink);
      gl.uniform1f(loc.uTrans, u.uTrans);
      gl.uniform3fv(loc.uColorA, u.uColorA);
      gl.uniform3fv(loc.uColorB, u.uColorB);
      gl.uniform3fv(loc.uColorC, u.uColorC);
      gl.uniform1f(loc.uGlow, u.uGlow);
      gl.uniform1f(loc.uDetail, u.uDetail);
      gl.uniform1f(loc.uScale, u.uScale);
      gl.uniform4fv(loc.uBg, u.uBg || [0, 0, 0, 0]);
    }

    draw(def, u, w, h) {
      if (this.lost) return false;
      const gl = this.gl;
      const c = this.canvas;
      if (c.width !== w) c.width = w;
      if (c.height !== h) c.height = h;
      const P = this.program(def);
      gl.viewport(0, 0, w, h);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(P.prog);
      this._uniforms(P.loc, u, w, h);
      gl.bindVertexArray(this.vao);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (P.points) {
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE);
        gl.useProgram(P.points.prog);
        this._uniforms(P.points.loc, u, w, h);
        gl.drawArrays(gl.POINTS, 0, def.points.count);
        gl.disable(gl.BLEND);
      }
      return true;
    }
    dispose() {
      const ext = this.gl.getExtension('WEBGL_lose_context');
      if (ext) ext.loseContext();
    }
  }

  // ---------------------------------------------------------------- state machine
  class OrbStateMachine {
    constructor(state) {
      this.state = 'idle';
      this.effective = 'idle';
      this.w = { idle: 1, speak: 0, think: 0, trans: 0 };
      this.intro = 1;
      this.autoOn = false;
      this.autoHold = 0;
      this.set(state || 'idle');
    }
    set(s) {
      if (!STATES.includes(s)) s = 'idle';
      this.state = s;
      if (s === 'intro') this.intro = 0;
    }
    update(dt, level, introDuration) {
      let eff = this.state;
      if (eff === 'auto') {
        if (level > 0.08) { this.autoOn = true; this.autoHold = 0.35; }
        else { this.autoHold -= dt; if (this.autoHold <= 0) this.autoOn = false; }
        eff = this.autoOn ? 'speaking' : 'idle';
      }
      if (eff === 'intro') {
        this.intro = Math.min(1, this.intro + dt / Math.max(0.2, introDuration || 1.8));
        eff = 'idle';
      } else {
        this.intro = Math.min(1, this.intro + dt * 3);
      }
      this.effective = eff;
      const k = 1 - Math.exp(-dt * 5);
      const t = { idle: eff === 'idle', speak: eff === 'speaking', think: eff === 'thinking', trans: eff === 'transition' };
      for (const key in t) this.w[key] += ((t[key] ? 1 : 0) - this.w[key]) * k;
    }
  }

  // ---------------------------------------------------------------- instance
  class OrbInstance {
    constructor(def, config = {}, state = 'idle') {
      this.def = def;
      this.config = Object.assign({}, DEFAULT_CONFIG, def.defaults || {}, config);
      this.sm = new OrbStateMachine(state);
      this.time = 0;
      this.simT = 0;
      this.f = { level: 0, bass: 0, mid: 0, high: 0 };
      this.u = {};
    }
    setState(s) { this.sm.set(s); }
    get state() { return this.sm.state; }
    setConfig(partial) { Object.assign(this.config, partial); }
    reset() { this.time = 0; this.simT = 0; }

    /** live: features from AudioReactor (or manual) – null/inactive → simulated voice */
    update(dt, live) {
      this.simT += dt;
      const hasLive = !!(live && live.active);
      const src = hasLive ? live : simulateVoice(this.simT);
      const k = 1 - Math.exp(-dt * 18);
      const f = this.f;
      f.level += (src.level - f.level) * k;
      f.bass += (src.bass - f.bass) * k;
      f.mid += (src.mid - f.mid) * k;
      f.high += (src.high - f.high) * k;

      const c = this.config;
      this.sm.update(dt, f.level, c.introDuration);
      const w = this.sm.w;
      this.time += dt * c.speed * (1 + 0.35 * w.speak + 1.4 * w.think + 0.7 * w.trans);
      const gate = (hasLive ? 0.18 : 0) * w.idle + w.speak + 0.15 * w.think + 0.4 * w.trans;
      const g = c.react * gate;

      const u = this.u;
      u.uTime = this.time;
      u.uLevel = clamp01(f.level * g);
      u.uBass = clamp01(f.bass * g);
      u.uMid = clamp01(f.mid * g);
      u.uHigh = clamp01(f.high * g);
      u.uIntro = this.sm.intro;
      u.uIdle = w.idle;
      u.uSpeak = w.speak;
      u.uThink = w.think;
      u.uTrans = w.trans;
      u.uColorA = hexToRgb(c.colorA);
      u.uColorB = hexToRgb(c.colorB);
      u.uColorC = hexToRgb(c.colorC);
      u.uGlow = c.glow;
      u.uDetail = c.detail;
      u.uScale = c.scale;
      u.uBg = c.background ? (() => { const b = hexToRgb(c.background); return [b[0], b[1], b[2], 1]; })() : [0, 0, 0, 0];
      return u;
    }
  }

  // ---------------------------------------------------------------- audio
  const mediaSources = new WeakMap();
  class AudioReactor {
    constructor() {
      this.ctx = null;
      this.analyser = null;
      this.node = null;
      this.stream = null;
      this.mode = 'none';
      this.active = false;
      this.floor = 0.06;
      this.gain = 2.6;
      this.features = { active: false, level: 0, bass: 0, mid: 0, high: 0 };
    }
    async _ensure() {
      if (!this.ctx) {
        const AC = root.AudioContext || root.webkitAudioContext;
        if (!AC) throw new Error('Web Audio is not available.');
        this.ctx = new AC();
        this.analyser = this.ctx.createAnalyser();
        this.analyser.fftSize = 1024;
        this.analyser.smoothingTimeConstant = 0.55;
        this.freq = new Uint8Array(this.analyser.frequencyBinCount);
      }
      if (this.ctx.state === 'suspended') await this.ctx.resume();
    }
    disconnect() {
      if (this.node) { try { this.node.disconnect(); } catch (e) { /* noop */ } }
      if (this.stream && this._ownsStream) this.stream.getTracks().forEach((t) => t.stop());
      if (this.mediaEl && this._ownsMedia) { this.mediaEl.pause(); }
      this.node = null; this.stream = null; this.mediaEl = null;
      this.active = false; this.mode = 'none'; this.features.active = false;
    }
    async connectStream(stream, own = false, mode = 'stream') {
      await this._ensure();
      this.disconnect();
      if (!stream.getAudioTracks().length) throw new Error('This stream has no audio track.');
      this.stream = stream; this._ownsStream = own;
      this.node = this.ctx.createMediaStreamSource(stream);
      this.node.connect(this.analyser);
      this.active = true; this.mode = mode;
    }
    async useMicrophone() {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      await this.connectStream(stream, true, 'mic');
    }
    /** Desktop Chromium: share a tab/screen with "share audio" ticked. */
    async useSystemAudio() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) throw new Error('System audio capture is not supported here.');
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      stream.getVideoTracks().forEach((t) => t.stop());
      if (!stream.getAudioTracks().length) throw new Error('No audio shared. Tick "Share audio" in the dialog.');
      await this.connectStream(stream, true, 'system');
    }
    /** Hook a playing <audio>/<video> (e.g. your TTS output). Keeps it audible. */
    async connectMediaElement(el, own = false) {
      await this._ensure();
      this.disconnect();
      let src = mediaSources.get(el);
      if (!src) { src = this.ctx.createMediaElementSource(el); mediaSources.set(el, src); }
      this.node = src;
      src.connect(this.analyser);
      src.connect(this.ctx.destination);
      this.mediaEl = el; this._ownsMedia = own;
      this.active = true; this.mode = 'media';
    }
    async useFile(file) {
      const el = new Audio();
      el.src = URL.createObjectURL(file);
      el.loop = true;
      el.crossOrigin = 'anonymous';
      await this.connectMediaElement(el, true);
      this.mode = 'file';
      await el.play();
    }
    update(dt) {
      const f = this.features;
      if (!this.active || !this.analyser) {
        f.active = false; f.level = f.bass = f.mid = f.high = 0;
        return f;
      }
      this.analyser.getByteFrequencyData(this.freq);
      const binHz = this.ctx.sampleRate / this.analyser.fftSize;
      const n = this.freq.length;
      const band = (lo, hi) => {
        const a = Math.max(1, Math.floor(lo / binHz));
        const b = Math.min(n - 1, Math.ceil(hi / binHz));
        let s = 0;
        for (let i = a; i <= b; i++) s += this.freq[i];
        return s / ((b - a + 1) * 255);
      };
      const norm = (v) => clamp01((v - this.floor) * this.gain);
      const k = (cur, next) => cur + (next - cur) * (next > cur ? 0.6 : 0.15);
      f.active = true;
      f.level = k(f.level, norm(band(85, 3500)));
      f.bass = k(f.bass, norm(band(30, 250)));
      f.mid = k(f.mid, norm(band(250, 2000)));
      f.high = k(f.high, norm(band(2000, 8000)));
      return f;
    }
  }

  // ---------------------------------------------------------------- registry + element
  const registry = root.__AI_ORBS__ || (root.__AI_ORBS__ = { defs: {}, configs: {}, last: null });

  function registerOrb(def, config) {
    registry.defs[def.id] = def;
    registry.configs[def.id] = config || {};
    registry.last = def.id;
    return def;
  }

  function defineElement(tag = 'ai-orb') {
    if (!root.customElements || root.customElements.get(tag)) return;
    class AiOrbElement extends HTMLElement {
      static get observedAttributes() { return ['state', 'orb']; }
      constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'open' });
        shadow.innerHTML = '<style>:host{display:block;position:relative;width:240px;height:240px;contain:strict}canvas{width:100%;height:100%;display:block}</style><canvas part="canvas"></canvas>';
        this.canvas = shadow.querySelector('canvas');
        this._manual = null;
        this.audio = null;
        this._visible = true;
        this._loop = this._loop.bind(this);
      }
      _setup() {
        const id = this.getAttribute('orb') || registry.last;
        const def = registry.defs[id];
        if (!def) { console.warn('[ai-orb] unknown orb', id); return; }
        const prevCfg = this.inst ? this.inst.config : null;
        this.inst = new OrbInstance(def, Object.assign({}, registry.configs[id], this._cfg || {}), this.getAttribute('state') || 'intro');
        if (prevCfg && this._cfg) this.inst.setConfig(this._cfg);
      }
      connectedCallback() {
        if (!this.renderer) this.renderer = new OrbRenderer(this.canvas);
        if (!this.inst) this._setup();
        this._ro = new ResizeObserver(() => this._resize());
        this._ro.observe(this);
        this._io = new IntersectionObserver((e) => { this._visible = e[0].isIntersecting; });
        this._io.observe(this);
        this._resize();
        this._last = 0;
        this._raf = requestAnimationFrame(this._loop);
      }
      disconnectedCallback() {
        cancelAnimationFrame(this._raf);
        if (this._ro) this._ro.disconnect();
        if (this._io) this._io.disconnect();
      }
      attributeChangedCallback(name, _o, v) {
        if (name === 'state' && this.inst) this.inst.setState(v);
        if (name === 'orb' && this.inst) this._setup();
      }
      _resize() {
        const dpr = Math.min(root.devicePixelRatio || 1, 2);
        const r = this.getBoundingClientRect();
        this._w = Math.max(1, Math.round(r.width * dpr));
        this._h = Math.max(1, Math.round(r.height * dpr));
      }
      _loop(now) {
        this._raf = requestAnimationFrame(this._loop);
        if (!this._visible || !this.inst) { this._last = now; return; }
        const dt = Math.min(0.1, this._last ? (now - this._last) / 1000 : 0.016);
        this._last = now;
        const live = this._manual || (this.audio && this.audio.active ? this.audio.update(dt) : null);
        this.inst.update(dt, live);
        this.renderer.draw(this.inst.def, this.inst.u, this._w, this._h);
      }
      get state() { return this.inst ? this.inst.state : this.getAttribute('state'); }
      set state(v) { this.setAttribute('state', v); }
      get config() { return this.inst ? Object.assign({}, this.inst.config) : this._cfg; }
      set config(v) { this._cfg = Object.assign({}, this._cfg || {}, v); if (this.inst) this.inst.setConfig(v); }
      replayIntro() { if (this.inst) this.inst.setState('intro'); }
      _audio() { if (!this.audio) this.audio = new AudioReactor(); this._manual = null; return this.audio; }
      useMicrophone() { return this._audio().useMicrophone(); }
      useSystemAudio() { return this._audio().useSystemAudio(); }
      connectStream(stream) { return this._audio().connectStream(stream); }
      connectAudioElement(el) { return this._audio().connectMediaElement(el); }
      /** Share one AudioReactor between several orbs. */
      useAudioReactor(reactor) { this.audio = reactor; this._manual = null; }
      /** Drive manually: number 0..1 or {level,bass,mid,high}; null to release. */
      setLevel(v) {
        if (v == null) { this._manual = null; return; }
        const o = typeof v === 'number' ? { level: v, bass: v, mid: v, high: v } : v;
        this._manual = Object.assign({ active: true, level: 0, bass: 0, mid: 0, high: 0 }, o);
      }
      stopAudio() { if (this.audio) this.audio.disconnect(); }
    }
    root.customElements.define(tag, AiOrbElement);
  }

  return {
    STATES, DEFAULT_CONFIG,
    OrbRenderer, OrbInstance, OrbStateMachine, AudioReactor,
    simulateVoice, hexToRgb, registerOrb, defineElement, registry,
  };
}

export const Runtime = orbRuntimeFactory(globalThis);
