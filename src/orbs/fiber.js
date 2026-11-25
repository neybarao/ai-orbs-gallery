// Ref: comet-like strands of light racing along great circles on a sphere; the strands
// bunch up into bright caps at the poles.
export default {
  id: 'fiber',
  name: 'Fiber',
  description: 'Comet strands racing around a sphere, bunching into bright polar caps.',
  tags: ['particles', 'lines'],
  defaults: { colorA: '#cfd4da', colorB: '#3a3e44', colorC: '#ffffff', glow: 0.4, detail: 0.6 },
  labels: { detail: 'Strand count' },
  frag: /* glsl */ `
vec4 orb(vec2 p){
  float r = length(p);
  float R = 0.44 + 0.03 * uBass;
  vec3 acc = uColorB * exp(-abs(r - R) * 30.0) * (0.12 + 0.2 * uGlow + 0.2 * uLevel);
  vec4 col = glow(acc);
  col = addLight(col, uColorC * thinkArc(p, R + 0.05));
  col = addLight(col, uColorC * transRing(r, R));
  return col;
}`,
  points: {
    count: 11520,
    vert: /* glsl */ `
void particle(int id, out vec3 pos, out float size, out vec4 col){
  float TL = 72.0;
  float f = float(id);
  float tr = floor(f / TL);
  float k = f - tr * TL;
  float keep = step(hash11(tr * 1.7 + 0.3), mix(0.35, 1.0, uDetail));
  // axes near the equator: circles pass close to the poles
  float u = (hash11(tr * 3.1) * 2.0 - 1.0) * 0.5;
  float ph = hash11(tr * 5.7) * 6.2831;
  float sq = sqrt(1.0 - u * u);
  vec3 ax = vec3(cos(ph) * sq, u, sin(ph) * sq);
  vec3 e1 = normalize(cross(ax, vec3(0.0, 1.0, 0.0)) + vec3(1e-4));
  vec3 e2 = cross(ax, e1);
  float dirS = hash11(tr * 2.2) > 0.5 ? 1.0 : -1.0;
  float sp = (0.35 + hash11(tr * 9.3)) * (1.0 + 0.9 * uLevel) * dirS;
  float head = uTime * sp * 0.8 + hash11(tr * 4.4) * 6.2831;
  float len = mix(0.5, 1.4, hash11(tr * 6.6));
  float ang = head - dirS * (k / TL) * len;
  vec3 d = e1 * cos(ang) + e2 * sin(ang);
  d.xz = rot(uTime * 0.12) * d.xz;
  d.yz = rot(0.3) * d.yz;
  float R = 0.44 + 0.03 * uBass;
  pos = d * R * (1.0 + 0.04 * uLevel * sin(uTime * 7.0 + tr));
  float fall = pow(1.0 - k / TL, 1.6);
  float depth = 0.25 + 0.75 * (d.z * 0.5 + 0.5);
  float pole = 1.0 + 1.5 * smoothstep(0.75, 1.0, abs(d.y));
  float b = fall * depth * pole * (0.55 + 0.5 * uLevel);
  bool isHead = k < 1.0;
  size = (isHead ? 0.022 : 0.011) * keep;
  if (isHead) b *= 1.8;
  col = vec4(mix(uColorA, uColorC, fall) * b, b) * keep;
}`,
  },
};
