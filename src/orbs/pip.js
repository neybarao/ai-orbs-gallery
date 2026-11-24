// Pip: a tiny companion living in a glass bubble. A soft jelly cloud of light carries a face
// whose eyes wander, blink, smile while speaking, look up while thinking and wink on transitions.
export default {
  id: 'pip',
  name: 'Pip',
  description: 'A tiny companion in a glass bubble: it blinks, looks around, smiles when it talks.',
  tags: ['character', 'cute'],
  defaults: { colorA: '#5ef2d6', colorB: '#6a5cff', colorC: '#ff8fd8', glow: 0.55, detail: 0.5, introDuration: 2.2 },
  labels: { detail: 'Expressiveness' },
  frag: /* glsl */ `
float pipCapsule(vec2 p, float h, float w){ p.y = max(abs(p.y) - h, 0.0); return length(p) - w; }
// arc opening downwards (^), apex near the origin
float pipArc(vec2 p, float r, float w, float span){
  vec2 q = vec2(abs(p.x), p.y + r * 0.8);
  vec2 sc = vec2(sin(span), cos(span));
  return ((sc.y * q.x > sc.x * q.y) ? length(q - sc * r) : abs(length(q) - r)) - w;
}
float pipBox(vec2 p, vec2 b, float r){ vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
float pipStar(vec2 p, float s){ p = abs(p) / s; return (min(p.x * 4.0 + p.y, p.y * 4.0 + p.x) - 1.0) * s * 0.25; }
// eye: open oval <-> closed line <-> happy arc
float pipEye(vec2 p, float open, float happy){
  float oval = pipCapsule(p, 0.012 * open, 0.02 + 0.002 * open);
  float shut = pipCapsule(p.yx, 0.016, 0.0065);
  float d = mix(shut, oval, smoothstep(0.0, 0.6, open));
  float arc = pipArc(p - vec2(0.0, -0.004), 0.026, 0.0065, 1.05);
  return mix(d, arc, happy);
}
float pipBlink(float t, float seed){
  float per = 3.4;
  float k = floor(t / per + seed);
  float at = (hash11(k * 1.7 + seed) * 0.7 + 0.15) * per;
  float x = (t + seed * per) - k * per - at;
  float b = 1.0 - smoothstep(0.0, 0.07, abs(x) - 0.03);
  // sometimes a double blink
  float x2 = x - 0.28;
  b = max(b, step(0.65, hash11(k * 3.1 + seed)) * (1.0 - smoothstep(0.0, 0.07, abs(x2) - 0.03)));
  return b;
}
vec4 orb(vec2 p){
  float t = uTime;
  float r = length(p);
  float R = 0.6;
  float inside = smoothstep(R + PX, R - PX, r);
  float expr = 0.6 + 0.8 * uDetail;
  float lvl = uLevel;

  // ---- gaze & motion
  vec2 wander = vec2(noise3(vec3(t * 0.35, 1.0, 0.0)) - 0.5, noise3(vec3(t * 0.3, 2.0, 0.0)) - 0.5) * vec2(1.8, 1.1);
  // occasional quick glances
  float gk = floor(t / 2.3);
  vec2 glance = (vec2(hash11(gk), hash11(gk + 5.0)) - 0.5) * 1.4 * step(0.55, hash11(gk + 9.0));
  vec2 gaze = (wander + glance) * (uIdle + 0.35 * uSpeak + 0.6 * uTrans);
  gaze = mix(gaze, vec2(0.65 + 0.15 * sin(t * 0.9), 0.75), uThink);
  gaze *= expr;
  float bob = 0.012 * sin(t * 1.6) + 0.012 * lvl * sin(t * 9.0) * uSpeak;
  vec2 c = gaze * 0.045 + vec2(0.0, bob - 0.01);

  // ---- jelly cloud
  float F = 1.45;                        // face scale
  vec2 q = (p - c) / F;
  float px = PX / F;
  float stretch = 1.0 + 0.1 * lvl;
  vec2 bs = vec2(0.17 * stretch, 0.135 / stretch);
  float wob = (noise3(vec3(q * 4.0, t * 0.7)) - 0.5) * 0.034 * (1.0 + lvl * 1.5)
            + 0.012 * sin(atan(q.y, q.x) * 3.0 + t * 1.3);
  float bd = pipBox(q, bs, 0.125) + wob;
  float body = smoothstep(0.035, -0.035, bd);
  float haze = exp(-max(bd, 0.0) * 14.0);
  vec2 c1 = vec2(-0.09, 0.05) + 0.05 * vec2(sin(t * 0.7), cos(t * 0.9));
  vec2 c2 = vec2(0.1, -0.04) + 0.05 * vec2(cos(t * 0.6 + 1.0), sin(t * 0.8));
  vec2 c3 = vec2(0.02, -0.08) + 0.06 * vec2(sin(t * 0.5 + 2.0), cos(t * 0.45));
  float w1 = exp(-dot(q - c1, q - c1) * 28.0);
  float w2 = exp(-dot(q - c2, q - c2) * 28.0) * 0.9;
  float w3 = exp(-dot(q - c3, q - c3) * 32.0) * 0.8;
  vec3 cloud = (uColorA * w1 + uColorC * w2 + uColorB * w3 + uColorA * 0.05) / (w1 + w2 + w3 + 0.05);
  cloud *= 0.5 + 0.22 * smoothstep(-0.12, 0.12, q.y) + 0.3 * lvl;

  // ---- face
  vec2 eyeOff = gaze * 0.022;
  float open = 1.0 - pipBlink(t, 0.0);
  open *= smoothstep(0.55, 0.95, uIntro);
  float happy = clamp(uSpeak * (0.35 + 1.6 * lvl) * expr, 0.0, 1.0);
  vec2 le = q - vec2(-0.075, 0.018) - eyeOff;
  vec2 re = q - vec2(0.075, 0.018) - eyeOff;
  float lOpen = open * (1.0 - uTrans);        // wink on transitions
  float dl = pipEye(le, lOpen, max(happy, uTrans * 0.0));
  float dr = pipEye(re, open, happy);
  float eyes = smoothstep(px, -px, min(dl, dr));
  float eyeGlow = exp(-max(min(dl, dr), 0.0) * 60.0);
  // mouth: small smile in idle, opens with the voice
  vec2 mq = q - vec2(0.0, -0.05) - eyeOff * 0.8;
  float smile = pipArc(vec2(mq.x, -mq.y - 0.012), 0.03, 0.005, 0.85);
  vec2 mr = vec2(0.022 + 0.008 * lvl, 0.004 + 0.03 * lvl);
  float mouthOpen = (length(mq / mr) - 1.0) * min(mr.x, mr.y);
  float om = smoothstep(0.04, 0.25, lvl * uSpeak);
  float md = mix(smile, mouthOpen, om);
  float mouthVis = (0.75 * uIdle + uSpeak + 0.4 * uTrans) * (1.0 - uThink) * smoothstep(0.7, 1.0, uIntro);
  float mouth = smoothstep(px, -px, md) * mouthVis;

  vec3 acc = cloud * body + cloud * haze * (0.18 + 0.25 * uGlow);
  acc = mix(acc, vec3(1.0), clamp(eyes + mouth * 0.9, 0.0, 1.0));
  acc += vec3(1.0) * eyeGlow * 0.12 * body;

  // thinking: three dots orbiting
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    float a = t * 3.0 + fi * 2.094;
    vec2 dp = c + vec2(0.24, 0.23) + vec2(cos(a), sin(a) * 0.6) * 0.045;
    float s = 0.011 + 0.005 * sin(a);
    acc += mix(vec3(1.0), uColorC, 0.3) * smoothstep(s + PX, s - PX, length(p - dp)) * uThink;
  }
  // sparkles rising when happy
  float spark = clamp(uSpeak * smoothstep(0.15, 0.6, lvl) + uTrans + 0.15 * uThink, 0.0, 1.0);
  for (int i = 0; i < 8; i++) {
    float fi = float(i);
    float h1 = hash11(fi * 3.17 + 1.0), h2 = hash11(fi * 7.31 + 2.0);
    float ph = fract(t * (0.35 + 0.25 * h2) + h1);
    vec2 sp = c + vec2((h1 - 0.5) * 0.55, 0.16 + ph * 0.3);
    float sz = 0.028 * sin(PI * ph) * (0.6 + 0.6 * h2);
    float st = smoothstep(PX, -PX, pipStar(p - sp, max(sz, 1e-4)));
    acc += mix(uColorA, uColorC, h2) * (st + exp(-length(p - sp) * 70.0) * 0.4) * spark * sin(PI * ph);
  }

  // ---- glass bubble
  float z = sqrt(max(R * R - r * r, 0.0)) / R;
  float fres = pow(1.0 - z, 3.0);
  vec3 rimC = mix(uColorB, mix(uColorA, uColorC, 0.5), 0.5 + 0.5 * p.x / R);
  vec2 n2 = normalize(p + 1e-5);
  float hl = exp(-abs(r - R * 0.92) * 70.0) * smoothstep(0.35, 0.95, dot(n2, normalize(vec2(-0.55, 0.8))));
  vec3 glass = rimC * fres * (0.5 + 0.3 * uGlow) + vec3(1.0) * hl * 0.3 + uColorA * 0.08 * exp(-length(p - c) * 4.0);
  vec4 col = vec4(uColorB * 0.035 * inside, inside * 0.8);
  col = addLight(col, (acc + glass) * inside);
  col = addLight(col, rimC * exp(-abs(r - R) * 160.0) * 0.35);
  col = addLight(col, uColorB * halo(r, R) * smoothstep(R * 0.97, R * 1.05, r) * (0.05 + 0.2 * uGlow + 0.3 * lvl));
  return col;
}`,
};
