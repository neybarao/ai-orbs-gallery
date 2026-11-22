// Ref: translucent membrane shell, mirror-symmetric, criss-crossed by soft horizontal creases
// that flow fast; bright arcs top and bottom, small pinched bulges on the equator.
export default {
  id: 'wire',
  name: 'Wire Shell',
  description: 'Mirror-symmetric membrane with flowing horizontal creases.',
  tags: ['mesh', 'membrane'],
  defaults: { colorA: '#e8eef5', colorB: '#3b4250', colorC: '#ffffff', glow: 0.3, detail: 0.5 },
  labels: { detail: 'Crease density' },
  frag: /* glsl */ `
vec4 orb(vec2 p){
  float t = uTime * 1.2;
  vec2 m = vec2(abs(p.x), p.y);           // mirror symmetry
  float r = length(p);
  float ang = atan(m.y, m.x);
  float R = 0.58 + 0.03 * uBass;
  float eq = exp(-pow(m.y / 0.06, 2.0)) * (0.025 + 0.04 * uLevel) * (0.6 + 0.4 * sin(t * 2.0));
  float rimN = (noise3(vec3(cos(ang) * 2.0, sin(ang) * 3.0, t * 0.6)) - 0.5) * (0.035 + 0.1 * uLevel);
  float Re = R + rimN + eq * smoothstep(0.3, 0.6, m.x);
  float z = sqrt(max(Re * Re - r * r, 0.0));
  float inside = smoothstep(Re + PX, Re - PX, r);
  vec3 acc = vec3(0.0);
  float freq = mix(2.0, 4.0, uDetail);
  for (int s = 0; s < 2; s++) {
    vec3 n = vec3(m, s == 0 ? z : -z) / Re;
    vec3 q = vec3(n.x * 1.6, n.y * 5.0, n.z * 1.6) * freq * 0.5;
    vec3 o = vec3(t * 0.35, -t * 0.15, t * 0.25);
    float wv = (noise3(q + o) - 0.5) * 1.8 + (noise3(q * 2.1 - o) - 0.5) * 0.6;
    float f = n.y * mix(3.0, 6.0, uDetail) + wv * (1.0 + 0.8 * uLevel);
    float crease = pow(1.0 - abs(sin(f * PI)), 6.0);
    float crease2 = pow(1.0 - abs(sin((f * 1.7 + 0.3) * PI)), 10.0) * 0.4;
    float limb = pow(1.0 - abs(n.z), 3.0);
    float I = (crease + crease2) * (0.6 + 0.6 * limb + 0.7 * uLevel) + limb * (0.5 + 0.5 * abs(n.y));
    acc += mix(uColorB, uColorA, clamp(I, 0.0, 1.0)) * I * (s == 0 ? 1.0 : 0.45);
  }
  acc *= inside;
  float rimLine = exp(-abs(r - Re) * 110.0) * (0.55 + 0.6 * pow(abs(p.y) / Re, 2.0));
  acc += uColorC * rimLine * (0.9 + uLevel);
  vec4 col = glow(acc);
  col = addLight(col, uColorA * halo(r, Re) * smoothstep(Re * 0.92, Re * 1.05, r) * (0.06 + 0.25 * uGlow + 0.35 * uLevel));
  col = addLight(col, uColorC * thinkArc(p, Re + 0.03));
  col = addLight(col, uColorC * transRing(r, Re) * 0.8);
  return col;
}`,
};
