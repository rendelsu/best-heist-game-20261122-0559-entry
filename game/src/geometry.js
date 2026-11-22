// Small geometry helpers: circles against rectangles, and whether a watcher
// can actually see the thief (inside the cone and no sight-blocking obstacle
// between them). Pure functions, no DOM, so the Node self-test can use them.
export function clamp(value, min, max) {
  return value < min ? min : value > max ? max : value;
}

export function distance(ax, ay, bx, by) {
  return Math.hypot(ax - bx, ay - by);
}

/** Shortest distance from a point to a rectangle. */
export function distanceToRect(px, py, rect) {
  const dx = Math.max(rect.x - px, 0, px - (rect.x + rect.width));
  const dy = Math.max(rect.y - py, 0, py - (rect.y + rect.height));
  return Math.hypot(dx, dy);
}

/** Does a circle overlap a rectangle? */
export function circleHitsRect(cx, cy, radius, rect) {
  const nearestX = clamp(cx, rect.x, rect.x + rect.width);
  const nearestY = clamp(cy, rect.y, rect.y + rect.height);
  const dx = cx - nearestX;
  const dy = cy - nearestY;
  return dx * dx + dy * dy < radius * radius;
}

function segmentHitsRect(x1, y1, x2, y2, rect) {
  // Slab test: walk the segment through the rectangle's x and y spans.
  const dx = x2 - x1;
  const dy = y2 - y1;
  let tMin = 0;
  let tMax = 1;
  const spans = [
    [dx, x1 - rect.x, x1 - (rect.x + rect.width)],
    [dy, y1 - rect.y, y1 - (rect.y + rect.height)],
  ];
  for (const [d, near, far] of spans) {
    if (d === 0) {
      if (near < 0 || far > 0) return false;
    } else {
      let t1 = near / -d;
      let t2 = far / -d;
      if (t1 > t2) {
        const tmp = t1;
        t1 = t2;
        t2 = tmp;
      }
      tMin = Math.max(tMin, t1);
      tMax = Math.min(tMax, t2);
      if (tMin > tMax) return false;
    }
  }
  return true;
}

/**
 * True when the segment from the watcher to the target crosses no
 * sight-blocking obstacle (walls and display cases block sight; ropes do not).
 */
export function hasLineOfSight(x1, y1, x2, y2, obstacles) {
  for (const obstacle of obstacles) {
    if (!obstacle.blocksSight) continue;
    if (segmentHitsRect(x1, y1, x2, y2, obstacle)) return false;
  }
  return true;
}

/**
 * True when the target point sits inside a vision cone (range + half-angle)
 * and the watcher has a clear line of sight to it.
 */
export function insideCone(eyeX, eyeY, facing, range, halfAngle, tx, ty, obstacles) {
  const dx = tx - eyeX;
  const dy = ty - eyeY;
  const dist = Math.hypot(dx, dy);
  if (dist > range) return false;
  if (dist < 1) return true;
  let angle = Math.atan2(dy, dx) - facing;
  while (angle > Math.PI) angle -= 2 * Math.PI;
  while (angle < -Math.PI) angle += 2 * Math.PI;
  if (Math.abs(angle) > halfAngle) return false;
  return hasLineOfSight(eyeX, eyeY, tx, ty, obstacles);
}

/** Is the point inside any smoke cloud? */
export function insideSmoke(x, y, smokes) {
  for (const smoke of smokes) {
    if (distance(x, y, smoke.x, smoke.y) <= smoke.radius) return true;
  }
  return false;
}
