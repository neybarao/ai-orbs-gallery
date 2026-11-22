// Ref: dark liquid blob tumbling in 3D. Thin electric fresnel lines follow every lump,
// back-side folds show through, marbled reflections ride on the surface.
export default {
  id: 'abyss',
  name: 'Abyss',
  description: 'Tumbling liquid blob with thin electric rims and see-through folds.',
  tags: ['raymarch', 'liquid'],
  defaults: { colorA: '#3cc8ff', colorB: '#0a4f8a', colorC: '#d8f6ff', glow: 0.6, detail: 0.5 },
  labels: { detail: 'Lumpiness' },
  frag: /* glsl */ `
mat3 abyssRot;
float abyssMap(vec3 q){
  q = abyssRot * q;
  float t = uTime * 0.7;
  float R = 0.55 + 0.05 * uBass;
  float amp = 0.085 + 0.13 * uLevel + 0.03 * uThink + 0.05 * uTrans * sin(uTime * 5.0);
  float k = 2.2 + uDetail * 2.0;
  float n = noise3(q * k + vec3(0.0, t * 0.6, t * 0.3)) - 0.5;
  n += 0.45 * (noise3(q * k * 2.0 - vec3(t * 0.4, 0.0, t * 0.5)) - 0.5);
  return length(q) - R - n * amp * 2.2;
}
vec3 abyssNormal(vec3 q){
  const vec2 e = vec2(0.002, -0.002);
  return normalize(e.xyy * abyssMap(q + e.xyy) + e.yyx * abyssMap(q + e.yyx) +
                   e.yxy * abyssMap(q + e.yxy) + e.xxx * abyssMap(q + e.xxx));
}
vec3 abyssShade(vec3 q, vec3 n, vec3 rd, float back){
  float ndv = abs(dot(n, -rd));
  float rim = pow(1.0 - ndv, 6.0) * 2.4 + pow(1.0 - ndv, 2.0) * 0.12;
  vec3 oq = abyssRot * q;
  vec3 sq = oq * 2.6 + vec3(0.0, uTime * 0.12, 0.0);
  float m = fbm3(sq + fbm3(sq * 1.4 + uTime * 0.08) * 1.6);
  float streak = pow(1.0 - abs(sin(m * 9.0)), 16.0) * smoothstep(0.2, 0.8, 1.0 - ndv);
  vec3 L = normalize(vec3(0.5, 0.6, 0.6));
  float spec = pow(max(dot(reflect(rd, n), L), 0.0), 30.0);
  vec3 c = uColorB * 0.03 * (1.0 - back);
  c += uColorA * rim * (1.0 + 1.1 * uLevel) * (1.0 - 0.55 * back);
  c += mix(uColorA, uColorC, 0.4) * streak * 1.0 * (0.6 + uLevel) * (1.0 - 0.6 * back);
  c += uColorC * spec * 0.25 * (1.0 - back);
  return c;
}
vec4 orb(vec2 p){
  float t = uTime;
  float a = t * 0.45, b = t * 0.31;
  mat3 ry = mat3(cos(a), 0.0, -sin(a), 0.0, 1.0, 0.0, sin(a), 0.0, cos(a));
  mat3 rx = mat3(1.0, 0.0, 0.0, 0.0, cos(b), sin(b), 0.0, -sin(b), cos(b));
  abyssRot = ry * rx;
  float r = length(p);
  float R0 = 0.55 + 0.05 * uBass;
  vec3 ro = vec3(0.0, 0.0, 2.4);
  vec3 rd = normalize(vec3(p, -2.4));
  vec4 col = vec4(0.0);
  float bb = dot(ro, rd);
  float h = bb * bb - (dot(ro, ro) - 0.95);
  float md = 1e3; bool hit = false; float tt = 0.0, tmax = 0.0;
  if (h > 0.0) {
    tt = -bb - sqrt(h); tmax = -bb + sqrt(h);
    for (int i = 0; i < 60; i++) {
      float d = abyssMap(ro + rd * tt);
      md = min(md, d);
      if (d < 0.0015) { hit = true; break; }
      tt += d * 0.8;
      if (tt > tmax) break;
    }
  }
  if (hit) {
    vec3 q = ro + rd * tt;
    vec3 c = abyssShade(q, abyssNormal(q), rd, 0.0);
    // march through the blob to the back surface: its rim lines show through
    float t2 = tt + 0.02;
    for (int i = 0; i < 28; i++) {
      float d = -abyssMap(ro + rd * t2);
      if (d < 0.0015) break;
      t2 += max(d * 0.8, 0.004);
    }
    vec3 q2 = ro + rd * t2;
    c += abyssShade(q2, abyssNormal(q2), rd, 1.0);
    col = vec4(c, 1.0);
  } else {
    col = addLight(col, uColorA * exp(-md * 70.0) * 0.9 + uColorC * exp(-md * 400.0) * 0.6);
  }
  col = addLight(col, uColorB * halo(r, R0) * smoothstep(R0 * 0.85, R0 * 1.1, r) * (0.15 + 0.35 * uGlow + 0.5 * uLevel));
  col = addLight(col, uColorC * thinkArc(p, R0 + 0.06) * 1.1);
  col = addLight(col, uColorA * transRing(r, R0));
  return col;
}`,
};
