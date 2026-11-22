// Ref: dark graphite blob covered in tiny spikes, softly lit.
export default {
  id: 'spike',
  name: 'Graphite',
  description: 'Graphite blob covered in tiny spikes that bristle with sound.',
  tags: ['raymarch', 'texture'],
  defaults: { colorA: '#cfd6dd', colorB: '#3a3f46', colorC: '#9aa7b5', glow: 0.25, detail: 0.5 },
  labels: { detail: 'Spike density' },
  frag: /* glsl */ `
float spikeMap(vec3 q){
  float t = uTime * 0.5;
  float R = 0.6 + 0.04 * uBass;
  float amp = 0.05 + 0.12 * uLevel + 0.03 * uThink + 0.03 * uTrans * sin(uTime * 4.0);
  float n = noise3(q * 1.8 + vec3(t * 0.6, t * 0.3, 0.0)) - 0.5;
  n += 0.5 * (noise3(q * 3.6 - t * 0.4) - 0.5);
  return length(q) - R - n * amp * 2.0;
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
  float a = uTime * 0.2;
  ro.xz = rot(a) * ro.xz; rd.xz = rot(a) * rd.xz;
  vec4 col = vec4(0.0);
  float b = dot(ro, rd);
  float h = b * b - (dot(ro, ro) - 1.0);
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
    float freq = mix(18.0, 34.0, uDetail);
    vec3 cellv = fract(q * freq) - 0.5;
    vec3 tv = cellv - n * dot(cellv, n);
    float l = length(tv);
    float bump = smoothstep(0.5, 0.0, l);
    vec3 nb = normalize(n + tv * (1.6 + 2.5 * uLevel) * bump);
    vec3 L = normalize(vec3(-0.5, 0.6, 0.6));
    float dif = max(dot(nb, L), 0.0);
    float spec = pow(max(dot(reflect(rd, nb), L), 0.0), 24.0);
    float fres = pow(1.0 - max(dot(n, -rd), 0.0), 2.5);
    vec3 c = uColorB * (0.05 + 0.3 * dif);
    c += uColorA * spec * 0.6 * bump;
    c += uColorC * fres * 0.35 * (1.0 + uLevel);
    c += uColorA * smoothstep(0.12, 0.0, l) * 0.2 * (0.4 + dif);
    col = vec4(c, 1.0);
  } else {
    col = addLight(col, uColorC * exp(-md * 120.0) * 0.35);
  }
  col = addLight(col, uColorC * halo(r, R0) * smoothstep(R0 * 0.9, R0 * 1.05, r) * (0.08 + 0.3 * uGlow + 0.3 * uLevel));
  col = addLight(col, uColorA * thinkArc(p, R0 + 0.05));
  col = addLight(col, uColorA * transRing(r, R0) * 0.8);
  return col;
}`,
};
