// Ref: dozens of jittery hand-drawn loops piled into a ring around a dark hole; the loops
// flicker and re-draw constantly, frayed outward.
export default {
  id: 'scribble',
  name: 'Scribble',
  description: 'Pile of jittery hand-drawn loops around a dark hole, constantly redrawn.',
  tags: ['lines', 'minimal'],
  defaults: { colorA: '#f2f2f2', colorB: '#5a5a5a', colorC: '#ffffff', glow: 0.3, detail: 0.5 },
  labels: { detail: 'Loop count' },
  frag: /* glsl */ `
vec4 orb(vec2 p){
  float t = uTime;
  float r = length(p);
  float a = atan(p.y, p.x);
  vec2 cs = vec2(cos(a), sin(a));
  float R = 0.27 + 0.02 * uBass;
  float N = floor(mix(14.0, 30.0, uDetail));
  float step8 = floor(t * 8.0);
  vec3 acc = vec3(0.0);
  for (int i = 0; i < 30; i++) {
    float fi = float(i);
    if (fi >= N) break;
    float o = hash11(fi * 1.31 + 0.7);
    float spread = 0.03 + 0.3 * o;
    float seed = fi * 7.13 + step8 * (hash11(fi) > 0.5 ? 1.0 : 0.0) * 0.37;
    float jag = noise3(vec3(cs * 9.0, seed)) - 0.5;
    float wav = noise3(vec3(cs * 2.2, fi * 3.1 + t * 0.6)) - 0.5;
    float rr = R + spread * (0.5 + wav) + jag * (0.02 + 0.03 * o + 0.025 * uLevel) + 0.04 * uLevel * o;
    float d = abs(r - rr);
    float l = smoothstep(0.0022 + PX, 0.0, d);
    float b = mix(1.0, 0.25, o) * (0.6 + 0.4 * noise3(vec3(cs * 3.0, fi + t)));
    acc += mix(uColorB, uColorA, 1.0 - o) * l * b;
  }
  acc *= 0.9;
  acc += uColorA * exp(-abs(r - R - 0.02) * 30.0) * (0.04 + 0.12 * uGlow + 0.15 * uLevel);
  vec4 col = glow(acc);
  col = addLight(col, uColorC * thinkArc(p, R - 0.03) * 1.1);
  col = addLight(col, uColorC * transRing(r, R) * 0.8);
  return col;
}`,
};
