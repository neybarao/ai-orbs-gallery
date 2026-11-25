// Ref: knot of glossy black metaballs that shuffle and roll as a whole; their mirror skin
// reflects thin coloured studio stripes.
export default {
  id: 'cluster',
  name: 'Cluster',
  description: 'Knot of glossy black blobs that shuffle around, mirroring coloured stripes.',
  tags: ['raymarch', 'dark'],
  defaults: { colorA: '#2ce0d2', colorB: '#ff3d3d', colorC: '#e9e9ea', glow: 0.3, detail: 0.5 },
  labels: { detail: 'Blob count' },
  frag: /* glsl */ `
float clK;
float smin(float a, float b, float k){ float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0); return mix(b, a, h) - k * h * (1.0 - h); }
float clMap(vec3 q){
  float t = uTime;
  float d = length(q) - 0.2;
  int cnt = int(mix(8.0, 14.0, uDetail));
  for (int i = 0; i < 14; i++) {
    if (i >= cnt) break;
    float fi = float(i);
    float u = hash11(fi * 3.17 + 1.0) * 2.0 - 1.0;
    float ph = hash11(fi * 7.31 + 2.0) * 6.2831;
    float rr = sqrt(1.0 - u * u);
    vec3 dir = vec3(rr * cos(ph), u, rr * sin(ph));
    dir.xy = rot(0.5 * sin(t * 0.5 + fi)) * dir.xy;
    float rad = 0.25 + 0.04 * sin(t * (0.8 + 0.3 * hash11(fi)) + fi * 2.0) + 0.05 * uLevel * hash11(fi + 9.0);
    float s = mix(0.12, 0.17, hash11(fi * 5.1)) * (1.0 + 0.15 * uBass);
    d = smin(d, length(q - dir * rad) - s, clK);
  }
  return d;
}
vec3 clEnv(vec3 rd){
  float y = rd.y;
  vec3 sky = uColorC * smoothstep(-0.2, 0.8, y);
  float st = smoothstep(0.85, 1.0, sin(y * 34.0 + rd.x * 2.0));
  float pick = sin(floor(y * 34.0 / 6.2831 + 0.5) * 2.7);
  sky += mix(uColorA, uColorB, step(0.4, pick)) * st * smoothstep(-0.3, 0.3, y) * 1.4;
  return sky;
}
vec4 orb(vec2 p){
  float t = uTime;
  float r = length(p);
  clK = 0.045 + 0.025 * uLevel;
  vec3 ro = vec3(0.0, 0.0, 3.0);
  vec3 rd = normalize(vec3(p, -3.0));
  mat2 ra = rot(t * 0.4), rb = rot(t * 0.27 + 0.4);
  vec4 col = vec4(0.0);
  float b = dot(ro, rd);
  float disc = b * b - (dot(ro, ro) - 0.6 * 0.6);
  if (disc > 0.0) {
    float tt = -b - sqrt(disc);
    bool hit = false;
    vec3 q;
    for (int i = 0; i < 64; i++) {
      q = ro + rd * tt;
      q.xz = ra * q.xz; q.yz = rb * q.yz;
      float d = clMap(q);
      if (d < 0.001) { hit = true; break; }
      tt += d * 0.9;
      if (tt > 3.7) break;
    }
    if (hit) {
      vec2 e = vec2(0.0015, 0.0);
      vec3 nq = normalize(vec3(clMap(q + e.xyy) - clMap(q - e.xyy), clMap(q + e.yxy) - clMap(q - e.yxy), clMap(q + e.yyx) - clMap(q - e.yyx)));
      vec3 n = nq;
      n.yz = transpose(rb) * n.yz; n.xz = transpose(ra) * n.xz;
      vec3 rf = reflect(rd, n);
      float fres = 0.04 + 0.96 * pow(1.0 - max(dot(n, -rd), 0.0), 5.0);
      // crevices darker
      float ao = clamp(clMap(q + nq * 0.04) / 0.04, 0.0, 1.0);
      vec3 c = vec3(0.012) + clEnv(rf) * mix(0.2, 1.0, fres) * (0.35 + 0.65 * ao);
      c += uColorC * pow(max(dot(rf, normalize(vec3(-0.4, 0.8, 0.5))), 0.0), 60.0) * 0.9;
      col = vec4(c, 1.0);
    }
  }
  col = addLight(col, uColorC * halo(r, 0.42) * smoothstep(0.38, 0.5, r) * (0.02 + 0.08 * uGlow + 0.1 * uLevel));
  col = addLight(col, uColorA * thinkArc(p, 0.52) * 0.9);
  col = addLight(col, uColorC * transRing(r, 0.46) * 0.6);
  return col;
}`,
};
