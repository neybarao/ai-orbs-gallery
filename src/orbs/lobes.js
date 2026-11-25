// Ref: grainy translucent sheets shaped like a sphere carved into vertical leaf lobes. The
// lobes live on a spinning surface: front lobes slide one way, back lobes the other, so they
// cross into X shapes along the middle, and they squeeze together toward the edges.
export default {
  id: 'lobes',
  name: 'Lobes',
  description: 'Grainy leaf-shaped lobes on a spinning sphere, crossing front and back.',
  tags: ['lines', 'wave'],
  defaults: { colorA: '#cfcfcf', colorB: '#3a3a3a', colorC: '#ffffff', glow: 0.3, detail: 0.5 },
  labels: { detail: 'Lobe count' },
  frag: /* glsl */ `
vec4 orb(vec2 p){
  float t = uTime;
  float r = length(p);
  float R = 0.4 + 0.02 * uBass;
  float sx = clamp(p.x / R, -1.0, 1.0);
  float E = R * sqrt(max(1.0 - sx * sx, 0.0)) * (0.94 + 0.08 * uLevel);
  float k = floor(mix(5.0, 8.0, uDetail));
  float ay = abs(p.y);
  float grain = hash31(vec3(floor(p * 320.0), floor(t * 14.0)));
  float spin = t * 0.45 + uLevel * 0.3;
  vec3 acc = vec3(0.0);
  for (int f = 0; f < 2; f++) {
    // longitude of the front and back surface under this pixel
    float phi = f == 0 ? asin(sx) : PI - asin(sx);
    float amp = f == 0 ? 1.0 : 0.6;
    float u = k * (phi + spin);
    float s = abs(sin(u));
    float tri = 1.0 - abs(fract(u / PI) * 2.0 - 1.0);
    float shape = mix(s, tri, 0.3);
    float H = E * shape * (1.0 + 0.1 * uLevel * sin(t * 7.0 + u));
    float inside = smoothstep(H + PX, H - PX, ay);
    float rel = ay / max(H, 1e-3);
    // translucent sheet: dim in the middle, brighter where it turns away (edges)
    float sheet = inside * (0.16 + 0.42 * pow(rel, 5.0)) * (0.55 + 0.6 * grain);
    float edge = smoothstep(0.004 + PX, 0.0, abs(ay - H)) * (0.35 + 0.4 * shape);
    acc += mix(uColorB, uColorA, 0.5 + 0.5 * shape) * (sheet + edge) * amp * (0.8 + 0.5 * uLevel);
  }
  acc *= smoothstep(R + 0.005, R - 0.01, abs(p.x));
  acc += uColorA * exp(-r * 5.0) * 0.025 * (1.0 + uGlow);
  vec4 col = glow(acc);
  col = addLight(col, uColorC * thinkArc(p, R + 0.04));
  col = addLight(col, uColorC * transRing(r, R) * 0.8);
  return col;
}`,
};
