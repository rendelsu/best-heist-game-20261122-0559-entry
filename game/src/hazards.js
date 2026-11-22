// Lasers and the fuse box — the new hazards of the Director's Vault.
// Pure geometry, no DOM, so the world, the pilot and the renderer all
// share one definition of where a beam is.
import { distance, hasLineOfSight } from './geometry.js';

/**
 * The beam a laser throws this frame: from its emitter along its angle,
 * clipped at the first sight-blocking obstacle (a wall or a case) or at
 * its range, whichever comes first. Stepping along the ray in small
 * increments keeps the clip honest without a ray-casting solver.
 */
export function laserBeamSegment(laser, obstacles) {
  const dx = Math.cos(laser.angle);
  const dy = Math.sin(laser.angle);
  const step = 8;
  let length = 0;
  while (length < laser.spec.range) {
    const next = Math.min(laser.spec.range, length + step);
    const x = laser.x + dx * next;
    const y = laser.y + dy * next;
    // The beam stops at the first sight-blocking obstacle it would enter.
    let blocked = false;
    for (const obstacle of obstacles) {
      if (!obstacle.blocksSight) continue;
      const nearestX = Math.max(obstacle.x, Math.min(x, obstacle.x + obstacle.width));
      const nearestY = Math.max(obstacle.y, Math.min(y, obstacle.y + obstacle.height));
      const ox = x - nearestX;
      const oy = y - nearestY;
      if (ox * ox + oy * oy < 1) {
        blocked = true;
        break;
      }
    }
    if (blocked) break;
    length = next;
  }
  return { x1: laser.x, y1: laser.y, x2: laser.x + dx * length, y2: laser.y + dy * length };
}

/** Distance from a point to a segment. */
export function pointToSegmentDistance(px, py, segment) {
  const dx = segment.x2 - segment.x1;
  const dy = segment.y2 - segment.y1;
  const lengthSq = dx * dx + dy * dy;
  let t = 0;
  if (lengthSq > 0) {
    t = Math.max(0, Math.min(1, ((px - segment.x1) * dx + (py - segment.y1) * dy) / lengthSq));
  }
  const cx = segment.x1 + t * dx;
  const cy = segment.y1 + t * dy;
  return distance(px, py, cx, cy);
}

/**
 * True when the point is close enough to the beam to trip it, with a clear
 * line from the emitter — a wall between the emitter and the thief is cover.
 */
export function beamHitsPoint(segment, emitterX, emitterY, px, py, radius, halfWidth, obstacles) {
  if (pointToSegmentDistance(px, py, segment) > radius + halfWidth) return false;
  return hasLineOfSight(emitterX, emitterY, px, py, obstacles);
}
