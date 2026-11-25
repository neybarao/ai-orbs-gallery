// Ref (still image, motion invented): frosted icy blob with soft dents and cyan light glowing
// through its thinner spots, inside a hairline ring. The dents slowly drift, the ring breathes.
export default {
  id: 'frost',
  name: 'Frost',
  description: 'Frosted icy blob with drifting dents and cyan light glowing through, in a hairline ring.',
  tags: ['soft', 'light'],
  defaults: { colorA: '#38c6ff', colorB: '#7f8dff', colorC: '#eef2fb', glow: 0.4, detail: 0.5 },
  labels: { detail: 'Dent depth' },
  frag: /* glsl */ `
vec4 orb(vec2 p){
  float t = uTime;
  float r = length(p);
  float a = atan(p.y, p.x);
  vec2 cs = vec2(cos(a), sin(a));
  float R = 0.3 + 0.02 * uBass + 0.025 * (noise3(vec3(cs * 1.6, t * 0.4)) - 0.5) + 0.02 * uLevel * sin(a * 3.0 + t * 3.0);
  float body = smoothstep(R + 0.006, R - 0.006, r);
  float rr = min(r / R, 0.999);
  vec3 n = vec3(p / R, sqrt(1.0 - rr * rr));
  vec3 q = n;
  q.xz = rot(t * 0.25) * q.xz;
  q.xy = rot(t * 0.13) * q.xy;
  float dn = noise3(q * 2.2 + vec3(0.0, 0.0, t * 0.2)) * 0.7 + noise3(q * 4.5 - t * 0.15) * 0.3;
  // fake dent normal from the noise slope
  vec3 e = vec3(0.04, 0.0, 0.0);
  float dx = noise3((q + e.xyy) * 2.2 + vec3(0.0, 0.0, t * 0.2)) - noise3(q * 2.2 + vec3(0.0, 0.0, t * 0.2));
  float dy = noise3((q + e.yxy) * 2.2 + vec3(0.0, 0.0, t * 0.2)) - noise3(q * 2.2 + vec3(0.0, 0.0, t * 0.2));
  vec3 nn = normalize(n + vec3(-dx, -dy, 0.0) * mix(4.0, 14.0, uDetail));
  float lit = 0.72 + 0.28 * dot(nn, normalize(vec3(-0.4, 0.6, 0.7)));
  vec3 c = uColorC * lit;
  // light glowing through thin spots and along the edge
  float glowIn = smoothstep(0.45, 0.8, dn) * (0.4 + 0.6 * rr) * (0.7 + 0.8 * uLevel);
  c = mix(c, uColorA, clamp(glowIn * 0.8, 0.0, 1.0));
  c = mix(c, uColorB, smoothstep(0.55, 0.25, dn) * 0.25);
  c = mix(c, mix(uColorA, uColorB, 0.5), pow(rr, 6.0) * 0.5);
  c += vec3(1.0) * pow(max(dot(reflect(vec3(0.0, 0.0, -1.0), nn), normalize(vec3(-0.5, 0.6, 0.6))), 0.0), 20.0) * 0.25;
  c = min(c, vec3(1.0));
  vec4 col = vec4(c * body, body);
  // hairline ring
  float Rr = 0.47 + 0.012 * sin(t * 0.8) + 0.02 * uLevel;
  float ring = smoothstep(0.0028 + PX, 0.0, abs(r - Rr));
  col = addLight(col, mix(uColorB, uColorA, 0.4) * ring * 0.5);
  col = addLight(col, uColorA * halo(r, R) * smoothstep(R, R + 0.05, r) * (0.06 + 0.25 * uGlow + 0.3 * uLevel));
  col = addLight(col, uColorA * thinkArc(p, Rr) * 0.9);
  col = addLight(col, uColorA * transRing(r, Rr));
  return col;
}`,
};
