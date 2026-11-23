// Ref: blurry sphere whose pastel colour zones rotate in 3D, with periodic white blooms.
export default {
  id: 'pastel',
  name: 'Pastel Haze',
  description: 'Blurred sphere of rotating pastel zones that bloom white when it speaks.',
  tags: ['gradient', 'soft'],
  defaults: { colorA: '#7ff3ff', colorB: '#ff7ac8', colorC: '#a98cff', glow: 0.5, detail: 0.3 },
  labels: { detail: 'Sharpness' },
  frag: /* glsl */ `
vec4 orb(vec2 p){
  float t = uTime * 0.45;
  float r = length(p);
  float R = 0.5 + 0.05 * uLevel;
  float soft = mix(0.2, 0.05, uDetail);
  float body = smoothstep(R + soft, R - soft * 1.2, r);
  float rr = min(r / (R + soft * 0.5), 0.999);
  vec3 n = vec3(p / (R + soft * 0.5), sqrt(1.0 - rr * rr));
  float a = t * 1.1, b = t * 0.7;
  n.xz = rot(a) * n.xz; n.yz = rot(b) * n.yz; n.xy = rot(t * 0.4) * n.xy;
  float wA = exp(dot(n, vec3(0.0, 1.0, 0.0)) * 6.0);
  float wB = exp(dot(n, normalize(vec3(0.9, -0.5, 0.0))) * 6.0);
  float wC = exp(dot(n, normalize(vec3(-0.8, -0.4, 0.5))) * 6.0) * 0.8;
  vec3 c = (uColorA * wA + uColorB * wB + uColorC * wC) / (wA + wB + wC);
  // white bloom: driven by voice, plus a slow breath when idle
  float breath = pow(0.5 + 0.5 * sin(uTime * 0.75), 12.0) * uIdle;
  float bloom = clamp(uLevel * 1.3 + breath * 0.8 + 0.3 * uThink * (0.5 + 0.5 * sin(uTime * 3.0)), 0.0, 1.2);
  float core = exp(-r * r / max(0.02 + 0.12 * bloom, 1e-3));
  c = mix(c, vec3(1.0), clamp(core * bloom, 0.0, 1.0));
  c *= 0.75 + 0.25 * (1.0 - rr) + 0.2 * bloom;
  vec4 col = vec4(c * body, body);
  col = addLight(col, mix(uColorA, uColorB, 0.5) * halo(r, R) * smoothstep(R * 0.8, R * 1.3, r) * (0.12 + 0.25 * uGlow + 0.4 * uLevel));
  col = addLight(col, uColorA * transRing(r, R + soft * 0.5));
  return col;
}`,
};
