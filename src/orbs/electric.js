// Arc Ring → plasma globe: a glowing electrode in a glass sphere; plasma tendrils snake from
// the core to the glass, branch, drift continuously and flare where they touch the glass.
export default {
  id: 'electric',
  name: 'Plasma',
  description: 'Plasma globe: tendrils snake from the core to the glass and flare on contact.',
  tags: ['electric', 'plasma'],
  defaults: { colorA: '#c86bff', colorB: '#3a1d8f', colorC: '#e9f0ff', glow: 0.6, detail: 0.5 },
  labels: { detail: 'Tendrils' },
  frag: /* glsl */ `
float wrapA(float a){ return a - 6.2831853 * floor((a + PI) / 6.2831853); }
// angular wander of a tendril along the radius (continuous in time, no stepping)
float wander(float r, float seed, float t){
  return (noise3(vec3(r * 3.0, seed, t * 0.9)) - 0.5) * 1.6 * r
       + (noise3(vec3(r * 9.0, seed + 5.0, t * 3.5)) - 0.5) * 0.35 * r
       + (noise3(vec3(r * 26.0, seed + 9.0, t * 9.0)) - 0.5) * 0.08;
}
vec4 orb(vec2 p){
  float t = uTime;
  float r = length(p);
  float ang = atan(p.y, p.x);
  float R = 0.58;                       // glass radius
  float Rcore = 0.075 + 0.01 * uBass;
  vec3 acc = vec3(0.0);
  float inside = smoothstep(R + PX, R - PX, r);
  int count = int(mix(5.0, 11.0, uDetail));
  for (int i = 0; i < 11; i++) {
    if (i >= count) break;
    float fi = float(i);
    float seed = fi * 7.31;
    // end point angle drifts slowly around the globe
    float a0 = fi * 2.399 + (noise3(vec3(seed, 0.0, t * 0.18)) - 0.5) * 7.0;
    float rr = clamp(r, Rcore, R);
    float A = a0 + wander(rr, seed, t);
    float da = abs(wrapA(ang - A)) * rr;
    float prog = smoothstep(Rcore, R, r);
    float energy = 0.55 + 0.45 * noise3(vec3(seed, 3.0, t * 1.7)) + 0.9 * uLevel;
    float w = mix(0.010, 0.0035, prog) * (0.8 + 0.6 * uLevel);
    float core = exp(-da / w);
    float sheath = exp(-da / (w * 6.0)) * 0.22;
    float fade = smoothstep(R + 0.005, R - 0.01, r);
    acc += (uColorC * core + uColorA * (core * 0.6 + sheath)) * energy * fade;
    // a branch splitting off part way
    float r0 = mix(0.22, 0.4, hash11(seed));
    if (r > r0) {
      float dir = hash11(seed + 1.0) > 0.5 ? 1.0 : -1.0;
      float Ab = a0 + wander(r0, seed, t) + dir * (r - r0) * (1.4 + 0.8 * noise3(vec3(seed, 7.0, t * 0.5)))
               + wander(rr, seed + 3.3, t) * 0.6;
      float db = abs(wrapA(ang - Ab)) * rr;
      float wb = w * 0.6;
      acc += (uColorC * exp(-db / wb) * 0.7 + uColorA * exp(-db / (wb * 6.0)) * 0.15) * energy * fade * 0.8;
    }
    // flare where the tendril touches the glass
    vec2 hitP = R * vec2(cos(a0 + wander(R, seed, t)), sin(a0 + wander(R, seed, t)));
    float fl = exp(-length(p - hitP) * 38.0);
    acc += (uColorC * 0.6 + uColorA) * fl * energy * 0.55;
  }
  // electrode
  float cr = r / Rcore;
  acc += uColorC * smoothstep(1.0, 0.6, cr) * 1.2;
  acc += uColorA * exp(-max(r - Rcore, 0.0) * 14.0) * (0.45 + 0.4 * uLevel);
  // gas haze and glass
  acc += uColorB * inside * (0.06 + 0.05 * (1.0 - r / R));
  float rim = exp(-abs(r - R) * 140.0);
  float spec = exp(-abs(length(p - vec2(0.05, -0.05)) - 0.5) * 90.0) * smoothstep(0.2, 0.9, dot(normalize(p + 1e-5), normalize(vec2(-0.6, 0.8)))) * 0.25;
  acc += uColorC * (rim * 0.22 + spec * inside);
  vec4 col = vec4(acc * inside, inside * 0.35);
  col = addLight(col, acc * (1.0 - inside));
  col = addLight(col, uColorA * halo(r, R) * smoothstep(R * 0.95, R * 1.05, r) * (0.1 + 0.3 * uGlow + 0.4 * uLevel));
  col = addLight(col, uColorC * thinkArc(p, R + 0.02));
  col = addLight(col, uColorC * transRing(r, R));
  return col;
}`,
};
