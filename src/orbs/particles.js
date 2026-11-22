// Ref: dense particle halo around a dark core, scattering outwards.
export default {
  id: 'particles',
  name: 'Stardust',
  description: 'Dense particle halo around a dark core, scattering outwards.',
  tags: ['particles'],
  defaults: { colorA: '#cfd3d8', colorB: '#4a4f57', colorC: '#ffffff', glow: 0.4, detail: 0.5 },
  labels: { detail: 'Particle density' },
  frag: /* glsl */ `
vec4 orb(vec2 p){
  float t = uTime;
  float r = length(p);
  float R = 0.5 + 0.03 * uBass;
  vec3 acc = vec3(0.0);
  for (int l = 0; l < 4; l++) {
    float fl = float(l);
    float cell = mix(0.05, 0.028, uDetail) * (0.4 + 0.25 * fl);
    float sp = (0.04 + 0.03 * fl) * (fl < 2.0 ? 1.0 : -1.0);
    float expand = 1.0 + 0.12 * uLevel * (0.5 + fl * 0.3) + 0.05 * uTrans * sin(t * 3.0);
    vec2 q = rot(t * sp + fl * 1.3) * p / expand;
    vec2 id = floor(q / cell);
    float h = hash31(vec3(id, fl * 17.0));
    vec2 jit = vec2(hash31(vec3(id, fl + 3.1)), hash31(vec3(id, fl + 7.7))) - 0.5;
    vec2 pc = (id + 0.5 + jit * 0.5) * cell;
    float rc = length(pc);
    float dens = exp(-pow((rc - R) / 0.035, 2.0)) * 0.95 + (rc > R ? exp(-(rc - R) * (3.5 - 1.5 * uLevel)) * 0.55 : 0.06);
    if (h < dens) {
      float sz = max(cell * (0.08 + 0.14 * hash31(vec3(id, fl + 1.9))), PX * 0.9);
      float tw = 0.55 + 0.45 * sin(t * 3.0 + h * 40.0);
      float b = smoothstep(sz + PX, sz - PX, length(q - pc)) * tw;
      acc += mix(uColorA, uColorC, h) * b * (0.8 + 0.6 * uLevel);
    }
  }
  acc += uColorA * exp(-abs(r - R) * 30.0) * (0.12 + 0.2 * uLevel);
  vec4 col = glow(acc);
  col = addLight(col, uColorB * halo(r, R) * smoothstep(R * 0.9, R * 1.1, r) * (0.1 + 0.3 * uGlow));
  col = addLight(col, uColorC * thinkArc(p, R) * 1.2);
  col = addLight(col, uColorC * transRing(r, R));
  return col;
}`,
};
