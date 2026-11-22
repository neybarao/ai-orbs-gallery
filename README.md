# AI Orbs Gallery

Galeria de orbs reativos a áudio (microfone, áudio do sistema, arquivo ou voz simulada) para interfaces de voz e IA. Cada orb é um único fragment shader WebGL2 desenhado com um triângulo fullscreen, sem dependências e sem build.

## Recursos

- **Grid** com preview ao vivo (um único contexto WebGL compartilhado para todos os cards). Hover = estado *speaking*.
- **Estados**: `intro`, `idle`, `speaking`, `transition`, `thinking` e `auto` (fala quando detecta voz).
- **Configuração**: 3 cores + paletas, velocidade, reatividade, glow, detalhe e tamanho. Salvo no navegador.
- **Export de código**: um arquivo `.js` autocontido que registra o web component `<ai-orb>`, mais snippets HTML/React e um demo `.html`.
- **Export de vídeo**: grava qualquer estado em MP4 ou WebM (512/720/1080, 30/60 fps), com fundo de cor ou transparente (WebM, experimental).

## Rodar localmente

Precisa de um servidor estático (módulos ES não carregam via `file://`):

```bash
npx serve .
# ou
python3 -m http.server
```

## Publicar no GitHub Pages

O workflow `.github/workflows/pages.yml` publica a cada push na `main`.
Em **Settings → Pages**, selecione **Source: GitHub Actions**.

## Usar um orb exportado

```html
<script src="./ai-orb-abyss.js"></script>
<ai-orb orb="abyss" state="intro" style="width:240px;height:240px"></ai-orb>

<script>
  const orb = document.querySelector('ai-orb');
  orb.state = 'thinking';
  await orb.useMicrophone();          // ou:
  await orb.connectAudioElement(tts); // <audio> do seu TTS
  await orb.connectStream(stream);    // MediaStream (WebRTC etc.)
  orb.setLevel(0.6);                  // controle manual 0..1
</script>
```

## Adicionar um orb novo

1. Crie `src/orbs/<id>.js` exportando `{ id, name, description, defaults, labels, frag }`.
2. `frag` define `vec4 orb(vec2 p)`, que retorna cor **pré-multiplicada** (rgb, alpha). `p` vai de -1 a 1 no menor eixo; o raio base é ~0.6.
3. Adicione o import em `src/orbs/index.js`.

Uniforms e helpers disponíveis (veja `FRAG_HEAD` em `src/runtime.js`):

| Uniform | Significado |
|---|---|
| `uTime` | tempo (já acelera em speaking/thinking) |
| `uLevel uBass uMid uHigh` | áudio 0..1, já multiplicado pela reatividade e pelo estado |
| `uIdle uSpeak uThink uTrans` | peso de cada estado 0..1 (interpolado) |
| `uIntro` | progresso da intro 0..1 (escala/fade aplicados automaticamente) |
| `uColorA uColorB uColorC` | principal, profundidade, luz |
| `uGlow uDetail` | sliders 0..1 |
| `PX` | tamanho de um pixel em espaço do orb (antialias) |

Helpers: `noise3`, `fbm3`, `hash11`, `hash31`, `rot`, `glow`, `addLight`, `halo`, `thinkArc`, `transRing`.

## Estrutura

```
index.html, styles.css
src/runtime.js   renderer WebGL2, estados, áudio, <ai-orb> (serializado no export)
src/export.js    geração de código e gravação de vídeo
src/app.js       grid + painel
src/orbs/        um arquivo por orb
```
