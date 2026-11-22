// Ref: dark liquid blob with cyan fresnel rim, marbled streaks and drifting contour shells.
export default {
  id: 'abyss',
  name: 'Abyss',
  description: 'Dark liquid blob with an electric fresnel rim and marbled streaks.',
  tags: ['raymarch', 'liquid'],
  defaults: { colorA: '#3cc8ff', colorB: '#0a4f8a', colorC: '#d8f6ff', glow: 0.6, detail: 0.45 },
  labels: { detail: 'Deformation' },
  frag: /* glsl */ `
float abyssMap(vec3 q){
  float t = uTime * 0.6;
  float R = 0.56 + 0.05 * uBass;
  float amp = 0.07 + 0.16 * uLevel + 0.04 * uThink + 0.05 * uTrans * sin(uTime * 5.0);
  float k = 1.4 + uDetail * 1.6;
  float n = noise3(q * k + vec3(0.0, t * 0.7, t * 0.4)) - 0.5;
  n += 0.5 * (noise3(q * k * 2.1 - vec3(t * 0.5, 0.0, t * 0.3)) - 0.5);
  return length(q) - R - n * amp * 2.0;
}
vec3 abyssNormal(vec3 q){
  const vec2 e = vec2(0.002, -0.002);
  return normalize(e.xyy * abyssMap(q + e.xyy) + e.yyx * abyssMap(q + e.yyx) +
                   e.yxy * abyssMap(q + e.yxy) + e.xxx * abyssMap(q + e.xxx));
}
vec4 orb(vec2 p){
  float r = length(p);
  float R0 = 0.56 + 0.05 * uBass;
  vec3 ro = vec3(0.0, 0.0, 2.4);
  vec3 rd = normalize(vec3(p, -2.4));
  vec4 col = vec4(0.0);
  float b = dot(ro, rd);
  float h = b * b - (dot(ro, ro) - 1.0);
  float md = 1e3; bool hit = false; float tt = 0.0;
  if (h > 0.0) {
    tt = -b - sqrt(h); float tmax = -b + sqrt(h);
    for (int i = 0; i < 56; i++) {
      float d = abyssMap(ro + rd * tt);
      md = min(md, d);
      if (d < 0.0015) { hit = true; break; }
      tt += d * 0.8;
      if (tt > tmax) break;
    }
  }
  if (hit) {
    vec3 q = ro + rd * tt;
    vec3 n = abyssNormal(q);
    float ndv = max(dot(n, -rd), 0.0);
    float fres = pow(1.0 - ndv, 3.0);
    vec3 sq = q * 2.2 + vec3(0.0, uTime * 0.15, 0.0);
    float m = fbm3(sq + fbm3(sq * 1.3 + uTime * 0.1) * 1.5);
    float streak = pow(1.0 - abs(sin(m * 10.0)), 14.0);
    vec3 L = normalize(vec3(0.4, 0.6, 0.7));
    float spec = pow(max(dot(reflect(rd, n), L), 0.0), 18.0);
    vec3 c = uColorB * (0.035 + 0.09 * (1.0 - ndv));
    c += uColorA * fres * (1.4 + 1.2 * uLevel);
    c += uColorC * spec * 0.35;
    c += uColorA * streak * (0.12 + 0.6 * fres) * (0.6 + uLevel);
    col = vec4(c, 1.0);
  } else {
    col = addLight(col, uColorA * exp(-md * 90.0) * 1.1 + uColorC * exp(-md * 320.0) * 0.8);
  }
  float ang = atan(p.y, p.x); vec2 cs = vec2(cos(ang), sin(ang));
  for (int k = 0; k < 2; k++) {
    float fk = float(k);
    float rr = R0 + 0.01 + (noise3(vec3(cs * 1.6, uTime * 0.35 + fk * 4.0)) - 0.5) * (0.08 + 0.22 * uLevel);
    float side = 0.5 + 0.5 * sin(ang + uTime * 0.4 + fk * 2.5);
    col = addLight(col, uColorA * exp(-abs(r - rr) * 220.0) * side * 0.35);
  }
  col = addLight(col, uColorB * halo(r, R0) * smoothstep(R0 * 0.8, R0 * 1.05, r) * (0.18 + 0.4 * uGlow + 0.6 * uLevel));
  col = addLight(col, uColorC * thinkArc(p, R0 + 0.04) * 1.2);
  col = addLight(col, uColorA * transRing(r, R0));
  return col;
}`,
};
