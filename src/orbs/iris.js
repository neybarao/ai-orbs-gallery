// Ref: glossy magenta/indigo sphere with fluid folds turning inside, wrapped by silky white
// ribbons that drift off the outline, in an indigo haze that rises above it.
export default {
  id: 'iris',
  name: 'Iris',
  description: 'Glossy fluid sphere wrapped in silky ribbons that drift off its outline.',
  tags: ['glass', 'fluid'],
  defaults: { colorA: '#ff6ee8', colorB: '#4a3cff', colorC: '#ffffff', glow: 0.6, detail: 0.5 },
  labels: { detail: 'Ribbon strands' },
  frag: /* glsl */ `
vec4 orb(vec2 p){
  float t = uTime;
  float r = length(p);
  float a = atan(p.y, p.x);
  float R = 0.33 + 0.025 * uBass;
  vec3 acc = vec3(0.0);
  // haze: round glow plus a soft column rising up
  acc += uColorB * exp(-r * 3.2) * (0.35 + 0.3 * uGlow);
  acc += uColorB * exp(-abs(p.x) * 5.0) * smoothstep(0.1, 0.9, p.y) * smoothstep(1.0, 0.5, p.y) * 0.25;
  // body
  float body = smoothstep(R + PX, R - PX, r);
  if (body > 0.0) {
    float rr = min(r / R, 0.999);
    vec3 n = vec3(p / R, sqrt(1.0 - rr * rr));
    vec3 q = n;
    q.xz = rot(t * 0.5) * q.xz;
    q.xy = rot(t * 0.23) * q.xy;
    float f = noise3(q * 1.3 + vec3(0.0, t * 0.25, 0.0)) * 0.65 + noise3(q * 2.6 - vec3(t * 0.2)) * 0.35;
    float fold = 0.5 + 0.5 * sin(f * 9.0 + q.y * 3.0 - t * 0.8 + uLevel * 2.0);
    vec3 c = mix(uColorB, uColorA, smoothstep(0.2, 0.9, fold));
    c = mix(c, mix(uColorA, uColorC, 0.6), smoothstep(0.92, 1.0, fold) * 0.6);
    float light = 0.55 + 0.45 * dot(n, normalize(vec3(-0.4, 0.5, 0.7)));
    c *= light * (0.85 + 0.4 * uLevel);
    c += uColorC * pow(max(dot(reflect(vec3(0, 0, -1), n), normalize(vec3(-0.5, 0.6, 0.6))), 0.0), 30.0) * 0.8;
    c += uColorA * pow(rr, 6.0) * 0.4;
    acc = mix(acc, c, body);
  }
  // ribbons
  float strands = mix(3.0, 9.0, uDetail);
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    for (int j = 0; j < 9; j++) {
      float fj = float(j);
      if (fj >= strands) break;
      float o = fj / strands;
      float rr = R * 1.06
        + (0.03 + 0.04 * uLevel) * sin(2.0 * a + t * (1.1 + 0.3 * fi) + fi * 2.1 + o * 0.6)
        + 0.022 * sin(3.0 * a - t * (0.8 + 0.2 * fi) + fi * 4.0 + o * 1.4)
        + 0.012 * sin(5.0 * a + t * 1.7 + fi);
      float d = abs(r - rr);
      float w = 0.0022 + 0.0018 * (1.0 - o);
      float vis = 0.45 + 0.55 * sin(a + t * 0.6 + fi * 2.0);
      acc += uColorC * smoothstep(w + PX, 0.0, d) * vis * (0.55 / sqrt(strands)) * 1.6;
      acc += mix(uColorA, uColorB, 0.5) * exp(-d * 60.0) * vis * 0.05;
    }
  }
  vec4 col = vec4(acc, max(body, clamp(lum(acc), 0.0, 1.0)));
  col = addLight(col, mix(uColorB, uColorA, 0.4) * halo(r, R) * smoothstep(R, R + 0.04, r) * (0.1 + 0.3 * uGlow + 0.35 * uLevel));
  col = addLight(col, uColorC * thinkArc(p, R + 0.06));
  col = addLight(col, uColorA * transRing(r, R));
  return col;
}`,
};
