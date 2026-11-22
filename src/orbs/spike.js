// Ref: very dark blob with large undulating lobes travelling around it, covered by a
// regular grid of tiny spikes; lit almost only by a cold backlight on the lower-left rim.
export default {
  id: 'spike',
  name: 'Graphite',
  description: 'Undulating graphite blob with a regular grid of tiny spikes and a cold backlight.',
  tags: ['raymarch', 'texture'],
  defaults: { colorA: '#d5dee8', colorB: '#2c3138', colorC: '#9fb3c8', glow: 0.25, detail: 0.5 },
  labels: { detail: 'Spike density' },
  frag: /* glsl */ `
mat2 spikeR;
float spikeMap(vec3 q){
  q.xz = spikeR * q.xz;
  float t = uTime * 1.1;
  float R = 0.6 + 0.04 * uBass;
  float amp = 0.1 + 0.1 * uLevel + 0.03 * uThink + 0.03 * uTrans * sin(uTime * 4.0);
  float lob = sin(dot(q, vec3(4.2, 1.5, 0.8)) + t) * sin(dot(q, vec3(-1.2, 3.8, 2.2)) - t * 1.3)
            + 0.5 * sin(dot(q, vec3(0.5, -2.0, 4.5)) + t * 0.8);
  float n = noise3(q * 1.6 + vec3(t * 0.4, t * 0.2, 0.0)) - 0.5;
  return length(q) - R - (lob * 0.5 + n) * amp;
}
vec3 spikeNormal(vec3 q){
  const vec2 e = vec2(0.002, -0.002);
  return normalize(e.xyy * spikeMap(q + e.xyy) + e.yyx * spikeMap(q + e.yyx) +
                   e.yxy * spikeMap(q + e.yxy) + e.xxx * spikeMap(q + e.xxx));
}
vec4 orb(vec2 p){
  float r = length(p);
  float R0 = 0.6 + 0.04 * uBass;
  vec3 ro = vec3(0.0, 0.0, 2.4);
  vec3 rd = normalize(vec3(p, -2.4));
  spikeR = rot(uTime * 0.25);
  vec4 col = vec4(0.0);
  float b = dot(ro, rd);
  float h = b * b - (dot(ro, ro) - 0.9);
  float md = 1e3; bool hit = false; float tt = 0.0;
  if (h > 0.0) {
    tt = -b - sqrt(h); float tmax = -b + sqrt(h);
    for (int i = 0; i < 56; i++) {
      float d = spikeMap(ro + rd * tt);
      md = min(md, d);
      if (d < 0.0015) { hit = true; break; }
      tt += d * 0.8;
      if (tt > tmax) break;
    }
  }
  if (hit) {
    vec3 q = ro + rd * tt;
    vec3 n = spikeNormal(q);
    vec3 dir = normalize(vec3(spikeR * q.xz, q.y).xzy);
    // regular spike grid: latitude rows, longitude count scaled by row radius
    float N = mix(30.0, 56.0, uDetail);
    float lat = acos(clamp(dir.y, -1.0, 1.0)) / PI * N;
    float row = floor(lat);
    float ringR = sin((row + 0.5) / N * PI);
    float cnt = max(floor(2.0 * N * ringR), 3.0);
    float lon = (atan(dir.z, dir.x) / 6.2831 + 0.5) * cnt + mod(row, 2.0) * 0.5;
    vec2 f = vec2(fract(lon) - 0.5, fract(lat) - 0.5);
    float l = length(f);
    vec3 tu = normalize(cross(vec3(0.0, 1.0, 0.0), dir) + 1e-4);
    vec3 tv = cross(dir, tu);
    float bump = smoothstep(0.5, 0.05, l);
    vec3 nb = normalize(n + (tu * f.x + tv * f.y) * (2.0 + 2.5 * uLevel) * bump);
    vec3 back = normalize(vec3(-0.75, -0.6, -0.35));
    vec3 key = normalize(vec3(-0.3, 0.7, 0.6));
    float ndv = max(dot(n, -rd), 0.0);
    float fres = pow(1.0 - ndv, 3.0);
    float backlit = pow(max(dot(nb, back) * 0.5 + 0.5, 0.0), 6.0) * fres;
    float spec = pow(max(dot(reflect(rd, nb), key), 0.0), 28.0) * bump;
    vec3 c = uColorB * (0.06 + 0.35 * max(dot(nb, key), 0.0));
    c += uColorC * smoothstep(0.22, 0.0, l) * (0.05 + 0.12 * ndv);
    c += uColorA * backlit * (1.6 + 1.2 * uLevel);
    c += uColorC * spec * 0.5;
    c += uColorC * fres * 0.08;
    float bl = pow(max(dot(n, normalize(vec3(-0.7, -0.7, 0.15))), 0.0), 2.0) * pow(1.0 - ndv, 1.5);
    c += uColorA * bl * (0.9 + 0.8 * uLevel) * (0.6 + 0.6 * bump);
    col = vec4(c, 1.0);
  } else {
    col = addLight(col, uColorC * exp(-md * 150.0) * 0.25);
  }
  col = addLight(col, uColorC * halo(r, R0) * smoothstep(R0 * 0.92, R0 * 1.05, r) * (0.05 + 0.25 * uGlow + 0.3 * uLevel));
  col = addLight(col, uColorA * thinkArc(p, R0 + 0.06));
  col = addLight(col, uColorA * transRing(r, R0) * 0.8);
  return col;
}`,
};
