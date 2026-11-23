// Ref: steady double-line ring over a dim sphere; many faint wispy filaments hug the ring
// and flicker, occasionally a thin crack crosses the interior.
export default {
  id: 'electric',
  name: 'Arc Ring',
  description: 'Steady double ring wrapped in faint flickering filaments.',
  tags: ['ring', 'electric'],
  defaults: { colorA: '#4aa8ff', colorB: '#a77bff', colorC: '#dff3ff', glow: 0.6, detail: 0.5 },
  labels: { detail: 'Jaggedness' },
  frag: /* glsl */ `
vec4 orb(vec2 p){
  float t = uTime;
  float r = length(p);
  float ang = atan(p.y, p.x); vec2 cs = vec2(cos(ang), sin(ang));
  float R = 0.55 + 0.015 * uBass;
  vec3 acc = vec3(0.0);
  // double ring
  acc += uColorC * (exp(-abs(r - R) * 220.0) + exp(-abs(r - R + 0.014) * 260.0) * 0.8);
  acc += uColorA * exp(-abs(r - R + 0.007) * 30.0) * 0.45;
  // filaments
  for (int i = 0; i < 9; i++) {
    float fi = float(i);
    float st = floor(t * (2.5 + 0.4 * fi) + fi * 0.37);
    float side = (mod(fi, 2.0) < 1.0 ? 1.0 : -1.0) * (0.012 + 0.006 * fi);
    float rr = R + side + (fbm3(vec3(cs * (2.5 + 2.5 * uDetail), fi * 7.0 + st * 0.53)) - 0.5) * 2.0 * (0.05 + 0.1 * uLevel + 0.03 * uThink);
    float seg = smoothstep(0.35, 0.65, noise3(vec3(cs * 1.3, fi * 4.0 + st * 0.31)));
    vec3 c = mod(fi, 3.0) < 1.0 ? uColorB : uColorA;
    acc += mix(c, uColorC, 0.35) * (exp(-abs(r - rr) * 300.0) + exp(-abs(r - rr) * 60.0) * 0.08) * seg * (0.75 + 0.8 * uLevel);
  }
  // interior crack
  float kk = floor(t * 1.6);
  float showC = clamp(step(0.62, hash11(kk * 1.7)) + uLevel * 0.6, 0.0, 1.0);
  float cx = (hash11(kk) - 0.5) * 0.6 + (fbm3(vec3(p.y * 5.0, kk, 1.0)) - 0.5) * 0.2;
  acc += uColorC * exp(-abs(p.x - cx) * 420.0) * smoothstep(R, R * 0.4, abs(p.y)) * step(r, R) * showC * 0.45;
  // dim sphere body, lighter towards the top
  float body = smoothstep(R, R - 0.01, r);
  acc += mix(uColorA, uColorB, 0.3) * body * (0.05 + 0.06 * smoothstep(-R, R, p.y) + 0.08 * uLevel);
  vec4 col = glow(acc);
  col = addLight(col, uColorA * halo(r, R) * smoothstep(R * 0.92, R * 1.05, r) * (0.2 + 0.4 * uGlow + 0.5 * uLevel));
  col = addLight(col, uColorC * thinkArc(p, R) * 1.3);
  col = addLight(col, uColorC * transRing(r, R));
  return col;
}`,
};
