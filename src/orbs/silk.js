// Ref: silver ribbon ring made of many fine strands; crests flare outward and travel around
// it, folding the strands like silk.
export default {
  id: 'silk',
  name: 'Silk Ring',
  description: 'Silver ring of fine strands with crests that flare and travel around it.',
  tags: ['ring', 'lines'],
  defaults: { colorA: '#cdd8ea', colorB: '#4f5b72', colorC: '#ffffff', glow: 0.5, detail: 0.5 },
  labels: { detail: 'Strand count' },
  frag: /* glsl */ `
float skBump(float a, float c, float w){ float d = atan(sin(a - c), cos(a - c)); return exp(-d * d / (w * w)); }
vec4 orb(vec2 p){
  float t = uTime;
  float r = length(p);
  float a = atan(p.y, p.x);
  float R = 0.33 + 0.015 * uBass;
  // travelling crests
  float c1 = skBump(a, t * 0.9, 0.5), c2 = skBump(a, -t * 0.6 + 2.5, 0.4), c3 = skBump(a, t * 0.45 + 4.2, 0.6);
  float crest = c1 * (0.09 + 0.08 * uLevel) + c2 * (0.06 + 0.06 * uLevel) + c3 * 0.05;
  float N = floor(mix(10.0, 24.0, uDetail));
  vec3 acc = vec3(0.0);
  float lightSide = 0.35 + 0.65 * (0.5 + 0.5 * dot(normalize(p + 1e-5), normalize(vec2(-0.7, 0.5))));
  for (int i = 0; i < 24; i++) {
    float fi = float(i);
    if (fi >= N) break;
    float o = fi / N;
    float rr = R + (o - 0.5) * 0.05
      + crest * (0.4 + o) * (1.0 + 0.3 * sin(a * 4.0 + fi))
      + 0.012 * sin(a * 3.0 + t * 1.3 + o * 3.0)
      + 0.008 * sin(a * 7.0 - t * 1.7 + o * 6.0);
    float d = abs(r - rr);
    float l = smoothstep(0.0025 + PX, 0.0, d);
    acc += mix(uColorB, uColorA, lightSide) * l * (0.35 + 0.5 * (1.0 - abs(o - 0.5) * 2.0)) * (0.6 + 0.6 * crest * 6.0);
  }
  acc = acc * (1.6 / sqrt(N));
  acc += uColorA * exp(-abs(r - R) * 22.0) * (0.06 + 0.15 * uGlow + 0.2 * uLevel) * lightSide;
  vec4 col = glow(acc);
  col = addLight(col, uColorA * halo(r, R + 0.05) * smoothstep(R, R + 0.12, r) * (0.03 + 0.1 * uGlow));
  col = addLight(col, uColorC * thinkArc(p, R) * 1.1);
  col = addLight(col, uColorC * transRing(r, R) * 0.8);
  return col;
}`,
};
