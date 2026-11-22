// Ref: fiery dotted mesh sphere with wrinkled folds and lens-flare spikes on the limb.
export default {
  id: 'solar',
  name: 'Solar Mesh',
  description: 'Fiery dotted mesh with wrinkled folds and flares on the limb.',
  tags: ['mesh', 'particles'],
  defaults: { colorA: '#ff4a12', colorB: '#7a0a00', colorC: '#ffd27a', glow: 0.65, detail: 0.5 },
  labels: { detail: 'Mesh density' },
  frag: /* glsl */ `
float solarRidge(vec3 q){ float n = fbm3(q); return 1.0 - abs(n * 2.0 - 1.0); }
vec4 orb(vec2 p){
  float t = uTime * 0.5;
  float r = length(p);
  float R = 0.64 + 0.04 * uBass;
  float ang = atan(p.y, p.x); vec2 cs = vec2(cos(ang), sin(ang));
  float Re = R + (noise3(vec3(cs * 2.0, t * 0.8)) - 0.5) * (0.03 + 0.1 * uLevel);
  vec3 acc = vec3(0.0);
  float cell = mix(0.016, 0.009, uDetail);
  vec2 gp = p + 0.015 * vec2(noise3(vec3(p * 6.0, t)), noise3(vec3(p * 6.0 + 7.0, t)));
  vec2 f = fract(gp / cell) - 0.5;
  float dotm = smoothstep(0.42, 0.18, length(f));
  dotm = mix(0.35, dotm, smoothstep(2.0, 4.0, cell / PX));
  float z = sqrt(max(Re * Re - r * r, 0.0));
  vec3 nf = vec3(p, z) / Re, nb = vec3(p, -z) / Re;
  mat2 m = rot(t * 0.4);
  nf.xz = m * nf.xz; nb.xz = m * nb.xz;
  float sc = 1.8 + uDetail * 1.5;
  vec3 off = vec3(0.0, t * 0.6, t * 0.3);
  float ff = pow(solarRidge(nf * sc + off), 12.0);
  float fb = pow(solarRidge(nb * sc + off), 12.0) * 0.5;
  float limb = pow(1.0 - z / Re, 2.5);
  float I = (ff + fb) * (0.9 + 1.5 * uLevel) + limb * 1.1 + 0.03;
  float edge = smoothstep(Re + PX, Re - PX, r);
  vec3 c = mix(uColorB * 0.6, uColorA, clamp(I, 0.0, 1.0));
  c = mix(c, uColorC, clamp(I - 0.9, 0.0, 1.0));
  acc += c * I * (dotm * 1.5 + 0.12) * edge;
  acc += mix(uColorA, uColorC, 0.4) * exp(-abs(r - Re) * 55.0) * (0.9 + 0.8 * uLevel);
  for (int k = 0; k < 5; k++) {
    float fk = float(k);
    float ak = hash11(fk * 3.7 + 1.0) * 6.2831 + uTime * 0.05 * (hash11(fk) - 0.5);
    vec2 P = (Re + 0.005) * vec2(cos(ak), sin(ak));
    vec2 d = rot(-0.15 + 0.3 * hash11(fk + 9.0)) * (p - P);
    float fl = exp(-abs(d.y) * 260.0) * exp(-abs(d.x) * (7.0 - 3.0 * uLevel)) + exp(-length(d) * 60.0) * 0.6;
    float flick = 0.4 + 0.6 * abs(sin(uTime * (0.7 + hash11(fk + 2.0)) * 1.5 + fk * 2.0));
    acc += uColorC * fl * flick * (0.35 + 0.6 * uGlow + 0.8 * uLevel);
  }
  vec4 col = glow(acc);
  col = addLight(col, uColorA * halo(r, Re) * smoothstep(Re * 0.9, Re * 1.05, r) * (0.25 + 0.45 * uGlow + 0.6 * uLevel));
  col = addLight(col, uColorC * thinkArc(p, Re + 0.03) * 1.2);
  col = addLight(col, uColorA * transRing(r, Re));
  return col;
}`,
};
