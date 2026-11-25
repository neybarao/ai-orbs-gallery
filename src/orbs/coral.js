// Ref: dense ball of jagged green crystal ridges, like moss or coral, slowly rolling;
// the ridges sharpen and grow while it speaks (raymarched).
export default {
  id: 'coral',
  name: 'Coral',
  description: 'Rolling ball of jagged crystal ridges that bristle when it speaks.',
  tags: ['raymarch', '3d'],
  defaults: { colorA: '#86d21c', colorB: '#1f4a06', colorC: '#efffc4', glow: 0.3, detail: 0.5 },
  labels: { detail: 'Ridge sharpness' },
  frag: /* glsl */ `
float crH(vec3 dir){
  float t = uTime * 0.25;
  float s = 0.0, a = 0.55, f = 2.2;
  float sharp = mix(1.5, 3.0, uDetail);
  for (int i = 0; i < 3; i++) {
    float n = noise3(dir * f + vec3(t, -t * 0.7, float(i) * 3.7));
    s += a * pow(1.0 - abs(2.0 * n - 1.0), sharp);
    f *= 2.15; a *= 0.5;
  }
  return s;
}
mat2 crA, crB;
float crMap(vec3 q, out float h){
  q.xz = crA * q.xz; q.yz = crB * q.yz;
  h = crH(normalize(q));
  return (length(q) - 0.3 - h * (0.15 + 0.08 * uLevel + 0.02 * uBass)) * 0.45;
}
vec4 orb(vec2 p){
  float t = uTime;
  float r = length(p);
  crA = rot(t * 0.22); crB = rot(0.3 + 0.2 * sin(t * 0.17));
  vec3 ro = vec3(0.0, 0.0, 3.0);
  vec3 rd = normalize(vec3(p, -3.0));
  vec4 col = vec4(0.0);
  float b = dot(ro, rd);
  float disc = b * b - (dot(ro, ro) - 0.6 * 0.6);
  if (disc > 0.0) {
    float tt = -b - sqrt(disc);
    float h = 0.0;
    bool hit = false;
    for (int i = 0; i < 90; i++) {
      float d = crMap(ro + rd * tt, h);
      if (d < 0.0008) { hit = true; break; }
      tt += max(d, 0.0015);
      if (tt > 3.7) break;
    }
    if (hit) {
      vec3 pos = ro + rd * tt;
      vec2 e = vec2(0.002, 0.0);
      float hh;
      vec3 n = normalize(vec3(
        crMap(pos + e.xyy, hh) - crMap(pos - e.xyy, hh),
        crMap(pos + e.yxy, hh) - crMap(pos - e.yxy, hh),
        crMap(pos + e.yyx, hh) - crMap(pos - e.yyx, hh)));
      vec3 L = normalize(vec3(-0.5, 0.7, 0.6));
      float dif = max(dot(n, L), 0.0);
      float ao = smoothstep(0.1, 0.9, h);
      vec3 c = mix(uColorB, uColorA, 0.3 + 0.7 * ao) * (0.3 + 0.95 * dif);
      c += uColorC * pow(max(dot(reflect(rd, n), L), 0.0), 16.0) * 0.25 * ao;
      c += uColorA * pow(1.0 - max(dot(n, -rd), 0.0), 3.0) * (0.1 + 0.25 * uGlow);
      col = vec4(c, 1.0);
    }
  }
  col = addLight(col, uColorA * halo(r, 0.47) * smoothstep(0.43, 0.52, r) * (0.03 + 0.15 * uGlow + 0.25 * uLevel));
  col = addLight(col, uColorC * thinkArc(p, 0.56) * 0.8);
  col = addLight(col, uColorA * transRing(r, 0.5) * 0.7);
  return col;
}`,
};
