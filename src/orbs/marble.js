// Ref: frosted milky marble with a soft blue-violet ribbon of colour sweeping and twisting
// inside. Light by design (opaque body), it also sits well on dark.
export default {
  id: 'marble',
  name: 'Marble',
  description: 'Frosted milky marble with a soft colour ribbon twisting inside.',
  tags: ['soft', 'light'],
  defaults: { colorA: '#3d6bff', colorB: '#c56cff', colorC: '#f5f1fb', glow: 0.35, detail: 0.4 },
  labels: { detail: 'Sharpness' },
  frag: /* glsl */ `
vec4 orb(vec2 p){
  float t = uTime;
  float r = length(p);
  float R = 0.4 + 0.02 * uBass;
  float soft = mix(0.04, 0.012, uDetail);
  float body = smoothstep(R + soft, R - soft, r);
  float rr = min(r / R, 0.999);
  vec3 n = vec3(p / R, sqrt(1.0 - rr * rr));
  vec3 c = uColorC * (0.92 + 0.08 * n.y);
  // ribbon in 3D: a wavy band around the sphere, seen front and (fainter) back
  for (int s = 0; s < 2; s++) {
    vec3 q = n;
    if (s == 1) q.z = -q.z;
    q.xy = rot(0.35 * sin(t * 0.4)) * q.xy;
    q.xz = rot(t * 0.6) * q.xz;
    float y = q.y - (0.28 + 0.1 * uLevel) * sin(q.x * 2.5 + q.z * 1.5 + t * 0.9) + 0.05;
    float w = mix(0.17, 0.08, uDetail) * (1.0 + 0.8 * uLevel) * (0.7 + 0.5 * (0.5 + 0.5 * q.z));
    float band = exp(-y * y / (w * w));
    vec3 bc = mix(uColorB, uColorA, smoothstep(-0.6, 0.6, q.x));
    float vis = s == 0 ? 1.0 : 0.3;
    c = mix(c, bc, clamp(band * vis * (0.85 + 0.3 * uLevel), 0.0, 1.0));
  }
  // frosted edge: slightly darker lavender rim + soft highlight
  c = mix(c, mix(uColorC, uColorB, 0.25), smoothstep(0.75, 1.0, rr) * 0.35);
  c += vec3(1.0) * pow(max(dot(n, normalize(vec3(-0.4, 0.6, 0.7))), 0.0), 6.0) * 0.08;
  c = min(c, vec3(1.0));
  vec4 col = vec4(c * body, body);
  col = addLight(col, mix(uColorA, uColorB, 0.5) * halo(r, R) * smoothstep(R, R + 0.06, r) * (0.05 + 0.2 * uGlow + 0.3 * uLevel));
  col = addLight(col, uColorA * thinkArc(p, R + 0.05) * 0.9);
  col = addLight(col, uColorB * transRing(r, R));
  return col;
}`,
};
