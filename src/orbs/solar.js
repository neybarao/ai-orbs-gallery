// Ref: braided rim of many fiery strands, thin writhing wire folds inside a dotted mesh,
// star sparks twinkling fast on the rim and at fold crossings.
export default {
  id: 'solar',
  name: 'Solar Mesh',
  description: 'Braided fiery rim, writhing wire folds and twinkling star sparks.',
  tags: ['mesh', 'particles'],
  defaults: { colorA: '#ff4a12', colorB: '#7a0a00', colorC: '#ffd27a', glow: 0.65, detail: 0.5 },
  labels: { detail: 'Fold density' },
  frag: /* glsl */ `
float solarIso(vec3 q, float k){ return exp(-abs(noise3(q) - 0.5) * k); }
vec4 orb(vec2 p){
  float t = uTime * 1.3;
  float r = length(p);
  float R = 0.62 + 0.04 * uBass;
  float ang = atan(p.y, p.x); vec2 cs = vec2(cos(ang), sin(ang));
  vec3 acc = vec3(0.0);
  // braided rim: several noisy strands
  for (int i = 0; i < 7; i++) {
    float fi = float(i);
    float rr = R - 0.06 + fi * 0.018 + (noise3(vec3(cs * 2.6, t * 0.5 + fi * 3.3)) - 0.5) * (0.07 + 0.12 * uLevel);
    float d = abs(r - rr);
    acc += mix(uColorA, uColorC, 0.25) * (exp(-d * 220.0) * 0.7 + exp(-d * 50.0) * 0.12);
  }
  // inner folds (front + back of the shell)
  float z = sqrt(max(R * R - r * r, 0.0));
  float inside = smoothstep(R, R - 0.03, r);
  vec2 dg = fract(p / mix(0.012, 0.008, uDetail)) - 0.5;
  float dots = mix(0.5, smoothstep(0.45, 0.15, length(dg)), smoothstep(2.0, 4.0, 0.01 / PX));
  float sc = 2.0 + uDetail * 2.0;
  float lines = 0.0;
  for (int s = 0; s < 2; s++) {
    vec3 n = vec3(p, s == 0 ? z : -z) / R;
    n.xz = rot(t * 0.15) * n.xz;
    vec3 off = vec3(t * 0.25, t * 0.35, -t * 0.2);
    float l = solarIso(n * sc + off, 40.0) + 0.7 * solarIso(n * sc * 1.7 - off, 55.0);
    lines += l * (s == 0 ? 1.0 : 0.45);
  }
  float limb = pow(1.0 - z / R, 3.0);
  float I = (lines * (0.8 + 1.2 * uLevel) + limb * 0.6) * inside;
  acc += mix(uColorB, uColorA, clamp(I, 0.0, 1.0)) * I * (0.35 + 1.1 * dots);
  // star sparks
  for (int k = 0; k < 10; k++) {
    float fk = float(k);
    float seed = floor(uTime * 0.6 + hash11(fk * 1.3) * 7.0);
    float ak = hash11(fk * 3.7 + seed * 1.91) * 6.2831;
    float rk = k < 6 ? R + (hash11(fk + seed) - 0.5) * 0.06 : R * sqrt(hash11(fk * 7.1 + seed)) * 0.9;
    vec2 P = rk * vec2(cos(ak), sin(ak));
    vec2 d = rot(0.12 * (hash11(fk + 9.0) - 0.5)) * (p - P);
    float tw = pow(abs(sin(uTime * (4.0 + 3.0 * hash11(fk + 2.0)) + fk * 2.0)), 4.0);
    float star = exp(-abs(d.y) * 300.0) * exp(-abs(d.x) * 9.0) + exp(-abs(d.x) * 300.0) * exp(-abs(d.y) * 22.0) * 0.5 + exp(-length(d) * 80.0);
    acc += uColorC * star * tw * (0.5 + 0.5 * uGlow + 0.8 * uLevel);
  }
  vec4 col = glow(acc);
  col = addLight(col, uColorA * halo(r, R) * smoothstep(R * 0.92, R * 1.05, r) * (0.2 + 0.4 * uGlow + 0.6 * uLevel));
  col = addLight(col, uColorC * thinkArc(p, R + 0.03) * 1.2);
  col = addLight(col, uColorA * transRing(r, R));
  return col;
}`,
};
