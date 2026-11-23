// Violet Ring: true 3D rings like a gyroscope. Each ring is a circle in space with its own
// spinning axis, seen in perspective; arcs behind the core dim and thin, arcs in front glow.
export default {
  id: 'violet',
  name: 'Violet Ring',
  description: 'Gyroscope of luminous rings tumbling in 3D around a dark core.',
  tags: ['ring', 'glow', '3d'],
  defaults: { colorA: '#9b5cff', colorB: '#5a1fd1', colorC: '#f4ecff', glow: 0.7, detail: 0.5 },
  labels: { detail: 'Ring tilt' },
  frag: /* glsl */ `
mat3 violetEuler(float a, float b, float c){
  float ca = cos(a), sa = sin(a), cb = cos(b), sb = sin(b), cc = cos(c), sc = sin(c);
  mat3 ry = mat3(ca, 0.0, -sa, 0.0, 1.0, 0.0, sa, 0.0, ca);
  mat3 rx = mat3(1.0, 0.0, 0.0, 0.0, cb, sb, 0.0, -sb, cb);
  mat3 rz = mat3(cc, sc, 0.0, -sc, cc, 0.0, 0.0, 0.0, 1.0);
  return rz * ry * rx;
}
vec3 violetPt(mat3 m, float R, float th){
  vec3 q = m * vec3(R * cos(th), R * sin(th), 0.0);
  return vec3(q.xy * 2.4 / (2.4 - q.z), q.z);
}
// glow of a 3D circle drawn as projected segments; max over segments keeps both
// the front and back arcs and their per-segment depth (no discontinuities)
float violetTube(vec2 p, mat3 m, float R, float w, float wGlow, float glowK, float Rc){
  float best = 0.0;
  vec3 a = violetPt(m, R, 0.0);
  for (int i = 1; i <= 40; i++) {
    vec3 b = violetPt(m, R, float(i) * 0.15707963);
    vec2 ab = b.xy - a.xy;
    float h = clamp(dot(p - a.xy, ab) / max(dot(ab, ab), 1e-6), 0.0, 1.0);
    float d = length(p - a.xy - ab * h);
    float z = mix(a.z, b.z, h);
    float persp = 2.4 / (2.4 - z);
    float front = smoothstep(-R, R, z);
    float occl = z < 0.0 ? mix(1.0, 0.1, smoothstep(Rc + 0.01, Rc - 0.01, length(p))) : 1.0;
    float v = (exp(-d / (w * persp)) + glowK * exp(-d / (wGlow * persp))) * (0.3 + 0.7 * front) * occl;
    best = max(best, v);
    a = b;
  }
  return best;
}
vec4 orb(vec2 p){
  float t = uTime;
  float r = length(p);
  float Rc = 0.3 + 0.02 * uBass;           // dark core radius
  vec3 acc = vec3(0.0);
  float tiltK = 0.7 + 0.6 * uDetail + 0.3 * uLevel;
  for (int i = 0; i < 4; i++) {
    float fi = float(i);
    if (i == 0) {
      float R = 0.42 + 0.025 * uBass;
      mat3 m = violetEuler(0.3 * sin(t * 0.5), 0.25 * sin(t * 0.37) + 0.15, 0.0);
      float w = 0.0045 + 0.006 * uLevel;
      acc += uColorC * violetTube(p, m, R, w, 0.05, 0.0, Rc) * 1.25;
      acc += uColorA * violetTube(p, m, R, 0.035, 0.035, 0.0, Rc) * 0.5;
    } else {
      float R = 0.45 + 0.035 * fi + 0.05 * uLevel * hash11(fi + 2.0);
      float roll = fi == 1.0 ? 0.5 : (fi == 2.0 ? -1.0 : 2.2);
      float tilt = (0.35 + 0.25 * fi) * tiltK;
      mat3 m = violetEuler(t * (0.55 + 0.2 * fi) + fi * 2.1, tilt + 0.2 * sin(t * 0.6 + fi), roll + 0.3 * sin(t * 0.21 + fi));
      vec3 c = mix(uColorA, uColorC, 0.15 + 0.15 * fi);
      float w = 0.012 + 0.012 * uLevel;
      acc += c * violetTube(p, m, R, w, 0.045, 0.25, Rc) * (0.55 + 0.6 * uLevel);
    }
  }
  // dark core with a faint violet limb
  float core = smoothstep(Rc + PX, Rc - PX, r);
  acc += uColorB * exp(-abs(r - Rc) * 40.0) * 0.25;
  float aura = exp(-max(r - 0.42, 0.0) * (3.8 - 2.0 * uGlow)) * smoothstep(0.3, 0.45, r);
  acc += uColorB * aura * (0.12 + 0.2 * uGlow + 0.4 * uLevel);
  vec4 col = vec4(uColorB * 0.03 * core, core * 0.55);
  col = addLight(col, acc);
  col = addLight(col, uColorC * thinkArc(p, 0.42) * 1.3);
  col = addLight(col, uColorC * transRing(r, 0.42));
  return col;
}`,
};
