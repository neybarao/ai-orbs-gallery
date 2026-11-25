// Ref: dark glass sphere tiled with hexagons; a bright band of tiles lights up and sweeps
// up and down the sphere while the shell gently tumbles.
export default {
  id: 'hive',
  name: 'Hive',
  description: 'Dark hexagon-tiled sphere with a band of light sweeping up and down.',
  tags: ['3d', 'tiles'],
  defaults: { colorA: '#7cc8ff', colorB: '#14222f', colorC: '#e2f4ff', glow: 0.4, detail: 0.5 },
  labels: { detail: 'Tile count' },
  frag: /* glsl */ `
vec4 hvCell(vec2 uv){
  vec2 s = vec2(1.0, 1.7320508);
  vec2 h = s * 0.5;
  vec2 a = mod(uv, s) - h;
  vec2 b = mod(uv - h, s) - h;
  vec2 g = dot(a, a) < dot(b, b) ? a : b;
  return vec4(g, uv - g);
}
float hvDist(vec2 g){ g = abs(g); return max(dot(g, vec2(0.5, 0.8660254)), g.x); }
vec3 hvShade(vec3 n, float face, float band, float bw, float M){
  vec3 q = n;
  q.yz = rot(0.25 * sin(uTime * 0.31)) * q.yz;
  q.xz = rot(uTime * 0.15) * q.xz;
  float lon = atan(q.z, q.x);
  float lat = asin(clamp(q.y, -1.0, 1.0));
  vec2 uv = vec2(lon / 6.2831853 * M * 1.7, lat / PI * M * 0.5);
  vec4 c = hvCell(uv);
  float hd = hvDist(c.xy);
  float tile = smoothstep(0.47, 0.43, hd);
  float cellLat = c.w / (M * 0.5) * PI;
  float lit = exp(-pow((cellLat - band) / bw, 2.0));
  float pop = hash31(vec3(c.zw, floor(uTime * 3.0)));
  lit *= 0.75 + 0.25 * pop;
  float shade = 0.4 + 0.6 * clamp(dot(n, normalize(vec3(-0.3, 0.5, 0.8))), 0.0, 1.0);
  vec3 dark = uColorB * (0.25 + 0.6 * shade) + uColorA * 0.03 * shade;
  vec3 hot = mix(uColorA, uColorC, smoothstep(0.6, 1.0, lit) * 0.6) * (0.6 + 0.6 * shade);
  vec3 col = mix(dark, hot, lit) * tile;
  col += uColorA * smoothstep(0.43, 0.47, hd) * smoothstep(0.52, 0.47, hd) * (0.05 + 0.4 * lit);
  return col * face;
}
vec4 orb(vec2 p){
  float t = uTime;
  float r = length(p);
  float R = 0.42 + 0.015 * uBass;
  float M = floor(mix(14.0, 24.0, uDetail));
  float band = sin(t * 0.7) * 1.1;
  float bw = 0.18 + 0.12 * uLevel + 0.06 * uThink;
  vec4 col = vec4(0.0);
  float body = smoothstep(R + PX, R - PX, r);
  if (body > 0.0) {
    float rr = min(r / R, 0.999);
    float z = sqrt(1.0 - rr * rr);
    vec3 back = hvShade(vec3(p / R, -z), 0.45, band, bw, M);
    vec3 front = hvShade(vec3(p / R, z), 1.0, band, bw, M);
    // front tiles are glassy: let the back show through the dark ones
    float fl = lum(front);
    vec3 c = front + back * (1.0 - smoothstep(0.1, 0.5, fl)) * 0.8;
    c += uColorA * pow(rr, 8.0) * 0.25;
    col = vec4(c * body, body * clamp(0.55 + lum(c), 0.0, 1.0));
  }
  col = addLight(col, uColorA * halo(r, R) * smoothstep(R, R + 0.04, r) * (0.04 + 0.2 * uGlow + 0.25 * uLevel));
  col = addLight(col, uColorC * thinkArc(p, R + 0.05));
  col = addLight(col, uColorA * transRing(r, R));
  return col;
}`,
};
