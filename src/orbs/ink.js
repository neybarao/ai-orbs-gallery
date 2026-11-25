// Ref: glossy black blob made of swirling brush-stroke flaps; it swells and shrinks while
// the strokes churn around it. Dark on purpose: a cold rim light keeps it readable on dark.
export default {
  id: 'ink',
  name: 'Ink',
  description: 'Glossy black blob of churning brush strokes that swells as it speaks.',
  tags: ['raymarch', 'dark'],
  defaults: { colorA: '#1a1a1d', colorB: '#050506', colorC: '#ffffff', glow: 0.35, detail: 0.5 },
  labels: { detail: 'Stroke roughness' },
  frag: /* glsl */ `
float inkR;
float inkMap(vec3 q){
  float t = uTime;
  vec3 dir = normalize(q);
  // twist the strokes around the vertical axis so they read as swirls
  float tw = dir.y * 2.2 + t * 0.6;
  vec3 s = dir;
  s.xz = rot(tw) * s.xz;
  float gate = smoothstep(0.32, 0.75, noise3(dir * 1.7 + vec3(t * 0.3, 0.0, -t * 0.2)));
  float wob = noise3(dir * 3.0 + t * 0.4);
  float th = atan(s.z, s.x);
  float ridge = pow(0.5 + 0.5 * sin(th * mix(5.0, 9.0, uDetail) + s.y * 3.0 + wob * 5.0), 3.0);
  float flap = ridge * gate;
  float amp = 0.05 + 0.07 * uLevel + 0.04 * (0.5 + 0.5 * sin(t * 0.7));
  return (length(q) - inkR - amp * flap) * 0.55;
}
vec4 orb(vec2 p){
  float t = uTime;
  float r = length(p);
  inkR = 0.3 + 0.05 * sin(t * 0.55) + 0.05 * uLevel + 0.02 * uBass;
  vec3 ro = vec3(0.0, 0.0, 3.0);
  vec3 rd = normalize(vec3(p, -3.0));
  vec4 col = vec4(0.0);
  float b = dot(ro, rd);
  float disc = b * b - (dot(ro, ro) - 0.62 * 0.62);
  if (disc > 0.0) {
    float tt = -b - sqrt(disc);
    bool hit = false;
    for (int i = 0; i < 70; i++) {
      float d = inkMap(ro + rd * tt);
      if (d < 0.001) { hit = true; break; }
      tt += max(d, 0.002);
      if (tt > 3.7) break;
    }
    if (hit) {
      vec3 pos = ro + rd * tt;
      vec2 e = vec2(0.002, 0.0);
      vec3 n = normalize(vec3(
        inkMap(pos + e.xyy) - inkMap(pos - e.xyy),
        inkMap(pos + e.yxy) - inkMap(pos - e.yxy),
        inkMap(pos + e.yyx) - inkMap(pos - e.yyx)));
      vec3 rf = reflect(rd, n);
      float fres = pow(1.0 - max(dot(n, -rd), 0.0), 4.0);
      // studio environment: soft box on top, darker floor
      float env = smoothstep(0.1, 0.9, rf.y) * 0.9 + smoothstep(0.95, 0.99, dot(rf, normalize(vec3(-0.5, 0.6, 0.6)))) * 1.4;
      vec3 c = mix(uColorB, uColorA, 0.5 + 0.5 * n.y);
      c += uColorC * env * (0.3 + 0.7 * fres);
      c += uColorC * pow(max(dot(rf, normalize(vec3(0.6, 0.3, 0.7))), 0.0), 40.0) * 0.6;
      c += uColorC * fres * (0.08 + 0.25 * uGlow);
      col = vec4(c, 1.0);
    }
  }
  col = addLight(col, uColorC * halo(r, inkR + 0.08) * smoothstep(inkR, inkR + 0.15, r) * (0.02 + 0.08 * uGlow + 0.1 * uLevel));
  col = addLight(col, uColorC * thinkArc(p, inkR + 0.16) * 0.8);
  col = addLight(col, uColorC * transRing(r, inkR + 0.1) * 0.6);
  return col;
}`,
};
