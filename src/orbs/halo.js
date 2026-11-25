// Ref: neon cyan ring; inside, a violet dusty tide hugs the inner edge and sloshes around,
// thickest at the bottom, sprinkled with tiny sparks.
export default {
  id: 'halo',
  name: 'Halo',
  description: 'Neon ring with a dusty violet tide sloshing along its inner edge.',
  tags: ['ring', 'neon'],
  defaults: { colorA: '#1ec8ff', colorB: '#5a2cff', colorC: '#dcfbff', glow: 0.6, detail: 0.5 },
  labels: { detail: 'Dust density' },
  frag: /* glsl */ `
vec4 orb(vec2 p){
  float t = uTime;
  float r = length(p);
  float a = atan(p.y, p.x);
  float R = 0.44 + 0.02 * uBass;
  // the tide gathers on one side and swings like liquid in a bowl
  float sl = -PI * 0.5 + 0.7 * sin(t * 0.9) + 0.3 * sin(t * 0.37 + 1.0);
  float side = 0.5 + 0.5 * cos(a - sl);
  vec2 cs = vec2(cos(a), sin(a));
  float n = fbm3(vec3(cs * 1.8, t * 0.55));
  float n2 = noise3(vec3(cs * 5.0, t * 1.3));
  float depth = (0.02 + 0.17 * side * side + 0.1 * uLevel) * (0.45 + n) + 0.03 * n2 * uLevel;
  float inner = R - r;
  float layer = smoothstep(depth + 0.03, depth - 0.02, inner) * smoothstep(-0.015, 0.01, inner);
  float ridges = 0.5 + 0.5 * sin(inner * 95.0 - t * 2.6 + n * 9.0 + a * 2.0);
  float crest = exp(-abs(inner - depth) * 70.0) * step(0.0, inner);
  // sparks
  float cells = mix(70.0, 140.0, uDetail);
  vec2 g = p * cells;
  vec2 id = floor(g);
  float h = hash31(vec3(id, floor(t * 5.0 + hash31(vec3(id, 3.0)) * 5.0)));
  float spark = step(0.9 - 0.06 * uDetail, h) * smoothstep(0.55, 0.05, length(fract(g) - 0.5));
  vec3 acc = mix(uColorB, uColorA, ridges * 0.45) * layer * (0.25 + 0.45 * ridges) * (0.7 + 0.7 * uLevel);
  acc += mix(uColorB, uColorA, 0.5) * crest * 0.5;
  acc += mix(uColorA, uColorC, h) * spark * layer * (0.9 + uLevel);
  // neon tube
  float d = abs(r - R);
  float w = 0.017 + 0.005 * sin(a * 3.0 + t) + 0.006 * uLevel;
  acc += uColorA * smoothstep(w, w * 0.2, d) * 1.1;
  acc += uColorC * smoothstep(w * 0.5, 0.0, d) * 0.9;
  acc += uColorA * exp(-d * (34.0 - 16.0 * uGlow)) * (0.3 + 0.45 * uLevel);
  vec4 col = glow(acc);
  col = addLight(col, uColorA * halo(r, R) * smoothstep(R, R + 0.05, r) * (0.08 + 0.3 * uGlow + 0.3 * uLevel));
  col = addLight(col, uColorC * thinkArc(p, R) * 1.2);
  col = addLight(col, uColorA * transRing(r, R));
  return col;
}`,
};
