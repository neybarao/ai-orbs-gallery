// Ref: wireframe globe of cyan/violet meridians and parallels inside a bright rim; the grid
// warps, then thins out until only the rim is left, and blooms back.
export default {
  id: 'lattice',
  name: 'Lattice',
  description: 'Neon wireframe globe that warps, fades to its rim and blooms back.',
  tags: ['lines', 'neon'],
  defaults: { colorA: '#37f0d0', colorB: '#8a5cff', colorC: '#f4ecff', glow: 0.5, detail: 0.5 },
  labels: { detail: 'Grid density' },
  frag: /* glsl */ `
vec3 ltGrid(vec3 n, float face, float vis, float M){
  float t = uTime;
  vec3 q = n;
  q.yz = rot(0.35 * sin(t * 0.33)) * q.yz;
  q.xz = rot(t * 0.3) * q.xz;
  float lon = atan(q.z, q.x);
  float lat = asin(clamp(q.y, -1.0, 1.0));
  float warp = (0.25 + 0.5 * uLevel) * sin(lat * 3.0 + t * 1.2) * sin(lon * 2.0 - t * 0.8);
  float lv = (lon + warp) / 6.2831853 * M;
  float pv = (lat + warp * 0.5) / PI * M * 0.6;
  float fl = max(fwidth(lv), 1e-4), fp = max(fwidth(pv), 1e-4);
  float l1 = smoothstep(0.5 - fl * 1.6, 0.5 - fl * 0.2, abs(fract(lv) - 0.5));
  float l2 = smoothstep(0.5 - fp * 1.6, 0.5 - fp * 0.2, abs(fract(pv) - 0.5));
  float lines = max(l1, l2 * 0.8);
  // a colour sweep travels over the surface
  float sweep = 0.5 + 0.5 * sin(lat * 2.0 + lon - t * 1.1);
  vec3 c = mix(uColorB, uColorA, sweep);
  float hot = smoothstep(0.85, 1.0, sweep) * (0.5 + uLevel);
  return c * lines * vis * face * (0.6 + hot) ;
}
vec4 orb(vec2 p){
  float t = uTime;
  float r = length(p);
  float R = 0.42 + 0.02 * uBass;
  float M = floor(mix(14.0, 28.0, uDetail));
  // grid visibility breathes, held open while speaking or thinking
  float cyc = smoothstep(-0.3, 0.6, sin(t * 0.45));
  float vis = clamp(cyc + uSpeak * 0.8 + uThink * 0.5, 0.0, 1.0);
  vec3 acc = vec3(0.0);
  float body = smoothstep(R + PX, R - PX, r);
  if (body > 0.0) {
    float rr = min(r / R, 0.999);
    float z = sqrt(1.0 - rr * rr);
    acc += ltGrid(vec3(p / R, z), 1.0, vis, M) * body;
    acc += ltGrid(vec3(p / R, -z), 0.35, vis, M) * body;
    acc += mix(uColorB, uColorA, 0.5) * pow(rr, 10.0) * 0.4 * vis;
  }
  float d = abs(r - R);
  acc += uColorC * smoothstep(0.004 + PX, 0.0, d) * 1.1;
  acc += mix(uColorA, uColorB, 0.5 + 0.5 * sin(atan(p.y, p.x) + t)) * exp(-d * (60.0 - 25.0 * uGlow)) * (0.5 + 0.4 * uLevel);
  vec4 col = glow(acc);
  col = addLight(col, uColorB * halo(r, R) * smoothstep(R, R + 0.06, r) * (0.05 + 0.2 * uGlow));
  col = addLight(col, uColorC * thinkArc(p, R + 0.04));
  col = addLight(col, uColorA * transRing(r, R));
  return col;
}`,
};
