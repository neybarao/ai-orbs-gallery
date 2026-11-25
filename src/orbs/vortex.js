// Ref: galaxy-like whirl of thin wiggly strands spiralling into a bright point; the arms
// turn slowly and fray at the edges.
export default {
  id: 'vortex',
  name: 'Vortex',
  description: 'Whirl of wiggly strands spiralling into a bright point.',
  tags: ['lines', 'spiral'],
  defaults: { colorA: '#ececec', colorB: '#4d4d4d', colorC: '#ffffff', glow: 0.35, detail: 0.5 },
  labels: { detail: 'Strand count' },
  frag: /* glsl */ `
vec4 orb(vec2 p){
  float t = uTime;
  float r = length(p);
  float a = atan(p.y, p.x);
  float R = 0.42 + 0.03 * uBass;
  float lr = log(max(r, 1e-3));
  float N = floor(mix(14.0, 30.0, uDetail));
  float twist = 2.2 + 0.4 * uLevel;
  float u = a / 6.2831853 + lr * twist / 6.2831853 * 2.0 - t * 0.12;
  float w = fbm3(vec3(p * 5.0, t * 0.5)) - 0.5;
  float v = u * N + w * (2.5 + 2.5 * uLevel) + 0.6 * sin(r * 40.0 - t * 2.0) * 0.15;
  float id = mod(floor(v), N);
  float fv = abs(fract(v) - 0.5);
  float fw = max(fwidth(v), 1e-4);
  float line = 1.0 - smoothstep(0.0, fw * 1.4, fv - 0.02);
  float on = hash11(id * 3.7 + floor(lr * 4.0 + hash11(id) * 4.0) * 1.3);
  float seg = smoothstep(0.25, 0.4, on);
  float fade = smoothstep(R + 0.08, R * 0.6, r) * smoothstep(0.0, 0.05, r);
  float b = mix(0.4, 1.0, hash11(id + 1.7)) * seg * fade;
  vec3 acc = mix(uColorB, uColorA, b) * line * b * (0.8 + 0.6 * uLevel);
  // bright eye
  acc += uColorC * exp(-r * 60.0) * (0.8 + 0.6 * uLevel) + uColorA * exp(-r * 14.0) * (0.06 + 0.1 * uGlow);
  vec4 col = glow(acc);
  col = addLight(col, uColorC * thinkArc(p, R * 0.9));
  col = addLight(col, uColorC * transRing(r, R * 0.8) * 0.8);
  return col;
}`,
};
