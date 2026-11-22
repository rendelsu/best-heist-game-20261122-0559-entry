// A cautious autopilot: it steers the thief toward the nearest loot (the
// artifact first when the exit is the goal), keeps out of vision cones,
// and sneaks when a cone is near. It plays the real rules through World.step,
// so a staged screenshot — and the Node self-test — shows a game that is
// genuinely winnable, not a posed frame.
//
// Two layers: a coarse A* over the room finds a route around the walls
// (a purely greedy pilot dithers in front of a wall, because walking around
// it first costs a little distance), and a local step scorer then picks each
// move by where the thief would really end up — walls included, so pushing
// into a case scores no progress — plus a heavy penalty for ending up lit.
// Waiting is a candidate too, so the pilot holds still while a cone sweeps
// past — but after waiting ~3 seconds it dashes through, sneaking, rather
// than waiting out the level timer.
//
// Round 2: the pilot reads lasers like cones, cuts the lasers at the fuse
// box before anything else, and stands still to crack a safe — but only
// while nothing is watching it, or the crack is not worth the alarm.
import { CAMERA, FUSE, LASER, PLAYER, PLAY, SAFE } from './config.js';
import { circleHitsRect, distance, insideCone, insideSmoke } from './geometry.js';
import { beamHitsPoint, laserBeamSegment, pointToSegmentDistance } from './hazards.js';

const DIRECTIONS = [
  [0, -1], [1, -1], [1, 0], [1, 1],
  [0, 1], [-1, 1], [-1, 0], [-1, -1],
  [0, 0],
];

const CELL = 32;
const PLAN_RADIUS = 17;

function coneDanger(world, x, y) {
  // Two tiers: the real cone (stepping in raises the alarm) and a safety
  // margin around it (a tile a watcher could sweep onto next). The margin
  // steers the pilot around cones, but crossing it costs nothing in the
  // game — so it is a nudge, not a wall, or the pilot would wait forever
  // in front of a tile that is only nearly lit.
  let real = 0;
  let margin = 0;
  for (const guard of world.guards) {
    if (insideCone(guard.x, guard.y, guard.angle, guard.range, guard.halfAngle, x, y, world.level.obstacles)) real += 1;
    else if (insideCone(guard.x, guard.y, guard.angle, guard.range + 20, guard.halfAngle + 0.08, x, y, world.level.obstacles)) margin += 1;
  }
  for (const camera of world.cameras) {
    if (camera.blindLeft > 0) continue;
    if (insideCone(camera.x, camera.y, camera.angle, CAMERA.coneRange, CAMERA.coneHalfAngle, x, y, world.level.obstacles)) real += 1;
    else if (insideCone(camera.x, camera.y, camera.angle, CAMERA.coneRange + 20, CAMERA.coneHalfAngle + 0.08, x, y, world.level.obstacles)) margin += 1;
  }
  if (!world.fuseDisabled) {
    for (const laser of world.lasers) {
      const segment = laserBeamSegment(laser, world.level.obstacles);
      if (beamHitsPoint(segment, laser.x, laser.y, x, y, PLAYER.radius, LASER.beamHalfWidth, world.level.obstacles)) real += 2;
      else if (pointToSegmentDistance(x, y, segment) <= PLAYER.radius + 48) margin += 1;
    }
  }
  return { real, margin };
}

function nextTarget(world) {
  // Lasers first: the fuse box is the job before the job.
  if (world.level.fuseBox && !world.fuseDisabled) {
    return { x: world.level.fuseBox.x, y: world.level.fuseBox.y, fuse: true };
  }
  if (!world.artifactTaken()) {
    const artifact = world.loot.find((item) => item.kind === 'artifact' && !item.taken);
    if (artifact) return artifact;
  }
  if (world.artifactTaken()) {
    const exit = world.level.exit;
    return { x: exit.x + exit.width / 2, y: exit.y + exit.height / 2 };
  }
  let best = null;
  let bestDistance = Infinity;
  for (const item of world.loot) {
    if (item.taken) continue;
    const d = distance(world.player.x, world.player.y, item.x, item.y);
    if (d < bestDistance) {
      bestDistance = d;
      best = item;
    }
  }
  return best;
}

// --- Coarse A* over the room -------------------------------------------

function cellBlocked(world, col, row) {
  const x = (col + 0.5) * CELL;
  const y = PLAY.y + (row + 0.5) * CELL;
  for (const obstacle of world.level.obstacles) {
    if (circleHitsRect(x, y, PLAN_RADIUS, obstacle)) return true;
  }
  return false;
}

export function planRoute(world, target) {
  const cols = Math.ceil(1280 / CELL);
  const rows = Math.ceil(PLAY.height / CELL);
  const startCol = Math.max(0, Math.min(cols - 1, Math.floor(world.player.x / CELL)));
  const startRow = Math.max(0, Math.min(rows - 1, Math.floor((world.player.y - PLAY.y) / CELL)));
  const key = (col, row) => row * cols + col;
  const blocked = new Map();
  const isBlocked = (col, row) => {
    if (col < 0 || row < 0 || col >= cols || row >= rows) return true;
    const k = key(col, row);
    if (!blocked.has(k)) blocked.set(k, cellBlocked(world, col, row));
    return blocked.get(k);
  };
  const isGoal = (col, row) => {
    const x = (col + 0.5) * CELL;
    const y = PLAY.y + (row + 0.5) * CELL;
    return distance(x, y, target.x, target.y) <= 30;
  };
  const heuristic = (col, row) => {
    const dx = Math.abs(col * CELL + CELL / 2 - target.x) / CELL;
    const dy = Math.abs(PLAY.y + row * CELL + CELL / 2 - target.y) / CELL;
    return Math.max(dx, dy) + 0.41 * Math.min(dx, dy);
  };
  if (isGoal(startCol, startRow)) return [];
  const open = [{ col: startCol, row: startRow, g: 0, f: heuristic(startCol, startRow), parent: null }];
  const bestG = new Map([[key(startCol, startRow), 0]]);
  const closed = new Set();
  const moves = [
    [1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1],
    [1, 1, 1.41], [1, -1, 1.41], [-1, 1, 1.41], [-1, -1, 1.41],
  ];
  while (open.length > 0) {
    let bestIndex = 0;
    for (let i = 1; i < open.length; i += 1) {
      if (open[i].f < open[bestIndex].f) bestIndex = i;
    }
    const node = open.splice(bestIndex, 1)[0];
    const nodeKey = key(node.col, node.row);
    if (closed.has(nodeKey)) continue;
    closed.add(nodeKey);
    if (isGoal(node.col, node.row)) {
      const path = [];
      let current = node;
      while (current.parent) {
        path.unshift({ x: (current.col + 0.5) * CELL, y: PLAY.y + (current.row + 0.5) * CELL });
        current = current.parent;
      }
      return path;
    }
    for (const [dc, dr, cost] of moves) {
      const col = node.col + dc;
      const row = node.row + dr;
      if (isBlocked(col, row)) continue;
      // No cutting corners through a wall's edge.
      if (dc !== 0 && dr !== 0 && (isBlocked(node.col + dc, node.row) || isBlocked(node.col, node.row + dr))) continue;
      const g = node.g + cost;
      const k = key(col, row);
      if (bestG.has(k) && bestG.get(k) <= g) continue;
      bestG.set(k, g);
      open.push({ col, row, g, f: g + heuristic(col, row), parent: node });
    }
  }
  return null;
}

/**
 * One input frame for the world: { moveX, moveY, sneak, coinTarget, useSmoke, useEmp }.
 * `state` ({ waits }) is the pilot's memory across frames; the caller keeps
 * one per playthrough. The pilot never throws coins or smoke — it wins by
 * reading the cones.
 */
export function autopilotInput(world, state = { waits: 0 }) {
  const player = world.player;
  const target = nextTarget(world);
  if (!target) return { moveX: 0, moveY: 0, sneak: false, coinTarget: null, useSmoke: false, useEmp: false };
  // Cracking a safe or cutting the lasers means standing still — but only
  // while nothing is watching. If a cone is on the spot, walk out and come
  // back; the crack decays slowly, so a scare costs time, not the job.
  const here = coneDanger(world, player.x, player.y);
  const channelingFuse = Boolean(target.fuse) && distance(player.x, player.y, target.x, target.y) <= FUSE.radius;
  const channelingSafe =
    target.kind === 'artifact' &&
    world.level.artifactChannelSeconds &&
    distance(player.x, player.y, target.x, target.y) <= SAFE.channelRadius;
  if ((channelingFuse || channelingSafe) && here.real === 0) {
    state.waits = 0;
    return { moveX: 0, moveY: 0, sneak: false, coinTarget: null, useSmoke: false, useEmp: false };
  }
  // The local goal is the next waypoint of the A* route (or the target
  // itself when the route is a straight line or cannot be planned).
  let goal = target;
  const route = planRoute(world, target);
  if (route && route.length > 0) {
    goal = route.find((point) => distance(player.x, player.y, point.x, point.y) > 24) ?? target;
  }
  const inSmoke = insideSmoke(player.x, player.y, world.smokeClouds);
  const realWeight = state.waits > 180 ? 150 : 900;
  const startDistance = distance(player.x, player.y, goal.x, goal.y);
  let best = [0, 0];
  let bestScore = Infinity;
  let anyDanger = false;
  const scored = [];
  for (const [dx, dy] of DIRECTIONS) {
    // Where would this step really leave the thief, walls included?
    const probe = { x: player.x, y: player.y };
    const step = 26;
    world.moveCircle(probe, dx * step, dy * step, PLAYER.radius);
    const moved = Math.hypot(probe.x - player.x, probe.y - player.y) > 0.01;
    const waiting = dx === 0 && dy === 0;
    // A step that leaves the thief exactly where they are is no step at
    // all: a corner can wedge the circle so the direct line is blocked on
    // both axes, and scoring it as "free" would pin the pilot there. Skip
    // those, so the pilot slides around the obstacle instead.
    if (!moved && !waiting) continue;
    const danger = coneDanger(world, probe.x, probe.y);
    if (danger.real > 0 || danger.margin > 0) anyDanger = true;
    const progress = distance(probe.x, probe.y, goal.x, goal.y) - startDistance;
    // Waiting grows stale: it is only worth it while a cone sweeps past,
    // so the longer the pilot has waited, the more a detour appeals.
    // With no danger anywhere, waiting is never worth it — a wedge must be
    // walked around, not waited out.
    const dangerCost = danger.real * realWeight + danger.margin * 40;
    const score = waiting
      ? 8 + state.waits * 0.5 + dangerCost
      : progress + dangerCost;
    scored.push({ dir: [dx, dy], score, waiting });
  }
  for (const candidate of scored) {
    if (candidate.waiting && !anyDanger) continue;
    if (candidate.score < bestScore) {
      bestScore = candidate.score;
      best = candidate.dir;
    }
  }
  if (best[0] === 0 && best[1] === 0) state.waits += 1;
  else state.waits = 0;
  const endDanger = coneDanger(world, player.x + best[0] * 26, player.y + best[1] * 26);
  const sneak = endDanger.real > 0 || endDanger.margin > 0 || coneDanger(world, player.x, player.y).real > 0;
  return { moveX: best[0], moveY: best[1], sneak, coinTarget: null, useSmoke: false, useEmp: false };
}

/** Is the thief standing where a watcher can see them right now? */
export function thiefIsSeen(world) {
  const player = world.player;
  for (const guard of world.guards) {
    if (insideCone(guard.x, guard.y, guard.angle, guard.range, guard.halfAngle, player.x, player.y, world.level.obstacles)) return true;
  }
  for (const camera of world.cameras) {
    if (camera.blindLeft > 0) continue;
    if (insideCone(camera.x, camera.y, camera.angle, CAMERA.coneRange, CAMERA.coneHalfAngle, player.x, player.y, world.level.obstacles)) return true;
  }
  return false;
}
