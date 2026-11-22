// Ref: luminous ring with swirling offset rings and a deep rippled aura.
export default {
  id: 'violet',
  name: 'Violet Ring',
  description: 'Luminous ring with swirling echoes and a deep rippled aura.',
  tags: ['ring', 'glow'],
  defaults: { colorA: '#9b5cff', colorB: '#5a1fd1', colorC: '#f1e6ff', glow: 0.7, detail: 0.5 },
  labels: { detail: 'Swirl' },
  frag: /* glsl */ `
vec4 orb(vec2 p){
  float t = uTime;
  float r = length(p);
  float R = 0.42 + 0.03 * uBass + 0.008 * sin(t * 1.2) * uIdle;
  vec3 acc = vec3(0.0);
  float d = abs(r - R);
  float w = 0.014 + 0.02 * uLevel;
  acc += uColorC * pow(w / (d + w), 2.0) * 1.2;
  acc += uColorA * exp(-d * 18.0) * 0.55;
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    float a0 = t * (0.5 + 0.25 * fi) + fi * 2.1;
    vec2 off = vec2(cos(a0), sin(a0)) * ((0.03 + 0.03 * fi) * (0.5 + uDetail) + 0.08 * uLevel + 0.04 * uThink);
    float Ri = R + 0.02 + 0.025 * fi + 0.04 * uLevel * hash11(fi + 3.0);
    vec2 q = p - off;
    float di = abs(length(q) - Ri);
    float vis = 0.5 + 0.5 * cos(atan(q.y, q.x) - a0 - 0.6);
    acc += mix(uColorA, uColorB, 0.4 + 0.2 * fi) * exp(-di * (40.0 - fi * 8.0)) * vis * (0.55 - 0.12 * fi) * (1.0 + uLevel);
  }
  float aura = exp(-max(r - R, 0.0) * (4.5 - 2.5 * uGlow)) * smoothstep(R * 0.7, R, r);
  float rip = 0.75 + 0.25 * sin(r * 28.0 - t * 2.0);
  acc += uColorB * aura * rip * (0.18 + 0.25 * uGlow + 0.5 * uLevel);
  acc += uColorB * 0.06 * smoothstep(R, 0.0, r);
  vec4 col = glow(acc);
  col = addLight(col, uColorC * thinkArc(p, R) * 1.4);
  col = addLight(col, uColorC * transRing(r, R));
  return col;
}`,
};
