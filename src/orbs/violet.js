// Ref: fixed ring with a crisp white inner edge; wide translucent ribbons tilted in 3D
// precess around it like a spinning coin; huge faint aura.
export default {
  id: 'violet',
  name: 'Violet Ring',
  description: 'Crisp ring orbited by translucent ribbons precessing in 3D.',
  tags: ['ring', 'glow'],
  defaults: { colorA: '#9b5cff', colorB: '#5a1fd1', colorC: '#f4ecff', glow: 0.7, detail: 0.5 },
  labels: { detail: 'Ribbon tilt' },
  frag: /* glsl */ `
vec4 orb(vec2 p){
  float t = uTime;
  float r = length(p);
  float R = 0.42 + 0.025 * uBass;
  vec3 acc = vec3(0.0);
  // main ring: white inner edge fading to violet outwards
  float din = r - R;
  acc += uColorC * exp(-abs(din) * 160.0) * 1.3;
  acc += uColorA * smoothstep(-0.01, 0.0, din) * exp(-max(din, 0.0) * 22.0) * 0.75;
  acc += uColorA * exp(-abs(din) * 12.0) * 0.18;
  // precessing ribbons (tilted ellipses)
  for (int i = 0; i < 2; i++) {
    float fi = float(i);
    float phi = t * (1.6 + 0.5 * fi) + fi * 2.4;
    float tilt = (0.5 + 0.4 * uDetail) + 0.12 * sin(t * 0.9 + fi) + 0.25 * uLevel + 0.15 * uThink;
    vec2 q = rot(phi) * p;
    vec2 c = vec2(0.0, 0.06 + 0.035 * fi + 0.04 * uLevel);
    q -= c;
    q.y /= max(cos(tilt), 0.25);
    float Ri = R + 0.04 + 0.02 * fi + 0.05 * uLevel;
    float d = length(q) - Ri;
    float w = 0.05 + 0.03 * uLevel;
    float band = smoothstep(w, 0.0, abs(d)) ;
    float edge = exp(-abs(abs(d) - w * 0.8) * 90.0);
    float front = 0.45 + 0.55 * smoothstep(-0.3, 0.6, q.y / Ri);
    acc += mix(uColorA, uColorC, 0.25) * (band * 0.5 + edge * 0.55) * front * (0.8 + 0.8 * uLevel);
  }
  float aura = exp(-max(r - R, 0.0) * (3.8 - 2.0 * uGlow)) * smoothstep(R * 0.8, R * 1.05, r);
  acc += uColorB * aura * (0.16 + 0.22 * uGlow + 0.45 * uLevel);
  acc += uColorB * 0.05 * smoothstep(R, 0.0, r);
  vec4 col = glow(acc);
  col = addLight(col, uColorC * thinkArc(p, R) * 1.4);
  col = addLight(col, uColorC * transRing(r, R));
  return col;
}`,
};
