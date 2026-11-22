// Ref: ribbed crescent of fine lines inside a faint glass sphere; the light stays on one side
// while the dark hole wobbles and swings, like a spinning top.
export default {
  id: 'eclipse',
  name: 'Eclipse',
  description: 'Ribbed crescent inside a glass sphere, its dark core wobbling like a top.',
  tags: ['lines', 'minimal'],
  defaults: { colorA: '#f2f2f2', colorB: '#3a3a3a', colorC: '#ffffff', glow: 0.35, detail: 0.5 },
  labels: { detail: 'Line count' },
  frag: /* glsl */ `
vec4 orb(vec2 p){
  float t = uTime;
  float r = length(p);
  float R = 0.46 + 0.025 * uBass;
  float a0 = PI + 0.55 * sin(t * 1.4) + 0.25 * sin(t * 0.63);
  vec2 dir = vec2(cos(a0), sin(a0));
  float offM = 0.3 + 0.08 * sin(t * 2.1) + 0.1 * uLevel + 0.08 * uThink;
  vec2 sOff = -dir * R * offM;           // hole sits away from the light
  float Rin = R * (0.5 + 0.06 * sin(t * 1.7));
  float k = 0.5;
  for (int i = 0; i < 6; i++) k = (R - length(p - sOff * k)) / (R - Rin);
  float N = mix(18.0, 40.0, uDetail);
  float v = k * N + 0.5 * sin(atan(p.y, p.x) * 3.0 + t * 2.0) * uLevel;
  float fw = max(fwidth(v), 1e-4);
  float lines = 1.0 - smoothstep(0.0, fw * 1.3, abs(fract(v - 0.5) - 0.5));
  float inBand = smoothstep(-0.02, 0.03, k) * smoothstep(1.02, 0.97, k);
  float side = 0.5 + 0.5 * dot(normalize(p + 1e-5), dir);
  float I = inBand * (lines * 0.85 + 0.3) * (0.15 + side * 1.3) * (1.0 - 0.55 * clamp(k, 0.0, 1.0)) * (0.9 + 0.8 * uLevel);
  vec3 acc = mix(uColorB, uColorA, clamp(I, 0.0, 1.0)) * I;
  // glass shell
  float Rg = R * 1.2;
  float shell = smoothstep(Rg + PX, Rg - PX, r);
  float gf = pow(clamp(r / Rg, 0.0, 1.0), 6.0);
  float gside = 0.4 + 0.6 * (0.5 + 0.5 * dot(normalize(p + 1e-5), normalize(vec2(0.6, 0.5))));
  acc += uColorC * shell * (0.025 + gf * 0.12 * gside) + uColorC * exp(-abs(r - Rg) * 120.0) * 0.12 * gside;
  vec4 col = glow(acc);
  col = addLight(col, uColorA * halo(r, Rg) * smoothstep(Rg * 0.95, Rg * 1.05, r) * (0.04 + 0.2 * uGlow + 0.3 * uLevel));
  col = addLight(col, uColorC * thinkArc(p, Rg + 0.02) * 0.8);
  col = addLight(col, uColorC * transRing(r, Rg) * 0.8);
  return col;
}`,
};
