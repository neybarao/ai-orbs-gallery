// Stardust: thousands of GPU particles on a 3D sphere. Groups of points stream from one
// random pole to the next (poles keep changing), fanning out mid-way and converging again.
// An outer shell of dust pulses, spins and migrates too.
export default {
  id: 'particles',
  name: 'Stardust',
  description: '3D particle sphere whose dust migrates between shifting poles.',
  tags: ['particles', '3d'],
  defaults: { colorA: '#cfd3d8', colorB: '#4a4f57', colorC: '#ffffff', glow: 0.4, detail: 0.6 },
  labels: { detail: 'Particle density' },
  // background pass: faint core haze + state effects (particles are drawn on top)
  frag: /* glsl */ `
vec4 orb(vec2 p){
  float r = length(p);
  float R = 0.46 + 0.03 * uBass;
  vec3 acc = uColorB * exp(-abs(r - R) * 18.0) * (0.06 + 0.2 * uGlow + 0.2 * uLevel);
  acc += uColorB * 0.05 * smoothstep(R, 0.0, r);
  vec4 col = glow(acc);
  col = addLight(col, uColorC * thinkArc(p, R + 0.05));
  col = addLight(col, uColorC * transRing(r, R));
  return col;
}`,
  points: {
    count: 14000,
    vert: /* glsl */ `
vec3 hdir(float s){
  float u = hash11(s) * 2.0 - 1.0;
  float a = hash11(s + 17.3) * 6.2831853;
  float r = sqrt(max(1.0 - u * u, 0.0));
  return vec3(r * cos(a), u, r * sin(a));
}
vec3 slerpDir(vec3 a, vec3 b, float t){
  float c = clamp(dot(a, b), -0.995, 0.995);
  float om = acos(c);
  return normalize(sin((1.0 - t) * om) * a + sin(t * om) * b);
}
void particle(int id, out vec3 pos, out float size, out vec4 col){
  float f = float(id);
  float h1 = hash11(f * 0.7310 + 1.3);
  float h2 = hash11(f * 1.3710 + 2.1);
  float h3 = hash11(f * 2.1130 + 3.7);
  float h4 = hash11(f * 3.7070 + 4.9);
  float h5 = hash11(f * 5.1170 + 6.2);
  bool outer = h5 < 0.38;
  float t = uTime;

  // density control: hide a share of particles
  float keep = step(h4, mix(0.35, 1.0, uDetail));

  // ---- migration between random poles
  float groups = outer ? 9.0 : 12.0;
  float g = floor(h1 * groups) + (outer ? 31.0 : 0.0);
  float period = mix(4.5, 8.0, hash11(g + 0.5));
  float phase = t / period + h2 * 0.9 + hash11(g * 3.1);
  float k = floor(phase);
  float s = fract(phase);
  float e = s * s * (3.0 - 2.0 * s);
  vec3 A = hdir(g * 13.1 + k * 7.77);
  vec3 B = hdir(g * 13.1 + (k + 1.0) * 7.77);
  vec3 dir = slerpDir(A, B, e);
  vec3 T = normalize(cross(A, B) + 1e-4);
  vec3 Bn = normalize(cross(dir, T));
  float fan = sin(PI * s);
  float sp = (h3 - 0.5) * 2.0;
  float spread = sp * abs(sp) * (0.35 + 0.4 * uLevel) * (outer ? 1.8 : 1.0);
  float wob = (hash11(f * 9.13) - 0.5) * 0.12;
  dir = normalize(dir + (T * spread + Bn * wob) * fan);

  // a share of the points stay put so the sphere always reads
  bool settled = outer ? h3 > 0.5 : h3 > 0.55;
  if (settled) dir = hdir(f * 0.37 + 11.0);

  // global spin, slight tilt
  dir.xz = rot(t * 0.12) * dir.xz;
  dir.yz = rot(0.35) * dir.yz;

  // ---- radius
  float R = 0.46 + 0.03 * uBass;
  float rad;
  if (outer) {
    float shell = 1.12 + 0.9 * pow(hash11(f * 7.7), 1.8);
    float pulse = 1.0 + (0.05 + 0.22 * uLevel) * sin(t * 2.1 + h2 * 6.2831) + 0.08 * uTrans * sin(t * 4.0 + shell * 6.0);
    rad = R * shell * pulse;
    dir.xz = rot(t * (0.08 + 0.12 * h3)) * dir.xz; // outer shells spin faster
  } else {
    rad = R * (1.0 + (h4 - 0.5) * 0.025 + 0.06 * uLevel * sin(t * 6.0 + h1 * 30.0));
  }
  pos = dir * rad;

  // ---- look
  float depth = clamp(dir.z * 0.5 + 0.5, 0.0, 1.0);
  float tw = 0.55 + 0.45 * sin(t * (2.0 + 3.0 * h2) + h1 * 40.0);
  float bright = outer ? (0.45 + 0.4 * tw) * (1.0 - 0.45 * smoothstep(1.2, 2.0, rad / R)) : (0.55 + 0.45 * tw);
  bright *= mix(0.3, 1.0, depth) * (0.85 + 0.6 * uLevel);
  bright *= settled ? 0.6 : (0.9 + 0.6 * fan);
  size = (outer ? mix(0.006, 0.015, h2) : mix(0.006, 0.011, h2)) * keep;
  vec3 c = mix(uColorA, uColorC, h2 * h2);
  col = vec4(c * bright, bright) * keep;
}`,
  },
};
