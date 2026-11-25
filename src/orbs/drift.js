// Ref: sparse particle sphere seen slightly from above: dense glittering dust on the top cap,
// a faint streaking rim at the bottom and an empty middle. The dust slowly slides downhill.
export default {
  id: 'drift',
  name: 'Drift',
  description: 'Particle bowl seen from above, its dust sliding slowly downhill.',
  tags: ['particles', '3d'],
  defaults: { colorA: '#c9cdd3', colorB: '#3f434a', colorC: '#ffffff', glow: 0.3, detail: 0.6 },
  labels: { detail: 'Particle density' },
  frag: /* glsl */ `
vec4 orb(vec2 p){
  float r = length(p);
  float R = 0.44 + 0.03 * uBass;
  vec3 acc = uColorB * exp(-abs(r - R) * 25.0) * (0.03 + 0.12 * uGlow + 0.15 * uLevel);
  vec4 col = glow(acc);
  col = addLight(col, uColorC * thinkArc(p, R + 0.05));
  col = addLight(col, uColorC * transRing(r, R));
  return col;
}`,
  points: {
    count: 9000,
    vert: /* glsl */ `
void particle(int id, out vec3 pos, out float size, out vec4 col){
  float f = float(id);
  float h1 = hash11(f * 0.731 + 1.3), h2 = hash11(f * 1.371 + 2.1);
  float h3 = hash11(f * 2.113 + 3.7), h4 = hash11(f * 3.707 + 4.9);
  float keep = step(h4, mix(0.35, 1.0, uDetail));
  float t = uTime;
  // latitude slides from the top cap downwards, longitude spins
  float lat = fract(h1 + t * 0.025 * (0.5 + h3));
  float u = 1.0 - 2.0 * pow(lat, 0.8);
  float ph = h2 * 6.2831 + t * (0.2 + 0.3 * h3);
  float s = sqrt(max(1.0 - u * u, 0.0));
  vec3 d = vec3(s * cos(ph), u, s * sin(ph));
  d.yz = rot(-0.5) * d.yz; // tip the top towards the viewer
  float R = 0.44 + 0.03 * uBass;
  float jit = 1.0 + (h3 - 0.5) * 0.05 + 0.07 * uLevel * sin(t * 5.0 + h1 * 40.0);
  pos = d * R * jit;
  float top = smoothstep(-0.25, 0.85, d.y);
  float rim = pow(1.0 - abs(d.z), 4.0) * smoothstep(0.1, -0.7, d.y);
  float tw = 0.6 + 0.4 * sin(t * (2.0 + 3.0 * h2) + h1 * 60.0);
  float b = (0.12 + 1.3 * top * top + 0.8 * rim) * (0.3 + 0.7 * (d.z * 0.5 + 0.5)) * tw * (0.7 + 0.6 * uLevel);
  size = mix(0.006, 0.016, h2 * h2) * keep;
  col = vec4(mix(uColorA, uColorC, h3) * b, b) * keep * 2.2;
}`,
  },
};
