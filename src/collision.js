// 2D circle-vs-AABB walls on the XZ plane + 3D parkour platforms.
export const boxes = [];
export const platforms = [];
export const addBox = (a, b, c, d) => boxes.push([a, b, c, d]);
export const addPlatform = (x0, z0, x1, z1, topY, thickness = 0.25) => platforms.push([x0, z0, x1, z1, topY, thickness]);

export function clearCollision() {
  boxes.length = 0;
  platforms.length = 0;
}

export function resolve(p, r, feetY = 0) {
  // Only collide with interior walls when near main floor elevation (y < 4.8) or within studio x-bounds
  for (let pass = 0; pass < 2; pass++) {
    for (const [a, b, c, d] of boxes) {
      if (feetY > 4.2 && p.x > 11.2) continue;
      const nx = Math.max(a, Math.min(p.x, c)), nz = Math.max(b, Math.min(p.z, d));
      const dx = p.x - nx, dz = p.z - nz, q = dx * dx + dz * dz;
      if (q >= r * r) continue;
      if (q > 1e-8) { const l = Math.sqrt(q), k = (r - l) / l; p.x += dx * k; p.z += dz * k; }
      else {
        const m = [p.x - a, c - p.x, p.z - b, d - p.z], i = m.indexOf(Math.min(...m));
        if (i === 0) p.x = a - r; else if (i === 1) p.x = c + r; else if (i === 2) p.z = b - r; else p.z = d + r;
      }
    }
  }
}

// Returns highest walkable ground Y underneath (x, z) reachable from current feetY, or -Infinity if open air.
export function supportY(x, z, feetY, prevFeetY) {
  let best = -Infinity;
  // Main building interior + Sky Overlook balcony floor at y = 0
  const inEntry = x >= -5.2 && x <= 5.2 && z >= -10.2 && z <= 0.2;
  const inUnomi = x >= -7.2 && x <= 7.2 && z >= -26.2 && z <= -9.8;
  const inTrans = x >= -2.4 && x <= 2.4 && z >= -30.2 && z <= -25.8;
  const inProj = x >= -11.2 && x <= 11.2 && z >= -52.2 && z <= -29.8;
  const inBalcony = x >= 10.8 && x <= 14.7 && z >= -36.1 && z <= -31.5;
  const inSkills = x >= -6.2 && x <= 6.2 && z >= -64.2 && z <= -51.8;
  const inContact = x >= -4.2 && x <= 4.2 && z >= -74.2 && z <= -63.8;
  if (inEntry || inUnomi || inTrans || inProj || inBalcony || inSkills || inContact) {
    if (prevFeetY >= -0.45) best = 0;
  }
  // Parkour platforms (generous 0.26m foot radius overhang so jumps feel crisp and fair)
  const pad = 0.26;
  for (const [x0, z0, x1, z1, topY] of platforms) {
    if (x >= x0 - pad && x <= x1 + pad && z >= z0 - pad && z <= z1 + pad) {
      if (prevFeetY >= topY - 0.35 && feetY <= topY + 0.35 && topY > best) {
        best = topY;
      } else if (prevFeetY >= topY - 0.12 && topY > best) {
        best = topY;
      }
    }
  }
  return best;
}
