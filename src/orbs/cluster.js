// Ref: compact knot of dark-green glossy blobs squeezed tightly together, separated by deep
// thin creases. The blobs slide over each other while the knot tumbles; upward-facing skin
// mirrors thin horizontal studio stripes (white, cyan, red).
export default {
  id: 'cluster',
  name: 'Cluster',
  description: 'Tight knot of glossy blobs sliding over each other, mirroring studio stripes.',
  tags: ['raymarch', 'dark'],
  defaults: { colorA: '#2fe0cf', colorB: '#ff3b3b', colorC: '#eeeeee', glow: 0.3, detail: 0.5 },
  labels: { detail: 'Blob count' },
  frag: /* glsl */ `
float clK;
mat2 clRa, clRb;
float smin(float a, float b, float k){ float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0); return mix(b, a, h) - k * h * (1.0 - h); }
float clMap(vec3 q){
  float t = uTime;
  float d = length(q * vec3(1.0, 1.08, 1.0)) - 0.27;
  int cnt = int(mix(10.0, 16.0, uDetail));
  float fc = float(cnt);
  for (int i = 0; i < 16; i++) {
    if (i >= cnt) break;
    float fi = float(i);
    // fibonacci directions, each drifting slowly on its own axis
    float u = 1.0 - (fi + 0.5) / fc * 2.0;
    float ph = fi * 2.39996;
    float rr = sqrt(1.0 - u * u);
    vec3 dir = vec3(rr * cos(ph), u, rr * sin(ph));
    dir.xz = rot(0.5 * sin(t * (0.35 + 0.2 * hash11(fi)) + fi)) * dir.xz;
    dir.xy = rot(0.4 * sin(t * (0.3 + 0.2 * hash11(fi + 3.0)) + fi * 1.7)) * dir.xy;
    float rad = 0.21 + 0.03 * sin(t * 0.9 + fi * 2.3) + 0.04 * uLevel * hash11(fi + 9.0);
    float s = mix(0.18, 0.23, hash11(fi * 5.1)) * (1.0 + 0.1 * uBass);
    vec3 o = q - dir * rad;
    // squashed along the radial axis so blobs press into each other
    float sq = length(o - dir * dot(o, dir) * 0.25) - s;
    d = smin(d, sq, clK);
  }
  return d;
}
vec3 clEnv(vec3 rd){
  vec3 sky = uColorC * smoothstep(-0.3, 1.0, rd.y) * 0.6;
  float band = rd.y * 15.0;
  float idx = floor(band);
  float line = smoothstep(0.35, 0.0, abs(fract(band) - 0.5) - 0.12);
  float pick = hash11(idx * 1.7);
  vec3 sc = pick < 0.45 ? uColorC : (pick < 0.75 ? uColorA : uColorB);
  sky += sc * line * smoothstep(0.3, 0.55, rd.y) * smoothstep(0.98, 0.8, rd.y) * 1.3;
  return sky;
}
vec4 orb(vec2 p){
  float t = uTime;
  float r = length(p);
  clK = 0.018 + 0.015 * uLevel;
  clRa = rot(t * 0.35);
  clRb = rot(t * 0.22 + 0.5);
  vec3 ro = vec3(0.0, 0.0, 3.0);
  vec3 rd = normalize(vec3(p, -3.0));
  vec4 col = vec4(0.0);
  float b = dot(ro, rd);
  float disc = b * b - (dot(ro, ro) - 0.62 * 0.62);
  if (disc > 0.0) {
    float tt = -b - sqrt(disc);
    bool hit = false;
    vec3 q;
    for (int i = 0; i < 64; i++) {
      q = ro + rd * tt;
      q.xz = clRa * q.xz; q.yz = clRb * q.yz;
      float d = clMap(q);
      if (d < 0.0008) { hit = true; break; }
      tt += d * 0.85;
      if (tt > 3.7) break;
    }
    if (hit) {
      vec2 e = vec2(0.0012, 0.0);
      vec3 nq = normalize(vec3(clMap(q + e.xyy) - clMap(q - e.xyy), clMap(q + e.yxy) - clMap(q - e.yxy), clMap(q + e.yyx) - clMap(q - e.yyx)));
      vec3 n = nq;
      n.yz = transpose(clRb) * n.yz; n.xz = transpose(clRa) * n.xz;
      vec3 rf = reflect(rd, n);
      float fres = pow(1.0 - max(dot(n, -rd), 0.0), 4.0);
      // deep creases
      float ao = clamp(clMap(q + nq * 0.03) / 0.03, 0.0, 1.0);
      ao *= clamp(clMap(q + nq * 0.08) / 0.08, 0.0, 1.0) * 0.5 + 0.5;
      vec3 base = vec3(0.012, 0.03, 0.022);
      vec3 c = base + clEnv(rf) * mix(0.3, 1.0, fres) * ao;
      c += uColorC * pow(max(dot(rf, normalize(vec3(-0.3, 0.85, 0.4))), 0.0), 80.0) * 0.8 * ao;
      col = vec4(c, 1.0);
    }
  }
  col = addLight(col, uColorC * halo(r, 0.44) * smoothstep(0.4, 0.52, r) * (0.02 + 0.08 * uGlow + 0.1 * uLevel));
  col = addLight(col, uColorA * thinkArc(p, 0.54) * 0.9);
  col = addLight(col, uColorC * transRing(r, 0.48) * 0.6);
  return col;
}`,
};
