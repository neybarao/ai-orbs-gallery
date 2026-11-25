// Ref: blue glass sphere with a bright rim; inside, translucent ribbons of smoke fold and
// drift, their edges catching cyan and violet light.
export default {
  id: 'aqua',
  name: 'Aqua',
  description: 'Blue glass sphere with ribbons of smoke folding inside.',
  tags: ['glass', 'wisps'],
  defaults: { colorA: '#59d2ff', colorB: '#8a6cff', colorC: '#dff6ff', glow: 0.55, detail: 0.5 },
  labels: { detail: 'Ribbon count' },
  frag: /* glsl */ `
vec3 aqSheet(vec2 q, float seed){
  float t = uTime;
  vec2 w = q + 0.35 * vec2(noise3(vec3(q * 1.6, t * 0.3 + seed)), noise3(vec3(q * 1.6 + 7.0, t * 0.3 - seed))) - 0.17;
  float v = noise3(vec3(w * mix(1.6, 2.6, uDetail), t * 0.25 + seed * 3.0));
  float s = abs(v - 0.5);
  float th = 0.07 + 0.03 * uLevel;
  float sheet = smoothstep(th, th * 0.3, s);
  float edge = exp(-abs(s - th * 0.85) * 70.0);
  vec3 c = mix(uColorA, uColorB, smoothstep(0.3, 0.7, noise3(vec3(w * 1.2, seed + t * 0.1))));
  float mask = smoothstep(0.28, 0.6, noise3(vec3(q * 0.9 + seed, t * 0.12)));
  return c * (sheet * 0.45 + edge * 1.3) * mask;
}
vec4 orb(vec2 p){
  float t = uTime;
  float r = length(p);
  float R = 0.42 + 0.02 * uBass;
  vec3 acc = vec3(0.0);
  float body = smoothstep(R + PX, R - PX, r);
  if (body > 0.0) {
    float rr = min(r / R, 0.999);
    vec2 q = p / R;
    vec3 c = uColorA * 0.04 + uColorB * 0.03 * (1.0 - rr);
    c += aqSheet(rot(t * 0.07) * q, 0.0) * (0.8 + 0.6 * uLevel);
    c += aqSheet(rot(-t * 0.05) * q * 1.2 + 1.3, 4.1) * 0.7 * (0.8 + 0.6 * uLevel);
    // keep the ribbons inside the glass
    c *= smoothstep(1.0, 0.85, rr);
    c += uColorA * pow(rr, 7.0) * 0.5;
    // sparkles
    vec2 g = p * 90.0;
    float h = hash31(vec3(floor(g), floor(t * 4.0)));
    c += uColorC * step(0.985, h) * smoothstep(0.4, 0.0, length(fract(g) - 0.5)) * 0.5;
    acc = c * body;
  }
  float d = abs(r - R);
  acc += uColorC * smoothstep(0.004 + PX, 0.0, d) * 0.9;
  acc += uColorA * exp(-d * (50.0 - 20.0 * uGlow)) * (0.45 + 0.4 * uLevel);
  vec4 col = vec4(acc, max(body * 0.85, clamp(lum(acc), 0.0, 1.0)));
  col = addLight(col, uColorA * halo(r, R) * smoothstep(R, R + 0.05, r) * (0.06 + 0.25 * uGlow + 0.3 * uLevel));
  col = addLight(col, uColorC * thinkArc(p, R + 0.04));
  col = addLight(col, uColorA * transRing(r, R));
  return col;
}`,
};
