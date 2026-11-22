// Ref: ribbed crescent of fine lines wrapping a dark sphere.
export default {
  id: 'eclipse',
  name: 'Eclipse',
  description: 'Ribbed crescent of fine light wrapping a dark sphere.',
  tags: ['lines', 'minimal'],
  defaults: { colorA: '#f2f2f2', colorB: '#3a3a3a', colorC: '#ffffff', glow: 0.35, detail: 0.5 },
  labels: { detail: 'Line count' },
  frag: /* glsl */ `
vec4 orb(vec2 p){
  float t = uTime * 0.4;
  float r = length(p);
  float R = 0.55 + 0.03 * uBass;
  float a0 = t * 0.6 + 2.6;
  vec2 dir = vec2(cos(a0), sin(a0));
  float offM = 0.25 + 0.06 * sin(t * 1.3) + 0.08 * uLevel + 0.06 * uThink;
  vec2 sOff = dir * R * offM;
  float Rin = R * 0.55;
  float k = 0.5;
  for (int i = 0; i < 6; i++) k = (R - length(p - sOff * k)) / (R - Rin);
  float N = mix(18.0, 40.0, uDetail);
  float v = k * N + 0.4 * sin(atan(p.y, p.x) * 3.0 + uTime) * uLevel;
  float fw = max(fwidth(v), 1e-4);
  float lines = 1.0 - smoothstep(0.0, fw * 1.3, abs(fract(v - 0.5) - 0.5));
  float inBand = smoothstep(-0.02, 0.02, k) * smoothstep(1.02, 0.98, k);
  float side = 0.5 + 0.5 * dot(normalize(p + 1e-5), -dir);
  float I = inBand * (lines * 0.9 + 0.25) * (0.25 + side * 1.2) * (1.0 - 0.6 * clamp(k, 0.0, 1.0)) * (0.9 + 0.8 * uLevel);
  vec3 acc = mix(uColorB, uColorA, clamp(I, 0.0, 1.0)) * I;
  float sph = smoothstep(R + PX, R - PX, r);
  acc += uColorB * 0.05 * sph + uColorC * exp(-abs(r - R) * 60.0) * 0.12;
  vec4 col = glow(acc);
  col = addLight(col, uColorA * halo(r, R) * smoothstep(R * 0.9, R * 1.05, r) * (0.06 + 0.25 * uGlow + 0.3 * uLevel));
  col = addLight(col, uColorC * thinkArc(p, R + 0.02));
  col = addLight(col, uColorC * transRing(r, R) * 0.8);
  return col;
}`,
};
