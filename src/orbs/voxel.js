// Ref: lumpy sphere built from extruded square pins; patches of pins rise and fall while it
// tumbles, lit warm from the side (raymarched, no floor).
export default {
  id: 'voxel',
  name: 'Voxel',
  description: 'Tumbling sphere of square pins that rise and sink in rolling patches.',
  tags: ['raymarch', '3d'],
  defaults: { colorA: '#3aa39e', colorB: '#0b2425', colorC: '#ffc08a', glow: 0.3, detail: 0.5 },
  labels: { detail: 'Pin density' },
  frag: /* glsl */ `
float vxN;
vec3 vxCell(vec3 q, out vec2 f){
  vec3 a = abs(q);
  vec2 uv; vec3 n;
  if (a.x >= a.y && a.x >= a.z) uv = q.yz / a.x;
  else if (a.y >= a.z) uv = q.xz / a.y;
  else uv = q.xy / a.z;
  vec2 g = uv * vxN;
  vec2 c = (floor(g) + 0.5) / vxN;
  f = fract(g);
  if (a.x >= a.y && a.x >= a.z) n = vec3(sign(q.x), c);
  else if (a.y >= a.z) n = vec3(c.x, sign(q.y), c.y);
  else n = vec3(c, sign(q.z));
  return normalize(n);
}
float vxH(vec3 cd){
  float h = noise3(cd * 2.3 + vec3(0.0, uTime * 0.45, uTime * 0.2));
  h = smoothstep(0.4, 0.8, h);
  return 0.012 + h * (0.09 + 0.12 * uLevel + 0.03 * uBass);
}
float vxMap(vec3 q, out float hgt, out float gap){
  vec2 f;
  vec3 cd = vxCell(q, f);
  hgt = vxH(cd);
  float e = max(abs(f.x - 0.5), abs(f.y - 0.5));
  gap = smoothstep(0.36, 0.44, e);
  return length(q) - (0.39 + hgt - gap * (hgt * 0.7 + 0.01));
}
vec3 vxRot(vec3 q){
  float t = uTime;
  q.xz = rot(t * 0.35) * q.xz;
  q.yz = rot(0.5 + 0.25 * sin(t * 0.3)) * q.yz;
  return q;
}
vec4 orb(vec2 p){
  vxN = floor(mix(7.0, 13.0, uDetail));
  float r = length(p);
  vec3 ro = vec3(0.0, 0.0, 3.0);
  vec3 rd = normalize(vec3(p, -3.0));
  vec4 col = vec4(0.0);
  // bounding sphere
  float b = dot(ro, rd);
  float c = dot(ro, ro) - 0.6 * 0.6;
  float disc = b * b - c;
  if (disc > 0.0) {
    float tt = -b - sqrt(disc);
    float hgt = 0.0, gap = 0.0;
    bool hit = false;
    for (int i = 0; i < 72; i++) {
      vec3 q = vxRot(ro + rd * tt);
      float d = vxMap(q, hgt, gap);
      if (d < 0.0015) { hit = true; break; }
      tt += max(d * 0.45, 0.003);
      if (tt > 3.7) break;
    }
    if (hit) {
      vec3 pos = ro + rd * tt;
      vec3 q = vxRot(pos);
      vec2 e = vec2(0.003, 0.0);
      float h1, g1;
      vec3 nq = normalize(vec3(
        vxMap(q + e.xyy, h1, g1) - vxMap(q - e.xyy, h1, g1),
        vxMap(q + e.yxy, h1, g1) - vxMap(q - e.yxy, h1, g1),
        vxMap(q + e.yyx, h1, g1) - vxMap(q - e.yyx, h1, g1)));
      // back to view space
      vec3 n = nq;
      n.yz = rot(-(0.5 + 0.25 * sin(uTime * 0.3))) * n.yz;
      n.xz = rot(-uTime * 0.35) * n.xz;
      vec3 L = normalize(vec3(-0.6, 0.65, 0.55));
      float dif = max(dot(n, L), 0.0);
      float ao = mix(0.35, 1.0, smoothstep(0.0, 0.15, hgt)) * (1.0 - 0.6 * gap);
      vec3 base = mix(uColorB, uColorA, 0.35 + 0.65 * smoothstep(0.0, 0.18, hgt));
      vec3 sh = base * (0.4 + 1.5 * dif * mix(vec3(1.0), uColorC, 0.6)) * ao;
      sh += uColorC * pow(max(dot(reflect(rd, n), L), 0.0), 24.0) * 0.25 * (1.0 - gap);
      sh += uColorA * pow(1.0 - max(dot(n, -rd), 0.0), 3.0) * (0.15 + 0.3 * uGlow);
      col = vec4(sh, 1.0);
    }
  }
  col = addLight(col, uColorA * halo(r, 0.48) * smoothstep(0.44, 0.52, r) * (0.03 + 0.15 * uGlow + 0.2 * uLevel));
  col = addLight(col, uColorC * thinkArc(p, 0.56) * 0.8);
  col = addLight(col, uColorC * transRing(r, 0.5) * 0.7);
  return col;
}`,
};
