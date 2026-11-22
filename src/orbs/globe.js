// Ref: glass sphere with a luminous liquid rim; thick crescents slosh around the edge,
// faint dotted meridians fade in and out as it turns, specks float in the background.
export default {
  id: 'globe',
  name: 'Dot Globe',
  description: 'Glass sphere with liquid light sloshing around its rim over faint meridians.',
  tags: ['mesh', 'dots'],
  defaults: { colorA: '#39d5ff', colorB: '#06364a', colorC: '#c4f6ff', glow: 0.5, detail: 0.5 },
  labels: { detail: 'Meridians' },
  frag: /* glsl */ `
vec4 orb(vec2 p){
  float t = uTime * 0.6;
  float r = length(p);
  float ang = atan(p.y, p.x); vec2 cs = vec2(cos(ang), sin(ang));
  float R = 0.6 + 0.02 * uBass + (noise3(vec3(cs * 2.0, t * 0.7)) - 0.5) * (0.015 + 0.06 * uLevel);
  float mask = smoothstep(R + PX, R - PX, r);
  // sloshing liquid thickness along the rim
  float a1 = t * 0.9 + sin(t * 0.37) * 2.0;
  float a2 = -t * 0.6 + 2.5;
  float th = 0.008 + (0.05 + 0.06 * uLevel) * pow(max(cos(ang - a1), 0.0), 3.0)
           + (0.03 + 0.04 * uLevel) * pow(max(cos(ang - a2), 0.0), 6.0);
  th += 0.012 * smoothstep(0.6, 1.0, noise3(vec3(cs * 6.0, t))) ;
  float dIn = R - r;
  float liquid = smoothstep(th + PX * 1.5, th - PX, dIn) * mask;
  float liquidShade = 0.6 + 0.4 * smoothstep(th, 0.0, dIn);
  // meridians
  float z = sqrt(max(R * R - r * r, 0.0));
  vec3 n = vec3(p, z) / R;
  n.yz = rot(0.9) * n.yz; n.xy = rot(-0.6) * n.xy;
  n.xz = rot(t * 0.5) * n.xz;
  float N = mix(48.0, 96.0, uDetail);
  vec2 g = vec2(atan(n.x, n.z) / 6.2831 * N, acos(clamp(n.y, -1.0, 1.0)) / PI * N * 0.7);
  vec2 f = fract(g) - 0.5;
  vec2 fw = max(fwidth(g), vec2(1e-4));
  float mer = (1.0 - smoothstep(0.0, fw.x * 1.3, abs(f.x))) * (1.0 - smoothstep(0.18, 0.18 + fw.y * 1.5, abs(f.y)));
  float merVis = 0.2 + 0.3 * smoothstep(-0.2, 1.0, sin(t * 0.8)) + 0.5 * uLevel + 0.2 * uThink;
  float fres = pow(1.0 - z / R, 2.5);
  vec3 acc = uColorA * mer * merVis * (0.3 + fres) * mask;
  acc += uColorB * 0.25 * mask * (0.3 + fres);
  acc += mix(uColorA, uColorC, 0.2) * liquid * liquidShade * (1.0 + 0.6 * uLevel);
  acc += uColorC * exp(-abs(r - R) * 160.0) * (1.0 + 0.5 * uLevel);
  // background specks
  vec2 sg = p * 8.0 + vec2(uTime * 0.04, uTime * 0.02);
  vec2 sid = floor(sg); vec2 sf = fract(sg) - 0.5;
  float sh = hash31(vec3(sid, 3.0));
  vec2 so = vec2(hash31(vec3(sid, 1.0)), hash31(vec3(sid, 2.0))) - 0.5;
  float sp = step(0.86, sh) * exp(-length(sf - so * 0.6) * 40.0) * (0.5 + 0.5 * sin(uTime * 1.5 + sh * 50.0));
  acc += uColorA * sp * 0.4 * (1.0 - mask);
  vec4 col = glow(acc);
  col = addLight(col, uColorA * halo(r, R) * smoothstep(R * 0.95, R * 1.05, r) * (0.12 + 0.35 * uGlow + 0.5 * uLevel));
  col = addLight(col, uColorC * thinkArc(p, R + 0.03));
  col = addLight(col, uColorC * transRing(r, R));
  return col;
}`,
};
