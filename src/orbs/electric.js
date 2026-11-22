// Ref: glowing ring crackling with lightning arcs.
export default {
  id: 'electric',
  name: 'Arc Ring',
  description: 'Glowing ring crackling with lightning arcs.',
  tags: ['ring', 'electric'],
  defaults: { colorA: '#4aa8ff', colorB: '#a77bff', colorC: '#d9f1ff', glow: 0.6, detail: 0.5 },
  labels: { detail: 'Jaggedness' },
  frag: /* glsl */ `
vec4 orb(vec2 p){
  float t = uTime;
  float r = length(p);
  float ang = atan(p.y, p.x); vec2 cs = vec2(cos(ang), sin(ang));
  float R = 0.55 + 0.02 * uBass;
  vec3 acc = vec3(0.0);
  float d = abs(r - R);
  acc += uColorC * pow(0.012 / (d + 0.012), 2.0) * 1.1 + uColorA * exp(-d * 14.0) * 0.5;
  for (int i = 0; i < 5; i++) {
    float fi = float(i);
    float step1 = floor(t * (7.0 + fi));
    float rr = R + (fbm3(vec3(cs * 3.0 * (1.0 + uDetail), fi * 10.0 + step1 * 0.37)) - 0.5) * (0.06 + 0.22 * uLevel + 0.04 * uThink);
    float seg = smoothstep(0.35, 0.75, noise3(vec3(cs * 1.5, fi * 5.0 + floor(t * 3.0 + fi) * 0.71)));
    vec3 c = mod(fi, 2.0) < 1.0 ? uColorA : uColorB;
    acc += mix(c, uColorC, 0.4) * exp(-abs(r - rr) * 380.0) * seg * (0.8 + uLevel);
  }
  float kk = floor(t * 2.5);
  float showC = clamp(step(0.6, hash11(kk * 1.7)) + uLevel * 0.8, 0.0, 1.0);
  float cx = (hash11(kk) - 0.5) * 0.5 + (fbm3(vec3(p.y * 6.0, kk, 1.0)) - 0.5) * 0.25;
  acc += uColorC * exp(-abs(p.x - cx) * 300.0) * smoothstep(R, R * 0.5, abs(p.y)) * step(r, R) * showC * 0.7;
  acc += uColorA * 0.07 * smoothstep(R, 0.0, r);
  vec4 col = glow(acc);
  col = addLight(col, uColorA * halo(r, R) * smoothstep(R * 0.9, R * 1.05, r) * (0.2 + 0.4 * uGlow + 0.5 * uLevel));
  col = addLight(col, uColorC * thinkArc(p, R) * 1.3);
  col = addLight(col, uColorC * transRing(r, R));
  return col;
}`,
};
