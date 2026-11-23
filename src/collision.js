// 2D circle-vs-AABB collision on the XZ plane. Boxes are [minX, minZ, maxX, maxZ].
export const boxes = [];
export const addBox = (a, b, c, d) => boxes.push([a, b, c, d]);
export function resolve(p, r) {
  for (let pass = 0; pass < 2; pass++) for (const [a, b, c, d] of boxes) {
    const nx = Math.max(a, Math.min(p.x, c)), nz = Math.max(b, Math.min(p.z, d)), dx = p.x - nx, dz = p.z - nz, q = dx * dx + dz * dz;
    if (q >= r * r) continue;
    if (q > 1e-8) { const l = Math.sqrt(q), k = (r - l) / l; p.x += dx * k; p.z += dz * k; }
    else { const m = [p.x - a, c - p.x, p.z - b, d - p.z], i = m.indexOf(Math.min(...m)); if (i === 0) p.x = a - r; else if (i === 1) p.x = c + r; else if (i === 2) p.z = b - r; else p.z = d + r; }
  }
}