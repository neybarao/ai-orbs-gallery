// Ref: cyan sphere of dotted meridians converging at a tilted pole, bright rim, floating specks.
export default {
  id: 'globe',
  name: 'Dot Globe',
  description: 'Sphere of dotted meridians with a bright wobbling rim.',
  tags: ['mesh', 'dots'],
  defaults: { colorA: '#39d5ff', colorB: '#06364a', colorC: '#b8f3ff', glow: 0.5, detail: 0.5 },
  labels: { detail: 'Meridians' },
  frag: /* glsl */ `
vec4 orb(vec2 p){
  float t = uTime * 0.5;
  float r = length(p);
  float ang = atan(p.y, p.x); vec2 cs = vec2(cos(ang), sin(ang));
  float R = 0.6 + 0.03 * uBass + (noise3(vec3(cs * 1.5, t * 0.8)) - 0.5) * (0.03 + 0.14 * uLevel);
  float mask = smoothstep(R + PX, R - PX, r);
  float z = sqrt(max(R * R - r * r, 0.0));
  vec3 n = vec3(p, z) / R;
  n.yz = rot(0.9) * n.yz; n.xy = rot(-0.6) * n.xy;
  n.xz = rot(t * 0.4) * n.xz;
  n += 0.06 * vec3(noise3(n * 2.5 + t) - 0.5, noise3(n * 2.5 + t + 3.0) - 0.5, 0.0) * (1.0 + 2.0 * uLevel);
  float N = mix(48.0, 96.0, uDetail);
  vec2 g = vec2(atan(n.x, n.z) / (2.0 * PI) * N, acos(clamp(n.y, -1.0, 1.0)) / PI * N * 0.7);
  vec2 f = fract(g) - 0.5;
  vec2 fw = max(fwidth(g), vec2(1e-4));
  float lineL = 1.0 - smoothstep(0.0, fw.x * 1.3, abs(f.x));
  float dotY = 1.0 - smoothstep(0.18, 0.18 + fw.y * 1.5, abs(f.y));
  float fres = pow(1.0 - z / R, 2.0);
  float I = lineL * dotY * (0.25 + 1.2 * fres + 0.8 * uLevel) + fres * 0.5 + 0.03;
  vec3 acc = mix(uColorB, uColorA, clamp(I, 0.0, 1.0)) * I * mask;
  acc += uColorC * exp(-abs(r - R) * 90.0) * (1.0 + uLevel);
  vec2 sg = p * 9.0 + vec2(uTime * 0.05, 0.0);
  vec2 sid = floor(sg); vec2 sf = fract(sg) - 0.5;
  float sh = hash31(vec3(sid, 3.0));
  vec2 so = vec2(hash31(vec3(sid, 1.0)), hash31(vec3(sid, 2.0))) - 0.5;
  float speck = step(0.92, sh) * smoothstep(0.08, 0.0, length(sf - so * 0.6)) * (0.5 + 0.5 * sin(uTime * 2.0 + sh * 50.0));
  acc += uColorA * speck * 0.35 * (1.0 - mask);
  vec4 col = glow(acc);
  col = addLight(col, uColorA * halo(r, R) * smoothstep(R * 0.9, R * 1.05, r) * (0.15 + 0.4 * uGlow + 0.5 * uLevel));
  col = addLight(col, uColorC * thinkArc(p, R + 0.03));
  col = addLight(col, uColorC * transRing(r, R));
  return col;
}`,
};
