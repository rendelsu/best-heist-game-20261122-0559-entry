// The Velvet Fox — game state and rules. Pure logic, no DOM, so the same
// module runs in the browser and in the Node self-test.
// A step returns the events that happened, so the renderer and the sound
// module can react without reading the world apart.
import { CAMERA, FUSE, GUARD, GUARD_KINDS, LASER, LOOT_POINTS, LIVES_START, PLAYER, SAFE, TIME_BONUS_PER_SECOND, TOOLS } from './config.js';
import { circleHitsRect, distance, hasLineOfSight, insideCone, insideSmoke } from './geometry.js';
import { beamHitsPoint, laserBeamSegment } from './hazards.js';
import { LEVELS } from './levels.js';
import { makeRandom } from './random.js';

export const EVENT_PICKUP = 'pickup';
export const EVENT_CAUGHT = 'caught';
export const EVENT_TIMEOUT = 'timeout';
export const EVENT_LEVEL_DONE = 'level-done';
export const EVENT_WIN = 'win';
export const EVENT_OVER = 'over';
export const EVENT_COIN = 'coin';
export const EVENT_SMOKE = 'smoke';
export const EVENT_SEEN = 'seen';
export const EVENT_FUSE = 'fuse';
export const EVENT_EMP = 'emp';

const CAUGHT_FREEZE = 1.6;
const LEVEL_DONE_FREEZE = 2.0;
const COIN_LIFETIME = 6;
const LOOK_AROUND_SECONDS = 3;
// Past this alarm the museum is on edge: patrols quicken and cameras sweep faster.
const ALERT_ALARM = 50;
const ALERT_FACTOR = 1.25;

/** A fresh guard on its first waypoint, facing along its patrol. */
function spawnGuard(spec) {
  const kind = spec.kind ?? 'patrol';
  const stats = GUARD_KINDS[kind] ?? GUARD_KINDS.patrol;
  const first = spec.waypoints[0];
  const second = spec.waypoints[1] ?? first;
  return {
    x: first.x,
    y: first.y,
    angle: kind === 'sentry' ? (spec.baseAngle ?? 0) : Math.atan2(second.y - first.y, second.x - first.x),
    waypointIndex: 1 % spec.waypoints.length,
    pauseLeft: 0,
    scanPhase: 0,
    mode: 'patrol',
    target: null,
    lookLeft: 0,
    // If a patrol line ever ran into furniture, the guard would push
    // against it forever; stuckSeconds lets it give up and move on.
    stuckSeconds: 0,
    lastX: first.x,
    lastY: first.y,
    kind,
    range: stats.coneRange,
    halfAngle: stats.coneHalfAngle,
    patrolSpeed: stats.patrolSpeed,
    investigateSpeed: stats.investigateSpeed,
    hearRadius: stats.hearRadius,
    baseAngle: spec.baseAngle ?? 0,
    sweep: spec.sweep ?? 0,
    sweepSpeed: spec.speed ?? 0.5,
    spec,
  };
}

function spawnCamera(spec) {
  return { x: spec.x, y: spec.y, angle: spec.baseAngle, time: 0, blindLeft: 0, spec };
}

function spawnLaser(spec) {
  return { x: spec.x, y: spec.y, angle: spec.baseAngle, time: 0, spec };
}

export class World {
  constructor(seed = 1) {
    this.random = makeRandom(seed);
    this.score = 0;
    this.lives = LIVES_START;
    this.levelIndex = 0;
    this.phase = 'play';
    this.phaseTime = 0;
    this.totalLootTaken = 0;
    this.totalLootValue = 0;
    this.coinsUsed = 0;
    this.smokesUsed = 0;
    this.empsUsed = 0;
    this.timesCaught = 0;
    this.resetLevel(0);
  }

  get level() {
    return LEVELS[this.levelIndex];
  }

  get timeLeft() {
    return this.timeLeftSeconds;
  }

  resetLevel(index) {
    const level = LEVELS[index];
    this.levelIndex = index;
    this.player = { x: level.start.x, y: level.start.y, angle: 0, sneaking: false };
    this.guards = level.guards.map(spawnGuard);
    this.cameras = level.cameras.map(spawnCamera);
    this.lasers = (level.lasers ?? []).map(spawnLaser);
    this.loot = level.loot.map((item) => ({ ...item, taken: false }));
    this.alarm = 0;
    this.timeLeftSeconds = level.timeLimit;
    this.coins = TOOLS.coinStart;
    this.smokes = TOOLS.smokeStart;
    this.emps = TOOLS.empStart;
    this.smokeClouds = [];
    this.coin = null;
    this.seen = false;
    this.fuseProgress = 0;
    this.fuseDisabled = false;
    this.artifactProgress = 0;
    this.phase = 'play';
    this.phaseTime = 0;
  }

  artifactTaken() {
    return this.loot.some((item) => item.kind === 'artifact' && item.taken);
  }

  lootTakenCount() {
    return this.loot.filter((item) => item.taken).length;
  }

  /** Move a circle through the room, sliding along obstacles. */
  moveCircle(body, dx, dy, radius) {
    const obstacles = this.level.obstacles;
    const nextX = body.x + dx;
    let blocked = false;
    for (const obstacle of obstacles) {
      if (circleHitsRect(nextX, body.y, radius, obstacle)) {
        blocked = true;
        break;
      }
    }
    if (!blocked) body.x = nextX;
    const nextY = body.y + dy;
    blocked = false;
    for (const obstacle of obstacles) {
      if (circleHitsRect(body.x, nextY, radius, obstacle)) {
        blocked = true;
        break;
      }
    }
    if (!blocked) body.y = nextY;
    const top = 64 + 14 + radius;
    const bottom = 800 - 14 - radius;
    body.x = Math.max(14 + radius, Math.min(1280 - 14 - radius, body.x));
    body.y = Math.max(top, Math.min(bottom, body.y));
  }

  step(dt, input) {
    const events = [];
    if (this.phase === 'caught') {
      this.phaseTime -= dt;
      if (this.phaseTime <= 0) this.respawnAfterCaught();
      return events;
    }
    if (this.phase === 'levelDone') {
      this.phaseTime -= dt;
      if (this.phaseTime <= 0) this.advanceLevel(events);
      return events;
    }
    if (this.phase === 'win' || this.phase === 'over') return events;

    this.updateTimers(dt, events);
    if (events.includes(EVENT_CAUGHT) || events.includes(EVENT_OVER)) return events;
    this.updatePlayer(dt, input, events);
    this.updateGuards(dt, events);
    this.updateCameras(dt);
    this.updateLasers(dt);
    this.updateFuse(dt, events);
    this.updateDetection(dt, events);
    if (events.includes(EVENT_CAUGHT) || events.includes(EVENT_OVER)) return events;
    this.updateLoot(dt, events);
    this.updateExit(events);
    return events;
  }

  updateTimers(dt, events) {
    this.timeLeftSeconds -= dt;
    for (const cloud of this.smokeClouds) cloud.ttl -= dt;
    this.smokeClouds = this.smokeClouds.filter((cloud) => cloud.ttl > 0);
    if (this.coin) {
      this.coin.ttl -= dt;
      if (this.coin.ttl <= 0) this.coin = null;
    }
    if (this.timeLeftSeconds <= 0) {
      this.timeLeftSeconds = 0;
      events.push(EVENT_TIMEOUT);
      this.getCaught(events);
    }
  }

  updatePlayer(dt, input, events) {
    const player = this.player;
    const speed = input.sneak ? PLAYER.sneakSpeed : PLAYER.walkSpeed;
    player.sneaking = Boolean(input.sneak);
    const length = Math.hypot(input.moveX, input.moveY);
    if (length > 0.01) {
      const nx = input.moveX / Math.max(1, length);
      const ny = input.moveY / Math.max(1, length);
      player.angle = Math.atan2(ny, nx);
      this.moveCircle(player, nx * speed * dt, ny * speed * dt, PLAYER.radius);
    }
    if (input.coinTarget && this.coins > 0 && !this.coin) {
      const target = input.coinTarget;
      if (distance(player.x, player.y, target.x, target.y) <= TOOLS.coinThrowRange) {
        this.coins -= 1;
        this.coinsUsed += 1;
        this.score = Math.max(0, this.score - TOOLS.coinCost);
        this.coin = { x: target.x, y: target.y, ttl: COIN_LIFETIME };
        events.push(EVENT_COIN);
      }
    }
    if (input.useSmoke && this.smokes > 0) {
      this.smokes -= 1;
      this.smokesUsed += 1;
      this.score = Math.max(0, this.score - TOOLS.smokeCost);
      this.smokeClouds.push({ x: player.x, y: player.y, radius: TOOLS.smokeRadius, ttl: CAMERA.smokeBlindSeconds });
      events.push(EVENT_SMOKE);
    }
    if (input.useEmp && this.emps > 0) {
      this.emps -= 1;
      this.empsUsed += 1;
      this.score = Math.max(0, this.score - TOOLS.empCost);
      for (const camera of this.cameras) camera.blindLeft = TOOLS.empBlindSeconds;
      events.push(EVENT_EMP);
    }
  }

  updateGuards(dt) {
    const alertFactor = this.alarm >= ALERT_ALARM ? ALERT_FACTOR : 1;
    for (const guard of this.guards) {
      guard.scanPhase += dt;
      const beforeX = guard.x;
      const beforeY = guard.y;
      if (guard.kind === 'sentry') {
        // A sentry never leaves its post: it turns in place, sweeping its cone.
        guard.angle = guard.baseAngle + guard.sweep * Math.sin(guard.sweepSpeed * guard.scanPhase);
        continue;
      }
      if (guard.mode === 'investigate' && guard.target) {
        const dx = guard.target.x - guard.x;
        const dy = guard.target.y - guard.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 8) {
          guard.lookLeft -= dt;
          guard.angle += Math.sin(guard.scanPhase * 2.2) * 1.6 * dt;
          if (guard.lookLeft <= 0) {
            guard.mode = 'patrol';
            guard.target = null;
          }
        } else {
          guard.angle = Math.atan2(dy, dx);
          this.moveCircle(guard, (dx / dist) * guard.investigateSpeed * alertFactor * dt, (dy / dist) * guard.investigateSpeed * alertFactor * dt, GUARD.radius);
        }
        this.watchForStuck(guard, dt, beforeX, beforeY, () => {
          guard.mode = 'patrol';
          guard.target = null;
        });
        continue;
      }
      // A thrown coin within earshot pulls a patrolling guard over.
      // A hound hears it from much further away than a patrol guard.
      if (this.coin && guard.mode === 'patrol' && distance(guard.x, guard.y, this.coin.x, this.coin.y) <= guard.hearRadius) {
        guard.mode = 'investigate';
        guard.target = { x: this.coin.x, y: this.coin.y };
        guard.lookLeft = LOOK_AROUND_SECONDS;
        continue;
      }
      if (guard.pauseLeft > 0) {
        guard.pauseLeft -= dt;
        guard.angle += Math.sin(guard.scanPhase * 1.4) * 0.9 * dt;
        continue;
      }
      const waypoint = guard.spec.waypoints[guard.waypointIndex];
      const dx = waypoint.x - guard.x;
      const dy = waypoint.y - guard.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 6) {
        guard.waypointIndex = (guard.waypointIndex + 1) % guard.spec.waypoints.length;
        guard.pauseLeft = guard.spec.pauseSeconds;
        continue;
      }
      guard.angle = Math.atan2(dy, dx);
      this.moveCircle(guard, (dx / dist) * guard.patrolSpeed * alertFactor * dt, (dy / dist) * guard.patrolSpeed * alertFactor * dt, GUARD.radius);
      this.watchForStuck(guard, dt, beforeX, beforeY, () => {
        guard.waypointIndex = (guard.waypointIndex + 1) % guard.spec.waypoints.length;
        guard.pauseLeft = 0;
      });
    }
  }

  /** Give up on a destination the guard cannot reach (furniture in the way). */
  watchForStuck(guard, dt, beforeX, beforeY, giveUp) {
    const moved = Math.hypot(guard.x - beforeX, guard.y - beforeY);
    if (moved > 0.05) {
      guard.stuckSeconds = 0;
      return;
    }
    guard.stuckSeconds += dt;
    if (guard.stuckSeconds > 2) {
      guard.stuckSeconds = 0;
      giveUp();
    }
  }

  updateCameras(dt) {
    const alertFactor = this.alarm >= ALERT_ALARM ? ALERT_FACTOR : 1;
    for (const camera of this.cameras) {
      if (camera.blindLeft > 0) camera.blindLeft -= dt;
      camera.time += dt * alertFactor;
      camera.angle = camera.spec.baseAngle + camera.spec.sweep * Math.sin(camera.spec.speed * camera.time);
    }
  }

  updateLasers(dt) {
    for (const laser of this.lasers) {
      laser.time += dt;
      laser.angle = laser.spec.baseAngle + laser.spec.sweep * Math.sin(laser.spec.speed * laser.time);
    }
  }

  /** Stand at the fuse box to cut the room's lasers for good. */
  updateFuse(dt, events) {
    const box = this.level.fuseBox;
    if (!box || this.fuseDisabled) return;
    if (distance(this.player.x, this.player.y, box.x, box.y) <= FUSE.radius) {
      this.fuseProgress += dt / FUSE.channelSeconds;
      if (this.fuseProgress >= 1) {
        this.fuseProgress = 1;
        this.fuseDisabled = true;
        events.push(EVENT_FUSE);
      }
    } else {
      this.fuseProgress = Math.max(0, this.fuseProgress - dt / (FUSE.channelSeconds * 3));
    }
  }

  updateDetection(dt, events) {
    const player = this.player;
    const inSmoke = insideSmoke(player.x, player.y, this.smokeClouds);
    let seen = false;
    const sneakFactor = player.sneaking ? PLAYER.sneakFactor : 1;
    for (const guard of this.guards) {
      const guardBlind = insideSmoke(guard.x, guard.y, this.smokeClouds);
      if (!inSmoke && !guardBlind && insideCone(guard.x, guard.y, guard.angle, guard.range, guard.halfAngle, player.x, player.y, this.level.obstacles)) {
        seen = true;
        // A sentry keeps sweeping; a walking guard turns to face the thief.
        if (guard.kind !== 'sentry') guard.angle = Math.atan2(player.y - guard.y, player.x - guard.x);
        this.alarm += PLAYER.seenByGuardRate * sneakFactor * dt;
      }
    }
    for (const camera of this.cameras) {
      if (camera.blindLeft > 0) continue;
      const cameraBlind = insideSmoke(camera.x, camera.y, this.smokeClouds);
      if (!inSmoke && !cameraBlind && insideCone(camera.x, camera.y, camera.angle, CAMERA.coneRange, CAMERA.coneHalfAngle, player.x, player.y, this.level.obstacles)) {
        seen = true;
        this.alarm += PLAYER.seenByCameraRate * sneakFactor * dt;
      }
    }
    if (!this.fuseDisabled) {
      for (const laser of this.lasers) {
        const segment = laserBeamSegment(laser, this.level.obstacles);
        if (beamHitsPoint(segment, laser.x, laser.y, player.x, player.y, PLAYER.radius, LASER.beamHalfWidth, this.level.obstacles)) {
          seen = true;
          // Lasers do not care whether the thief is sneaking.
          this.alarm += LASER.alarmRate * dt;
        }
      }
    }
    if (seen) {
      if (!this.seen) events.push(EVENT_SEEN);
      this.seen = true;
    } else {
      this.seen = false;
      this.alarm = Math.max(0, this.alarm - PLAYER.alarmDecay * dt);
    }
    if (this.alarm >= 100) {
      this.alarm = 100;
      this.getCaught(events);
    }
  }

  getCaught(events) {
    this.timesCaught += 1;
    this.lives -= 1;
    events.push(EVENT_CAUGHT);
    if (this.lives <= 0) {
      this.phase = 'over';
      events.push(EVENT_OVER);
      return;
    }
    this.phase = 'caught';
    this.phaseTime = CAUGHT_FREEZE;
  }

  respawnAfterCaught() {
    const level = this.level;
    this.player.x = level.start.x;
    this.player.y = level.start.y;
    this.guards = level.guards.map(spawnGuard);
    this.alarm = 30;
    this.coin = null;
    this.smokeClouds = [];
    // A cut fuse stays cut; a half-cracked safe does not.
    this.artifactProgress = 0;
    this.phase = 'play';
  }

  takeLoot(item, events) {
    item.taken = true;
    this.score += LOOT_POINTS[item.kind];
    this.totalLootTaken += 1;
    this.totalLootValue += LOOT_POINTS[item.kind];
    events.push(EVENT_PICKUP);
  }

  updateLoot(dt, events) {
    for (const item of this.loot) {
      if (item.taken) continue;
      const d = distance(this.player.x, this.player.y, item.x, item.y);
      if (item.kind === 'artifact' && this.level.artifactChannelSeconds) {
        // The last artifact sits in a safe: stand beside it to crack it.
        // Walking away lets the crack decay, slowly, so a scare costs time.
        if (d <= SAFE.channelRadius) {
          this.artifactProgress += dt / this.level.artifactChannelSeconds;
          if (this.artifactProgress >= 1) this.takeLoot(item, events);
        } else {
          this.artifactProgress = Math.max(0, this.artifactProgress - dt / (this.level.artifactChannelSeconds * 3));
        }
        continue;
      }
      if (d < PLAYER.radius + 16) this.takeLoot(item, events);
    }
  }

  updateExit(events) {
    if (!this.artifactTaken()) return;
    const exit = this.level.exit;
    if (circleHitsRect(this.player.x, this.player.y, PLAYER.radius, exit)) {
      const bonus = Math.ceil(this.timeLeftSeconds) * TIME_BONUS_PER_SECOND;
      this.score += bonus;
      this.phase = 'levelDone';
      this.phaseTime = LEVEL_DONE_FREEZE;
      events.push(EVENT_LEVEL_DONE);
    }
  }

  advanceLevel(events) {
    if (this.levelIndex + 1 >= LEVELS.length) {
      this.phase = 'win';
      events.push(EVENT_WIN);
      return;
    }
    this.resetLevel(this.levelIndex + 1);
  }

  /** Lines of sight from a watcher to the player, for the renderer. */
  watcherSees(watcher, range, halfAngle) {
    return insideCone(watcher.x, watcher.y, watcher.angle, range, halfAngle, this.player.x, this.player.y, this.level.obstacles);
  }
}
