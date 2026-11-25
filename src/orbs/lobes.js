// Ref: sphere sliced into translucent hatched sheets; two families of lens-shaped lobes
// swell and shrink out of phase, rolling sideways like a standing wave.
export default {
  id: 'lobes',
  name: 'Lobes',
  description: 'Translucent hatched lobes swelling out of phase inside a sphere outline.',
  tags: ['lines', 'wave'],
  defaults: { colorA: '#d9d9d9', colorB: '#3c3c3c', colorC: '#ffffff', glow: 0.3, detail: 0.5 },
  labels: { detail: 'Lobe count' },
  frag: /* glsl */ `
vec4 orb(vec2 p){
  float t = uTime;
  float r = length(p);
  float R = 0.42 + 0.02 * uBass;
  float x = p.x, y = abs(p.y);
  float E = sqrt(max(R * R - x * x, 0.0)) * (0.9 + 0.1 * uLevel);
  float k = mix(2.6, 4.6, uDetail) / R;
  vec3 acc = vec3(0.0);
  for (int f = 0; f < 2; f++) {
    float ph = float(f) * PI * 0.5;
    float s = sin(k * x - t * 1.1 + ph + 0.3 * sin(t * 0.7));
    float H = E * (0.35 + 0.65 * abs(s)) * (1.0 + 0.15 * uLevel * sin(t * 6.0 + x * 20.0));
    float inside = smoothstep(H + PX, H - PX, y);
    float rel = clamp(y / max(H, 1e-3), 0.0, 1.0);
    float hatch = 0.5 + 0.5 * sin(x * 260.0 + float(f) * 1.7);
    float fill = inside * (0.1 + 0.45 * pow(rel, 4.0)) * (0.7 + 0.3 * hatch);
    float edge = smoothstep(0.004 + PX, 0.0, abs(y - H)) * 0.5;
    acc += mix(uColorB, uColorA, 0.6 + 0.4 * rel) * (fill + edge) * (0.75 + 0.5 * uLevel);
  }
  acc *= smoothstep(R + 0.01, R - 0.01, abs(x));
  acc += uColorA * exp(-r * 4.0) * 0.03 * (1.0 + uGlow);
  vec4 col = glow(acc);
  col = addLight(col, uColorC * thinkArc(p, R + 0.04));
  col = addLight(col, uColorC * transRing(r, R) * 0.8);
  return col;
}`,
};
