import { Runtime } from './runtime.js';
import { ORBS } from './orbs/index.js';
import { t, setLang, applyStatic, orbText } from './i18n.js';
import { buildComponentFile, buildDemoHtml, cleanConfig, download, fileName, recordVideo, snippets, videoFormats } from './export.js';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

const PALETTES = [
  ['#3cc8ff', '#0a4f8a', '#d8f6ff'],
  ['#ff4a12', '#7a0a00', '#ffd27a'],
  ['#9b5cff', '#5a1fd1', '#f1e6ff'],
  ['#7ff3ff', '#ff7ac8', '#b48cff'],
  ['#00e0a4', '#035e4b', '#c8ffe9'],
  ['#ffcf4a', '#8a4b00', '#fff4d1'],
  ['#ff5c8a', '#6a0f3a', '#ffd6e4'],
  ['#e8eef5', '#3b4250', '#ffffff'],
];
const SLIDERS = [
  { key: 'speed', label: 'Speed', min: 0, max: 3, step: 0.01 },
  { key: 'react', label: 'Reactivity', min: 0, max: 3, step: 0.01 },
  { key: 'glow', label: 'Glow', min: 0, max: 1, step: 0.01 },
  { key: 'detail', label: 'Detail', min: 0, max: 1, step: 0.01 },
  { key: 'scale', label: 'Size', min: 0.4, max: 1.4, step: 0.01 },
];


// ---------------------------------------------------------------- persistence
const STORE = 'ai-orbs:configs:v1';
const loadSaved = () => { try { return JSON.parse(localStorage.getItem(STORE) || '{}'); } catch { return {}; } };
let saved = loadSaved();
const persist = () => { try { localStorage.setItem(STORE, JSON.stringify(saved)); } catch { /* storage unavailable */ } };

// ---------------------------------------------------------------- language
applyStatic();
$$('#langSeg button').forEach((b) => b.addEventListener('click', () => {
  setLang(b.dataset.lang);
  buildStates();
  if (current) {
    $('#dDesc').textContent = orbText(current.card.def).description;
    buildControls();
    refreshFormats();
    $$('#states button').forEach((x) => x.classList.toggle('on', x.dataset.state === current.inst.state));
  }
  cards.forEach((c) => c.el.setAttribute('aria-label', `${t('open')} ${c.def.name}`));
}));

// ---------------------------------------------------------------- toast
let toastT;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2600);
}

// ---------------------------------------------------------------- audio
const audio = new Runtime.AudioReactor();
let source = 'sim';
const sysBtn = $('[data-src="system"]');
if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia || /Mobi|Android/i.test(navigator.userAgent)) sysBtn.hidden = true;

function setSourceUI(src) {
  source = src;
  $$('#sourceSeg button').forEach((b) => { const on = b.dataset.src === src; b.classList.toggle('on', on); b.setAttribute('aria-checked', on); });
  // when listening live, grid orbs respond to your voice automatically
  for (const c of cards) if (!c.hover) c.inst.setState(src === 'sim' ? 'idle' : 'auto');
}
async function chooseSource(src) {
  try {
    if (src === 'sim') audio.disconnect();
    else if (src === 'mic') await audio.useMicrophone();
    else if (src === 'system') await audio.useSystemAudio();
    else if (src === 'file') { $('#fileInput').click(); return; }
    setSourceUI(src);
  } catch (e) {
    toast(e.name === 'NotAllowedError' ? t('permissionDenied') : e.message || t('audioFailed'));
  }
}
$$('#sourceSeg button').forEach((b) => b.addEventListener('click', () => chooseSource(b.dataset.src)));
$('#fileInput').addEventListener('change', async (e) => {
  const f = e.target.files[0]; if (!f) return;
  try { await audio.useFile(f); setSourceUI('file'); toast(t('playing') + ' ' + f.name); } catch (err) { toast(err.message); }
  e.target.value = '';
});

// ---------------------------------------------------------------- grid
const grid = $('#grid');
$('#count').textContent = String(ORBS.length).padStart(2, '0');
let shared;
try { shared = new Runtime.OrbRenderer(document.createElement('canvas'), { powerPreference: 'low-power' }); }
catch (e) { grid.innerHTML = '<p class="muted">' + t('noWebgl') + '</p>'; throw e; }

const cards = ORBS.map((def, i) => {
  const el = document.createElement('button');
  el.className = 'card';
  el.setAttribute('aria-label', `${t('open')} ${def.name}`);
  el.innerHTML = `<canvas></canvas><div class="meta"><span class="name">${def.name}</span><span class="idx">${String(i + 1).padStart(2, '0')}</span></div>`;
  grid.appendChild(el);
  const canvas = $('canvas', el);
  const card = { def, el, canvas, ctx: canvas.getContext('2d'), inst: new Runtime.OrbInstance(def, saved[def.id] || {}, 'intro'), visible: true, hover: false, delay: i * 0.09 };
  card.inst.sm.intro = 0;
  el.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') { card.hover = true; card.inst.setState('speaking'); } });
  el.addEventListener('pointerleave', () => { if (card.hover) { card.hover = false; card.inst.setState(source === 'sim' ? 'idle' : 'auto'); } });
  el.addEventListener('click', () => openDetail(card));
  return card;
});

const io = new IntersectionObserver((entries) => {
  for (const e of entries) { const c = cards.find((x) => x.el === e.target); if (c) c.visible = e.isIntersecting; }
});
cards.forEach((c) => io.observe(c.el));

let cardPx = 0;
function sizeCards() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = cards[0].el.clientWidth;
  cardPx = Math.min(Math.round(w * dpr), 640);
  for (const c of cards) { c.canvas.width = cardPx; c.canvas.height = cardPx; }
}
new ResizeObserver(sizeCards).observe(grid);
sizeCards();

// ---------------------------------------------------------------- detail
const detail = $('#detail');
const stageCanvas = $('#stageCanvas');
let stageRenderer = null;
let current = null; // { card, inst }

function buildStates() {
  const box = $('#states');
  box.innerHTML = '';
  for (const s of Runtime.STATES) {
    const b = document.createElement('button');
    b.textContent = t('states')[s]; b.dataset.state = s; b.setAttribute('role', 'tab');
    b.addEventListener('click', () => setDetailState(s));
    box.appendChild(b);
  }
  const vs = $('#vState');
  vs.innerHTML = Runtime.STATES.filter((s) => s !== 'auto').map((s) => `<option value="${s}">${t('states')[s]}</option>`).join('');
}
buildStates();

function setDetailState(s) {
  if (!current) return;
  current.inst.setState(s);
  $$('#states button').forEach((b) => b.classList.toggle('on', b.dataset.state === s));
  if (s !== 'auto' && s !== 'intro') $('#vState').value = s;
}

function openDetail(card) {
  if (!stageRenderer) stageRenderer = new Runtime.OrbRenderer(stageCanvas);
  current = { card, inst: new Runtime.OrbInstance(card.def, saved[card.def.id] || {}, 'intro') };
  detail.hidden = false;
  document.body.style.overflow = 'hidden';
  $('#dTitle').textContent = card.def.name;
  $('#dDesc').textContent = orbText(card.def).description;
  setDetailState('intro');
  setTimeout(() => { if (current && current.inst.state === 'intro') setDetailState('idle'); }, (current.inst.config.introDuration || 1.8) * 1000 + 200);
  buildControls();
  renderCode();
  refreshFormats();
  history.replaceState(null, '', '#' + card.def.id);
}
function closeDetail() {
  detail.hidden = true;
  document.body.style.overflow = '';
  current = null;
  history.replaceState(null, '', location.pathname + location.search);
}
$('#closeBtn').addEventListener('click', closeDetail);
window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !detail.hidden) closeDetail(); });

$$('.stage-bg button').forEach((b) => b.addEventListener('click', () => {
  $$('.stage-bg button').forEach((x) => x.classList.toggle('on', x === b));
  $('#stage').dataset.bg = b.dataset.bg;
}));

function applyConfig(partial) {
  const id = current.card.def.id;
  current.inst.setConfig(partial);
  current.card.inst.setConfig(partial);
  saved[id] = Object.assign({}, saved[id] || {}, partial);
  persist();
  renderCode();
}

function buildControls() {
  const { def } = current.card;
  const cfg = current.inst.config;
  const pal = $('#palettes');
  pal.innerHTML = '';
  const defaults = [def.defaults.colorA, def.defaults.colorB, def.defaults.colorC];
  [defaults, ...PALETTES].forEach((p, i) => {
    const b = document.createElement('button');
    b.title = i === 0 ? t('original') : t('palette') + ' ' + i;
    b.style.background = `conic-gradient(${p[0]} 0 50%, ${p[2]} 50% 75%, ${p[1]} 75%)`;
    b.addEventListener('click', () => { applyConfig({ colorA: p[0], colorB: p[1], colorC: p[2] }); syncControls(); });
    pal.appendChild(b);
  });

  const colors = $('#colors');
  colors.innerHTML = '';
  ['colorA', 'colorB', 'colorC'].forEach((key) => {
    const label = t('colors')[key];
    const l = document.createElement('label');
    l.innerHTML = `<input type="color" data-key="${key}" value="${cfg[key]}"> ${label}`;
    $('input', l).addEventListener('input', (e) => applyConfig({ [key]: e.target.value }));
    colors.appendChild(l);
  });

  const sl = $('#sliders');
  sl.innerHTML = '';
  for (const s of SLIDERS) {
    const row = document.createElement('label');
    row.className = 'slider';
    const label = s.key === 'detail' ? orbText(def).detail : t('sliders')[s.key];
    row.innerHTML = `<span>${label}</span><input type="range" data-key="${s.key}" min="${s.min}" max="${s.max}" step="${s.step}" value="${cfg[s.key]}"><span>${(+cfg[s.key]).toFixed(2)}</span>`;
    const input = $('input', row), out = row.lastElementChild;
    input.addEventListener('input', () => { out.textContent = (+input.value).toFixed(2); applyConfig({ [s.key]: +input.value }); });
    sl.appendChild(row);
  }
}
function syncControls() {
  const cfg = current.inst.config;
  $$('#colors input, #sliders input').forEach((i) => {
    i.value = cfg[i.dataset.key];
    if (i.type === 'range') i.nextElementSibling.textContent = (+cfg[i.dataset.key]).toFixed(2);
  });
}
$('#resetBtn').addEventListener('click', () => {
  const id = current.card.def.id;
  delete saved[id]; persist();
  const fresh = Object.assign({}, Runtime.DEFAULT_CONFIG, current.card.def.defaults);
  current.inst.setConfig(fresh); current.card.inst.setConfig(fresh);
  syncControls(); renderCode();
});

// export: code
let codeKind = 'html';
function renderCode() {
  if (!current) return;
  $('#codeOut').textContent = snippets(current.card.def, current.inst.config)[codeKind];
}
$$('#codeSeg button').forEach((b) => b.addEventListener('click', () => {
  codeKind = b.dataset.code;
  $$('#codeSeg button').forEach((x) => x.classList.toggle('on', x === b));
  renderCode();
}));
$$('.tabs button').forEach((b) => b.addEventListener('click', () => {
  $$('.tabs button').forEach((x) => x.classList.toggle('on', x === b));
  $$('.tab-body').forEach((x) => { x.hidden = x.dataset.body !== b.dataset.tab; });
}));
async function copy(text, msg) {
  try { await navigator.clipboard.writeText(text); toast(msg); }
  catch { toast(t('clipboardBlocked')); }
}
$('#copyCode').addEventListener('click', () => copy($('#codeOut').textContent, t('snippetCopied')));
$('#copyConfig').addEventListener('click', () => copy(JSON.stringify(cleanConfig(current.inst.config), null, 2), t('configCopied')));
$('#dlComponent').addEventListener('click', () => download(fileName(current.card.def), buildComponentFile(current.card.def, current.inst.config), 'text/javascript'));
$('#dlDemo').addEventListener('click', () => download(`ai-orb-${current.card.def.id}-demo.html`, buildDemoHtml(current.card.def, current.inst.config), 'text/html'));

// export: video
function refreshFormats() {
  const list = videoFormats($('#vAlpha').checked);
  const sel = $('#vFormat');
  sel.innerHTML = list.map((f) => `<option value="${f.id}">${f.label}</option>`).join('') || '<option value="">' + t('unsupported') + '</option>';
  $('#recordBtn').disabled = !list.length;
  $('#vBg').disabled = $('#vAlpha').checked;
}
$('#vAlpha').addEventListener('change', refreshFormats);
$('#recordBtn').addEventListener('click', async () => {
  if (!current) return;
  const btn = $('#recordBtn'), prog = $('#vProgress');
  const def = current.card.def;
  btn.disabled = true; btn.textContent = t('recording');
  prog.hidden = false; $('i', prog).style.width = '0%';
  try {
    const { blob, ext } = await recordVideo({
      def,
      config: current.inst.config,
      state: $('#vState').value,
      duration: +$('#vDur').value,
      size: +$('#vSize').value,
      fps: +$('#vFps').value,
      format: $('#vFormat').value,
      background: $('#vBg').value,
      transparent: $('#vAlpha').checked,
      live: $('#vLive').checked && audio.active ? audio : null,
      onProgress: (p) => { $('i', prog).style.width = (p * 100).toFixed(1) + '%'; },
    });
    download(`ai-orb-${def.id}-${$('#vState').value}.${ext}`, blob);
    toast(t('videoReady'));
  } catch (e) {
    toast(e.message || t('recordFailed'));
  } finally {
    btn.disabled = false; btn.textContent = t('record');
    setTimeout(() => { prog.hidden = true; }, 800);
  }
});

// ---------------------------------------------------------------- loop
let last = 0, elapsed = 0;
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.1, last ? (now - last) / 1000 : 0.016);
  last = now; elapsed += dt;
  const live = audio.active ? audio.update(dt) : null;
  $('#meterFill').style.width = ((live ? live.level : 0) * 100).toFixed(0) + '%';

  if (current) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const px = Math.min(Math.round(stageCanvas.clientWidth * dpr), 1400);
    current.inst.update(dt, live);
    if (px > 0) stageRenderer.draw(current.card.def, current.inst.u, px, px);
    return; // grid paused while the detail view is open
  }
  if (!cardPx) return;
  for (const c of cards) {
    if (!c.visible || elapsed < c.delay) continue;
    c.inst.update(dt, live);
    shared.draw(c.def, c.inst.u, cardPx, cardPx);
    c.ctx.clearRect(0, 0, cardPx, cardPx);
    c.ctx.drawImage(shared.canvas, 0, 0);
  }
}
requestAnimationFrame(frame);

// deep link: #orb-id
const deep = location.hash.slice(1);
if (deep) { const c = cards.find((x) => x.def.id === deep); if (c) openDetail(c); }
