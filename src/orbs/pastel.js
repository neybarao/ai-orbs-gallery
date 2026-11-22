// Ref: soft out-of-focus sphere with drifting pastel gradients.
export default {
  id: 'pastel',
  name: 'Pastel Haze',
  description: 'Soft, out-of-focus sphere of drifting pastel light.',
  tags: ['gradient', 'soft'],
  defaults: { colorA: '#7ff3ff', colorB: '#ff7ac8', colorC: '#b48cff', glow: 0.5, detail: 0.35 },
  labels: { detail: 'Sharpness' },
  frag: /* glsl */ `
vec4 orb(vec2 p){
  float t = uTime * 0.4;
  float r = length(p);
  float R = 0.58 + 0.06 * uLevel + 0.015 * sin(t * 2.0) * uIdle;
  float soft = mix(0.18, 0.05, uDetail);
  float body = smoothstep(R + soft, R - soft * 1.5, r);
  vec2 c1 = vec2(cos(t * 0.9), sin(t * 1.1)) * 0.22 + vec2(0.12, 0.15);
  vec2 c2 = vec2(cos(t * 0.7 + 2.0), sin(t * 0.8 + 1.0)) * 0.25 + vec2(-0.12, -0.2);
  vec2 c3 = vec2(cos(t * 1.3 + 4.0), sin(t * 0.6 + 3.0)) * 0.2;
  float w1 = exp(-dot(p - c1, p - c1) * 6.0);
  float w2 = exp(-dot(p - c2, p - c2) * 6.0);
  float w3 = exp(-dot(p - c3, p - c3) * 8.0) * 0.8;
  vec3 c = (uColorA * w1 + uColorB * w2 + uColorC * w3) / (w1 + w2 + w3 + 0.05);
  float shade = 0.55 + 0.45 * clamp(1.0 - r / R, 0.0, 1.0) + 0.5 * uLevel * w3;
  c *= shade * (0.8 + 0.6 * uLevel);
  c *= 0.9 + 0.2 * noise3(vec3(p * 3.0, t));
  vec4 col = vec4(c * body, body * 0.95);
  col = addLight(col, mix(uColorA, uColorB, 0.5) * halo(r, R) * smoothstep(R * 0.8, R * 1.2, r) * (0.15 + 0.3 * uGlow + 0.4 * uLevel));
  col = addLight(col, mix(uColorA, vec3(1.0), 0.5) * thinkArc(p, R * 0.9) * 0.8);
  col = addLight(col, uColorA * transRing(r, R));
  return col;
}`,
};
