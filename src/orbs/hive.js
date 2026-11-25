// Ref: glass sphere spinning end over end; only one band of hexagonal tiles is solid. The
// tiles stand out from the shell at uneven heights (the outline bulges where the band
// passes), a few are missing, and the rest of the sphere is faint glass with ghost hexes.
// Raymarched so the band reads as real extruded prisms, including its far side.
export default {
  id: 'hive',
  name: 'Hive',
  description: 'Glass sphere tumbling end over end, wrapped by one band of raised hexagon tiles.',
  tags: ['raymarch', 'tiles'],
  defaults: { colorA: '#86ccff', colorB: '#0f1c29', colorC: '#e6f6ff', glow: 0.4, detail: 0.5 },
  labels: { detail: 'Tile count' },
  frag: /* glsl */ `
float hvM, hvR0, hvBW, hvC;
mat2 hvSpin, hvYaw;
vec4 hvCell(vec2 uv){
  vec2 s = vec2(1.0, 1.7320508);
  vec2 h = s * 0.5;
  vec2 a = mod(uv, s) - h;
  vec2 b = mod(uv - h, s) - h;
  vec2 g = dot(a, a) < dot(b, b) ? a : b;
  return vec4(g, uv - g);
}
float hvDist(vec2 g){ g = abs(g); return max(dot(g, vec2(0.5, 0.8660254)), g.x); }
vec3 hvQ(vec3 p){
  vec3 q = p;
  q.yz = hvYaw * q.yz;
  q.xz = hvSpin * q.xz;
  return q;
}
// x: hex distance, y: tile height, z: solid, w: random
vec4 hvTile(vec3 q){
  float lon = atan(q.z, q.x);
  float lat = asin(clamp(q.y / max(length(q), 1e-4), -1.0, 1.0));
  float S = hvM / 6.2831853;
  vec4 c = hvCell(vec2(lon, lat) * S);
  float cLat = c.w / S;
  float cLon = c.z / S;
  float rnd = hash31(vec3(c.zw, 1.0));
  float band = smoothstep(hvBW, hvBW * 0.5, abs(cLat - hvC) + (rnd - 0.5) * 0.06);
  vec3 cd = vec3(cos(cLon) * cos(cLat), sin(cLat), sin(cLon) * cos(cLat));
  float n = noise3(cd * 3.2 + vec3(0.0, uTime * 0.9, uTime * 0.4));
  float hgt = band * (0.015 + 0.055 * n + 0.05 * uLevel * n + 0.01 * uBass);
  float missing = step(rnd, 0.05) * step(0.5, abs(cLat - hvC) / max(hvBW, 1e-3));
  float solid = step(0.5, band) * (1.0 - missing);
  return vec4(hvDist(c.xy), hgt, solid, rnd);
}
float hvMap(vec3 p, out vec4 info){
  vec3 q = hvQ(p);
  info = hvTile(q);
  float rr = length(p);
  float gap = smoothstep(0.41, 0.47, info.x);
  float top = hvR0 + info.y - gap * 0.03;
  float d = max(rr - top, (hvR0 - 0.02) - rr);
  if (info.z < 0.5 || gap > 0.99) d = max(d, 0.012);
  return d;
}
vec4 orb(vec2 p){
  float t = uTime;
  float r = length(p);
  hvM = floor(mix(22.0, 36.0, uDetail));
  hvR0 = 0.39 + 0.01 * uBass;
  hvBW = 0.36 + 0.1 * uLevel + 0.06 * uThink;
  hvSpin = rot(t * 0.35);
  hvYaw = rot(0.14 + 0.08 * sin(t * 0.4));
  hvC = (0.5 - fract(t * 0.3 + uLevel * 0.05)) * PI * 1.25;
  vec3 ro = vec3(0.0, 0.0, 3.0);
  vec3 rd = normalize(vec3(p, -3.0));
  vec4 col = vec4(0.0);
  vec3 L1 = normalize(vec3(0.15, -0.55, 0.8));
  vec3 L2 = normalize(vec3(-0.4, 0.7, 0.6));
  // glass shell (front)
  float body = smoothstep(hvR0 + PX, hvR0 - PX, r);
  vec3 glass = vec3(0.0);
  if (body > 0.0) {
    float rr = min(r / hvR0, 0.999);
    vec3 n = vec3(p / hvR0, sqrt(1.0 - rr * rr));
    vec4 gi = hvTile(hvQ(n));
    float ghost = smoothstep(0.43, 0.47, gi.x) * smoothstep(0.5, 0.47, gi.x);
    glass = uColorA * (pow(rr, 6.0) * 0.45 + ghost * 0.07 * (0.4 + 0.6 * rr)) + uColorB * 0.12 * body;
  }
  // raymarch the solid band
  float b = dot(ro, rd);
  float Rb = hvR0 + 0.14;
  float disc = b * b - (dot(ro, ro) - Rb * Rb);
  bool hit = false;
  if (disc > 0.0) {
    float tt = -b - sqrt(disc);
    float tEnd = -b + sqrt(disc);
    vec4 info;
    for (int i = 0; i < 110; i++) {
      float d = hvMap(ro + rd * tt, info);
      if (d < 0.0012) { hit = true; break; }
      tt += max(d * 0.7, 0.002);
      if (tt > tEnd) break;
    }
    if (hit) {
      vec3 pos = ro + rd * tt;
      vec2 e = vec2(0.002, 0.0);
      vec4 tmp;
      vec3 n = normalize(vec3(
        hvMap(pos + e.xyy, tmp) - hvMap(pos - e.xyy, tmp),
        hvMap(pos + e.yxy, tmp) - hvMap(pos - e.yxy, tmp),
        hvMap(pos + e.yyx, tmp) - hvMap(pos - e.yyx, tmp)));
      vec3 radial = normalize(pos);
      float facing = dot(radial, -rd);
      float dif = max(dot(n, L1), 0.0) + max(dot(n, L2), 0.0) * 0.45;
      float tall = smoothstep(0.0, 0.09, info.y);
      vec3 c = mix(uColorB, uColorA, clamp(0.2 + 0.85 * dif, 0.0, 1.0));
      c = mix(c, uColorC, pow(max(dot(reflect(rd, n), L1), 0.0), 12.0) * 0.5);
      c *= 0.8 + 0.35 * tall;
      // a few tiles stay dark, like the reference
      c *= mix(1.0, 0.3, step(info.w, 0.1));
      // far side of the band is seen through the glass
      c *= facing < 0.0 ? 0.4 : 1.0;
      c *= 0.85 + 0.4 * uLevel;
      if (facing < 0.0) c += glass * 0.6;
      col = vec4(c, 1.0);
    }
  }
  if (!hit) col = vec4(glass, clamp(lum(glass) * 1.5 + body * 0.5, 0.0, 1.0));
  col = addLight(col, uColorA * halo(r, hvR0) * smoothstep(hvR0, hvR0 + 0.05, r) * (0.03 + 0.18 * uGlow + 0.25 * uLevel));
  col = addLight(col, uColorC * thinkArc(p, hvR0 + 0.12));
  col = addLight(col, uColorA * transRing(r, hvR0));
  return col;
}`,
};
