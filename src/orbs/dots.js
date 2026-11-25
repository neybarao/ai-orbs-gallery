// Ref: hollow sphere speckled with white dots of mixed sizes; it turns steadily and now
// and then whips around in a quick burst.
export default {
  id: 'dots',
  name: 'Speckle',
  description: 'Hollow sphere of mixed-size dots that turns and whips around in bursts.',
  tags: ['particles', 'minimal'],
  defaults: { colorA: '#ffffff', colorB: '#6b6b6b', colorC: '#ffffff', glow: 0.25, detail: 0.5 },
  labels: { detail: 'Dot count' },
  frag: /* glsl */ `
vec4 orb(vec2 p){
  float r = length(p);
  float R = 0.44 + 0.03 * uBass;
  vec4 col = glow(uColorB * exp(-abs(r - R) * 30.0) * (0.02 + 0.1 * uGlow + 0.12 * uLevel));
  col = addLight(col, uColorC * thinkArc(p, R + 0.05));
  col = addLight(col, uColorC * transRing(r, R));
  return col;
}`,
  points: {
    count: 2200,
    vert: /* glsl */ `
void particle(int id, out vec3 pos, out float size, out vec4 col){
  float f = float(id);
  float h1 = hash11(f * 0.913 + 0.4), h2 = hash11(f * 1.917 + 1.3), h3 = hash11(f * 3.31 + 2.2);
  float keep = step(h3, mix(0.4, 1.0, uDetail));
  float u = h1 * 2.0 - 1.0;
  float ph = h2 * 6.2831;
  float s = sqrt(1.0 - u * u);
  vec3 d = vec3(s * cos(ph), u, s * sin(ph));
  float t = uTime;
  // steady spin plus an eased burst every few seconds
  float cyc = t / 4.0;
  float k = fract(cyc);
  float burst = (floor(cyc) + smoothstep(0.75, 1.0, k)) * 2.2;
  d.xz = rot(t * 0.3 + burst) * d.xz;
  d.xy = rot(0.3 * sin(t * 0.21) + burst * 0.25) * d.xy;
  float R = 0.44 + 0.03 * uBass;
  pos = d * R * (1.0 + 0.06 * uLevel * sin(t * 6.0 + h1 * 30.0));
  float big = pow(hash11(f * 7.7), 6.0);
  size = mix(0.008, 0.032, big) * (1.0 + 0.4 * uLevel * big) * keep;
  float depth = 0.25 + 0.75 * (d.z * 0.5 + 0.5);
  float b = depth * (0.7 + 0.3 * big) * (0.8 + 0.4 * uLevel);
  col = vec4(mix(uColorA, uColorC, big) * b, b) * keep;
}`,
  },
};
