// Ref: glossy chromatic rim (white core, cyan outside, magenta inside) around a globe of fine
// neon lines. The lines cycle: a dense flowing sheet of strands, thinning to a few curved
// meridians, then just the rim, then parallels and a crossing grid growing back line by line.
export default {
  id: 'lattice',
  name: 'Lattice',
  description: 'Chromatic rim around neon strands that flow, thin out to nothing and grow back.',
  tags: ['lines', 'neon'],
  defaults: { colorA: '#38f0d2', colorB: '#7b4dff', colorC: '#ffffff', glow: 0.5, detail: 0.5 },
  labels: { detail: 'Line count' },
  frag: /* glsl */ `
vec3 ltFam(vec3 n, vec3 ax, vec3 refv, float N, float dens, float bc, float bunch, float seed, vec3 c1, vec3 c2){
  float t = uTime;
  vec3 e1 = normalize(refv - ax * dot(refv, ax));
  vec3 e2 = cross(ax, e1);
  float lon = atan(dot(n, e2), dot(n, e1));
  float v = asin(clamp(dot(n, ax), -1.0, 1.0)) / (PI * 0.5);
  v += (0.1 + 0.25 * uLevel) * sin(lon * 2.0 + t * 1.2 + seed) * (1.0 - v * v);
  // pull lines together into a flowing sheet around bc
  float dv = v - bc;
  v = bc + sign(dv) * pow(min(abs(dv), 2.0), 1.0 + 0.6 * bunch) * (1.0 + 0.5 * bunch);
  float x = (v * 0.5 + 0.5) * N;
  float id = floor(x + 0.5);
  float vis = smoothstep(0.0, 0.12, dens - hash11(id * 1.37 + seed));
  float fw = max(fwidth(x), 1e-4);
  float line = 1.0 - smoothstep(fw * 0.5, fw * 1.5, abs(x - id));
  // sparse lines break into dots
  float dots = mix(1.0, step(0.45, fract(lon * 30.0)), smoothstep(0.5, 0.15, dens));
  vec3 c = mix(c1, c2, 0.5 + 0.5 * sin(lon * 1.5 + id * 0.35 + t * 0.4));
  return c * line * vis * dots;
}
vec4 orb(vec2 p){
  float t = uTime;
  float r = length(p);
  float R = 0.42 + 0.015 * uBass;
  float N = floor(mix(28.0, 56.0, uDetail));
  // 10 s cycle: flowing sheet -> thins out -> rim only -> parallels grow -> grid -> sheet
  float c = fract(t / 10.0);
  float densA = clamp(1.0 - smoothstep(0.15, 0.42, c) + smoothstep(0.65, 0.85, c), 0.0, 1.0);
  float densB = smoothstep(0.2, 0.3, c) * (1.0 - smoothstep(0.36, 0.45, c)) * 0.35
              + smoothstep(0.55, 0.68, c) * (1.0 - smoothstep(0.88, 1.0, c));
  float floorD = 0.55 * uSpeak + 0.4 * uLevel + 0.3 * uThink;
  densA = max(densA, floorD);
  densB = max(densB, floorD * 0.8);
  float bunchA = clamp(1.0 - smoothstep(0.08, 0.25, c) + smoothstep(0.85, 1.0, c), 0.0, 1.0) * (0.8 + 0.3 * uLevel);
  vec3 axA = normalize(vec3(0.5 * sin(t * 0.21), 1.0, 0.4 * cos(t * 0.17)));
  vec3 axB = normalize(vec3(1.0, 0.35 * sin(t * 0.23), 0.45 + 0.2 * cos(t * 0.19)));
  vec3 blue = mix(uColorB, vec3(0.2, 0.3, 1.0), 0.5);
  vec3 acc = vec3(0.0);
  float body = smoothstep(R + PX, R - PX, r);
  if (body > 0.0) {
    float rr = min(r / R, 0.999);
    float z = sqrt(1.0 - rr * rr);
    for (int s = 0; s < 2; s++) {
      vec3 n = vec3(p / R, s == 0 ? z : -z);
      float face = s == 0 ? 1.0 : 0.4;
      vec3 a = ltFam(n, axA, vec3(0.0, 0.0, 1.0), N, densA, 0.35 * sin(t * 0.5), bunchA, 1.0, blue, uColorB);
      vec3 bb = ltFam(n, axB, vec3(0.0, 1.0, 0.0), N * 0.6, densB, 0.0, 0.0, 7.0, uColorA, uColorB);
      acc += (a * 0.6 + bb * 0.8) * face;
    }
    // soft fill where the strands bunch into a sheet
    acc += blue * bunchA * 0.03 * (1.0 - rr * rr);
    acc *= body * (0.85 + 0.5 * uLevel);
  }
  // chromatic glossy rim
  float d = r - R;
  float a = atan(p.y, p.x);
  float gloss = 0.7 + 0.3 * sin(a * 2.0 + t * 0.7);
  acc += uColorC * smoothstep(0.0045 + PX, 0.0, abs(d)) * 1.2 * gloss;
  acc += uColorA * exp(-abs(d - 0.006) * 260.0) * (0.6 + 0.3 * uLevel) * gloss;
  acc += mix(uColorB, vec3(1.0, 0.3, 0.9), 0.5) * exp(-abs(d + 0.008) * 220.0) * 0.6 * (densA * 0.7 + 0.3);
  acc += uColorA * exp(-abs(d) * (45.0 - 20.0 * uGlow)) * (0.18 + 0.25 * uLevel);
  vec4 col = glow(acc);
  col = addLight(col, uColorB * halo(r, R) * smoothstep(R, R + 0.06, r) * (0.05 + 0.2 * uGlow));
  col = addLight(col, uColorC * thinkArc(p, R + 0.04));
  col = addLight(col, uColorA * transRing(r, R));
  return col;
}`,
};
