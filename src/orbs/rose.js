// Ref: rose glass sphere with luminous wisps curling inside around a warm core, sitting on
// a faint field of dots that ripples behind it.
export default {
  id: 'rose',
  name: 'Rose Glass',
  description: 'Rose glass sphere with wisps curling around a warm core, over rippling dots.',
  tags: ['glass', 'wisps'],
  defaults: { colorA: '#ff3d8e', colorB: '#ff9a5a', colorC: '#f2f0ff', glow: 0.55, detail: 0.5 },
  labels: { detail: 'Wisp count' },
  frag: /* glsl */ `
float rsWisp(vec3 q, float f){
  float n = fbm3(q * f * 0.8 + vec3(0.0, uTime * 0.3, uTime * 0.15));
  float w = abs(sin(n * mix(8.0, 16.0, uDetail) + uTime * 0.5));
  return exp(-w * 9.0) * 0.8;
}
vec4 orb(vec2 p){
  float t = uTime;
  float r = length(p);
  float R = 0.4 + 0.02 * uBass;
  vec3 acc = vec3(0.0);
  // dot field behind
  vec2 dp = p + vec2(0.0, 0.03 * sin(p.x * 6.0 + t) + 0.02 * sin(p.y * 9.0 - t * 1.3));
  vec2 g = dp * 34.0;
  float dotm = smoothstep(0.25, 0.05, length(fract(g) - 0.5));
  float wave = 0.5 + 0.5 * sin(dp.x * 5.0 + dp.y * 3.0 - t * 1.2);
  acc += uColorA * dotm * wave * 0.22 * smoothstep(R + 0.02, R + 0.1, r) * smoothstep(0.95, 0.5, r) * (0.6 + 0.8 * uLevel);
  float body = smoothstep(R + PX, R - PX, r);
  if (body > 0.0) {
    float rr = min(r / R, 0.999);
    vec3 n = vec3(p / R, sqrt(1.0 - rr * rr));
    vec3 q1 = n; q1.xz = rot(t * 0.3) * q1.xz;
    vec3 q2 = vec3(p / R, 0.0); q2.xy = rot(-t * 0.2) * q2.xy;
    float w1 = rsWisp(q1, 1.2);
    float w2 = rsWisp(q2 + 3.0, 1.6);
    vec3 c = mix(uColorA * 0.12, uColorA * 0.25, 1.0 - rr);
    // warm core sits a little low
    float core = exp(-length(p / R - vec2(0.0, -0.1)) * 3.5);
    c += uColorB * core * (0.6 + 0.8 * uLevel);
    c += mix(uColorC, uColorA, 0.3) * w1 * (0.5 + 0.5 * n.z) * 0.8;
    c += mix(uColorC, uColorB, 0.4) * w2 * (0.4 + 0.6 * core) * (0.6 + 0.6 * uLevel);
    // glass
    float fres = pow(rr, 5.0);
    c += uColorA * fres * 1.2 + uColorC * smoothstep(0.985, 1.0, rr) * 0.6;
    c += uColorC * pow(max(dot(n, normalize(vec3(-0.45, 0.55, 0.7))), 0.0), 40.0) * 0.7;
    acc = mix(acc, c, body);
  }
  vec4 col = vec4(acc, max(body * 0.92, clamp(lum(acc), 0.0, 1.0)));
  col = addLight(col, uColorA * halo(r, R) * smoothstep(R, R + 0.04, r) * (0.1 + 0.35 * uGlow + 0.3 * uLevel));
  col = addLight(col, uColorC * thinkArc(p, R + 0.05));
  col = addLight(col, uColorA * transRing(r, R));
  return col;
}`,
};
