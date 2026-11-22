// Ref: translucent white wire mesh shell with wrinkled folds.
export default {
  id: 'wire',
  name: 'Wire Shell',
  description: 'Translucent wire mesh shell with folds that ripple with sound.',
  tags: ['mesh', 'wireframe'],
  defaults: { colorA: '#e8eef5', colorB: '#3b4250', colorC: '#ffffff', glow: 0.35, detail: 0.5 },
  labels: { detail: 'Mesh density' },
  frag: /* glsl */ `
float wireLine(float v){ float fw = max(fwidth(v), 1e-4); return 1.0 - smoothstep(0.0, fw * 1.2, abs(fract(v - 0.5) - 0.5)); }
vec4 orb(vec2 p){
  float t = uTime * 0.5;
  float r = length(p);
  float ang = atan(p.y, p.x); vec2 cs = vec2(cos(ang), sin(ang));
  float R = 0.6 + 0.03 * uBass + (noise3(vec3(cs * 1.8, t)) - 0.5) * (0.04 + 0.12 * uLevel);
  float z = sqrt(max(R * R - r * r, 0.0));
  vec3 acc = vec3(0.0);
  float N = mix(28.0, 60.0, uDetail);
  for (int s = 0; s < 2; s++) {
    float sgn = s == 0 ? 1.0 : -1.0;
    vec3 n = vec3(p, z * sgn) / R;
    n.xz = rot(t * 0.5) * n.xz;
    vec3 off = vec3(0.0, t * 0.5, t * 0.2);
    float rg = fbm3(n * (1.6 + uDetail) + off);
    float ridgeV = pow(1.0 - abs(rg * 2.0 - 1.0), 14.0);
    vec3 w = n + 0.12 * vec3(noise3(n * 3.0 + off) - 0.5, noise3(n * 3.0 + off + 5.0) - 0.5, 0.0);
    float lat = asin(clamp(w.y, -1.0, 1.0)) / PI * N;
    float lon = atan(w.x, w.z) / PI * N;
    float mesh = max(wireLine(lat), wireLine(lon)) * 0.22;
    float limb = pow(1.0 - z / R, 3.0);
    float I = mesh * (0.25 + ridgeV * 1.5 + limb) + ridgeV * (0.7 + 1.4 * uLevel) + limb * 1.2;
    acc += mix(uColorB, uColorA, clamp(I, 0.0, 1.0)) * I * (s == 0 ? 0.75 : 0.3);
  }
  acc *= smoothstep(R + PX, R - PX, r);
  acc += uColorC * exp(-abs(r - R) * 80.0) * (0.9 + uLevel);
  vec4 col = glow(acc);
  col = addLight(col, uColorA * halo(r, R) * smoothstep(R * 0.9, R * 1.05, r) * (0.08 + 0.3 * uGlow + 0.4 * uLevel));
  col = addLight(col, uColorC * thinkArc(p, R + 0.03));
  col = addLight(col, uColorC * transRing(r, R) * 0.8);
  return col;
}`,
};
