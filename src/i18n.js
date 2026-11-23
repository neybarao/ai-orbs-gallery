// UI strings. Add a language by adding a key with the same fields.
export const STRINGS = {
  en: {
    audioSource: 'Audio source', srcSim: 'Simulated', srcMic: 'Mic', srcSystem: 'System', srcFile: 'File',
    inputLevel: 'Input level',
    lede: 'Audio-reactive orbs for voice &amp; AI interfaces. One WebGL2 draw call each. Hover to preview <em>speaking</em>, click to configure and export.',
    close: 'Close', bgDark: 'Dark background', bgLight: 'Light background', bgChecker: 'Transparency checker',
    look: 'Look', reset: 'Reset', export: 'Export', code: 'Code', video: 'Video',
    copySnippet: 'Copy snippet', downloadJs: 'Download .js', copyConfig: 'Copy config JSON',
    state: 'State', duration: 'Duration', size: 'Size', format: 'Format', background: 'Background',
    transparent: 'Transparent background', experimental: '(WebM, experimental)', driveLive: 'Drive with the live audio source',
    record: 'Record video', recording: 'Recording…',
    recordNote: 'Recorded in real time in your browser. Keep this tab visible while recording.',
    states: { intro: 'Intro', idle: 'Idle', speaking: 'Speaking', transition: 'Transition', thinking: 'Thinking', auto: 'Auto' },
    sliders: { speed: 'Speed', react: 'Reactivity', glow: 'Glow', detail: 'Detail', scale: 'Size' },
    colors: { colorA: 'Main', colorB: 'Depth', colorC: 'Light' },
    open: 'Open', original: 'Original', palette: 'Palette', unsupported: 'Unsupported',
    noWebgl: 'WebGL2 is not available in this browser.',
    permissionDenied: 'Permission denied.', audioFailed: 'Could not start audio.', playing: 'Playing',
    snippetCopied: 'Snippet copied', configCopied: 'Config copied', clipboardBlocked: 'Clipboard blocked — select the text manually.',
    videoReady: 'Video ready', recordFailed: 'Recording failed',
    orbs: {},
  },
  pt: {
    audioSource: 'Fonte de áudio', srcSim: 'Simulado', srcMic: 'Mic', srcSystem: 'Sistema', srcFile: 'Arquivo',
    inputLevel: 'Nível de entrada',
    lede: 'Orbs reativos a áudio para interfaces de voz e IA. Uma chamada de desenho WebGL2 cada. Passe o mouse para ver o estado <em>falando</em>, clique para configurar e exportar.',
    close: 'Fechar', bgDark: 'Fundo escuro', bgLight: 'Fundo claro', bgChecker: 'Ver transparência',
    look: 'Aparência', reset: 'Restaurar', export: 'Exportar', code: 'Código', video: 'Vídeo',
    copySnippet: 'Copiar snippet', downloadJs: 'Baixar .js', copyConfig: 'Copiar config JSON',
    state: 'Estado', duration: 'Duração', size: 'Tamanho', format: 'Formato', background: 'Fundo',
    transparent: 'Fundo transparente', experimental: '(WebM, experimental)', driveLive: 'Usar a fonte de áudio ao vivo',
    record: 'Gravar vídeo', recording: 'Gravando…',
    recordNote: 'Gravado em tempo real no navegador. Mantenha esta aba visível durante a gravação.',
    states: { intro: 'Intro', idle: 'Repouso', speaking: 'Falando', transition: 'Transição', thinking: 'Pensando', auto: 'Auto' },
    sliders: { speed: 'Velocidade', react: 'Reatividade', glow: 'Brilho', detail: 'Detalhe', scale: 'Tamanho' },
    colors: { colorA: 'Principal', colorB: 'Profundidade', colorC: 'Luz' },
    open: 'Abrir', original: 'Original', palette: 'Paleta', unsupported: 'Sem suporte',
    noWebgl: 'WebGL2 não está disponível neste navegador.',
    permissionDenied: 'Permissão negada.', audioFailed: 'Não foi possível iniciar o áudio.', playing: 'Tocando',
    snippetCopied: 'Snippet copiado', configCopied: 'Config copiada', clipboardBlocked: 'Área de transferência bloqueada. Selecione o texto manualmente.',
    videoReady: 'Vídeo pronto', recordFailed: 'Falha na gravação',
    orbs: {
      abyss: { description: 'Blob líquido que gira no espaço, com bordas elétricas finas e dobras translúcidas.', detail: 'Irregularidade' },
      solar: { description: 'Borda trançada em chamas, dobras que se contorcem e faíscas em estrela.', detail: 'Densidade das dobras' },
      violet: { description: 'Giroscópio de anéis luminosos girando em 3D em volta de um núcleo escuro.', detail: 'Inclinação dos anéis' },
      pastel: { description: 'Esfera desfocada com zonas pastel girando, que fica branca ao falar.', detail: 'Nitidez' },
      particles: { description: 'Esfera 3D de partículas que migram entre polos que mudam de lugar.', detail: 'Densidade de partículas' },
      spike: { description: 'Blob de grafite ondulante com uma grade de pequenos espinhos e luz fria de fundo.', detail: 'Densidade dos espinhos' },
      wire: { description: 'Membrana espelhada com dobras horizontais em movimento.', detail: 'Densidade das dobras' },
      globe: { description: 'Esfera de vidro com luz líquida correndo pela borda sobre meridianos suaves.', detail: 'Meridianos' },
      electric: { description: 'Globo de plasma: raios que serpenteiam do núcleo até o vidro e brilham no contato.', detail: 'Raios' },
      eclipse: { description: 'Crescente de linhas finas dentro de uma esfera de vidro, com o miolo oscilando como um pião.', detail: 'Número de linhas' },
    },
  },
};

const KEY = 'ai-orbs:lang';
function initial() {
  try { const s = localStorage.getItem(KEY); if (s && STRINGS[s]) return s; } catch { /* storage unavailable */ }
  return (navigator.language || 'en').toLowerCase().startsWith('pt') ? 'pt' : 'en';
}
export let lang = initial();
export const t = (k) => STRINGS[lang][k] ?? STRINGS.en[k] ?? k;

export function setLang(l) {
  if (!STRINGS[l]) return;
  lang = l;
  try { localStorage.setItem(KEY, l); } catch { /* storage unavailable */ }
  applyStatic();
}

export function applyStatic(root = document) {
  document.documentElement.lang = lang === 'pt' ? 'pt-BR' : 'en';
  root.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  root.querySelectorAll('[data-i18n-html]').forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml); });
  root.querySelectorAll('[data-i18n-title]').forEach((el) => { el.title = t(el.dataset.i18nTitle); });
  root.querySelectorAll('[data-i18n-aria]').forEach((el) => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
  root.querySelectorAll('#langSeg button').forEach((b) => b.classList.toggle('on', b.dataset.lang === lang));
}

/** Orb text in the current language (falls back to the orb definition). */
export function orbText(def) {
  const o = STRINGS[lang].orbs[def.id] || {};
  return {
    description: o.description || def.description,
    detail: o.detail || (def.labels && def.labels.detail) || t('sliders').detail,
  };
}
