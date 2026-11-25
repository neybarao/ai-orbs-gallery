// Ref: crackling magenta rim of electric fire around a sphere full of blue/cyan dust;
// the dust piles up on one side and the pile slowly orbits.
export default {
  id: 'nova',
  name: 'Nova',
  description: 'Crackling magenta rim around a sphere of drifting cyan dust.',
  tags: ['ring', 'electric'],
  defaults: { colorA: '#ff3fd0', colorB: '#2f7bff', colorC: '#ffffff', glow: 0.6, detail: 0.5 },
  labels: { detail: 'Dust density' },
  frag: /* glsl */ `
vec4 orb(vec2 p){
  float t = uTime;
  float r = length(p);
  float a = atan(p.y, p.x);
  vec2 cs = vec2(cos(a), sin(a));
  float R = 0.46 + 0.015 * uBass;
  vec3 acc = vec3(0.0);
  // dust: denser toward a slowly orbiting side, and toward the rim
  float side = 0.5 + 0.5 * dot(cs, vec2(cos(t * 0.35 - 2.4), sin(t * 0.35 - 2.4)));
  float inside = smoothstep(R + 0.005, R - 0.01, r);
  float rim = smoothstep(0.0, R, r);
  float dens = inside * (0.15 + 0.85 * pow(side, 2.0)) * (0.3 + 0.7 * rim * rim);
  for (int l = 0; l < 2; l++) {
    float fl = float(l);
    float cells = mix(90.0, 170.0, uDetail) * (1.0 + 0.6 * fl);
    vec2 q = rot(t * (0.04 + 0.03 * fl)) * p;
    vec2 g = q * cells;
    vec2 id = floor(g);
    float h = hash31(vec3(id, 7.0 + fl));
    vec2 o = vec2(hash31(vec3(id, 1.0)), hash31(vec3(id, 2.0))) - 0.5;
    float dot1 = smoothstep(0.32, 0.0, length(fract(g) - 0.5 - o * 0.4));
    float on = step(1.0 - dens * (0.75 + 0.35 * uLevel), h);
    float tw = 0.5 + 0.5 * sin(t * (2.0 + 4.0 * h) + h * 50.0);
    vec3 c = mix(uColorB, mix(uColorB, uColorC, 0.6), step(0.75, h));
    c = mix(c, uColorA, step(0.94, hash31(vec3(id, 5.0))));
    acc += c * dot1 * on * (0.5 + 0.7 * tw);
  }
  acc += uColorB * dens * 0.08;
  // electric rim
  float n1 = noise3(vec3(cs * 4.0, t * 1.6));
  float n2 = noise3(vec3(cs * 11.0, t * 3.2 + 5.0));
  float rr = R + (n1 - 0.5) * 0.02 + (n2 - 0.5) * (0.012 + 0.02 * uLevel);
  float d = abs(r - rr);
  acc += uColorC * smoothstep(0.006, 0.0, d) * 1.2;
  acc += uColorA * exp(-d * (60.0 - 25.0 * uGlow)) * (1.0 + 0.6 * uLevel);
  // flames licking outward
  float fl = fbm3(vec3(cs * 3.0, t * 1.2)) ;
  float flame = smoothstep(0.08 * fl + 0.01 + 0.03 * uLevel, 0.0, r - rr) * step(rr, r);
  acc += uColorA * flame * (0.5 + 0.6 * fl);
  // filaments: thin cracks hugging the rim
  float crack = abs(sin(a * 25.0 + fbm3(vec3(cs * 5.0, t)) * 18.0));
  acc += mix(uColorA, uColorB, 0.4) * exp(-crack * 14.0) * exp(-d * 45.0) * 0.7;
  vec4 col = glow(acc);
  col = addLight(col, uColorA * halo(r, R) * smoothstep(R, R + 0.05, r) * (0.1 + 0.3 * uGlow + 0.3 * uLevel));
  col = addLight(col, uColorC * thinkArc(p, R + 0.03));
  col = addLight(col, uColorA * transRing(r, R));
  return col;
}`,
};
