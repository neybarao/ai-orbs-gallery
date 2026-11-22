// Ref: dense, crisp particle band around a dark core; outer dust drawn into faint swirling
// arcs (particles stretched along their orbit), sparse specks inside, slow drift + twinkle.
export default {
  id: 'particles',
  name: 'Stardust',
  description: 'Crisp particle band with dust swirling out in faint arcs.',
  tags: ['particles'],
  defaults: { colorA: '#cfd3d8', colorB: '#4a4f57', colorC: '#ffffff', glow: 0.4, detail: 0.5 },
  labels: { detail: 'Particle density' },
  frag: /* glsl */ `
vec4 orb(vec2 p){
  float t = uTime;
  float r = length(p);
  float ang = atan(p.y, p.x);
  float R = 0.47 + 0.03 * uBass;
  float expand = 1.0 + 0.1 * uLevel + 0.05 * uTrans * sin(t * 3.0);
  vec3 acc = vec3(0.0);
  // polar layers: cells are long along the orbit -> arcs/streaks
  for (int l = 0; l < 3; l++) {
    float fl = float(l);
    float rowH = mix(0.018, 0.011, uDetail) * (1.0 + 0.4 * fl);
    float rr = r / expand;
    float row = floor(rr / rowH);
    float rc = (row + 0.5) * rowH;
    float cells = floor(6.2831 * rc / (rowH * (1.2 + 1.5 * fl)));
    float spin = (0.05 + 0.12 * hash11(row * 1.7 + fl)) * (1.0 + 0.6 * smoothstep(R, R + 0.3, rc)) * (mod(row, 2.0) < 1.0 ? 1.0 : 0.8);
    float u = (ang / 6.2831 + 0.5 + t * spin * 0.15) * cells;
    float cid = floor(u);
    float h = hash31(vec3(row, cid, fl * 13.0));
    float dens = exp(-pow((rc - R) / 0.03, 2.0)) * 0.95 + (rc > R ? exp(-(rc - R) * (3.4 - 1.4 * uLevel)) * 0.32 : 0.04);
    if (h < dens) {
      float fu = fract(u) - 0.5;
      float jr = (hash31(vec3(row, cid, fl + 4.0)) - 0.5) * rowH * 0.6;
      float dr = abs(rr - rc - jr);
      float lenU = 0.12 + 0.3 * hash31(vec3(row, cid, fl + 8.0)) * smoothstep(R, R + 0.2, rc);
      float du = max(abs(fu) - lenU * 0.5, 0.0) * 6.2831 * rc / cells;
      float sz = max(rowH * 0.18, PX * 0.8);
      float tw = 0.6 + 0.4 * sin(t * 2.5 + h * 50.0);
      acc += mix(uColorA, uColorC, h) * smoothstep(sz + PX, sz - PX * 0.5, length(vec2(du, dr))) * tw * (0.75 + 0.6 * uLevel);
    }
  }
  // fine round specks
  vec2 q = rot(t * 0.03) * p / expand;
  vec2 id = floor(q / 0.02);
  float hh = hash31(vec3(id, 5.0));
  vec2 pc = (id + 0.5 + (vec2(hash31(vec3(id, 1.0)), hash31(vec3(id, 2.0))) - 0.5) * 0.5) * 0.02;
  float rc2 = length(pc);
  float d2 = exp(-pow((rc2 - R) / 0.025, 2.0)) * 0.95 + (rc2 > R ? exp(-(rc2 - R) * 3.0) * 0.35 : 0.08);
  if (hh < d2) acc += uColorC * smoothstep(PX * 1.6, PX * 0.4, length(q - pc)) * (0.5 + 0.5 * sin(t * 4.0 + hh * 30.0));
  acc += uColorA * exp(-abs(r - R) * 40.0) * (0.1 + 0.15 * uLevel);
  vec4 col = glow(acc);
  col = addLight(col, uColorB * halo(r, R) * smoothstep(R * 0.9, R * 1.1, r) * (0.06 + 0.25 * uGlow));
  col = addLight(col, uColorC * thinkArc(p, R) * 1.2);
  col = addLight(col, uColorC * transRing(r, R));
  return col;
}`,
};
