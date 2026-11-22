// Node self-test for The Velvet Fox, round 2 — run it with `node selftest.mjs`
// from the repository root. It needs package.json {"type": "module"} so Node
// loads the game's ES modules. Ten checks; every one must pass before the
// entry is bundled. No browser, no network: the pilot plays the real rules.
import { World } from './game/src/world.js';
import { autopilotInput } from './game/src/pilot.js';
import { LEVELS } from './game/src/levels.js';
import { GUARD_KINDS, LASER } from './game/src/config.js';
import { beamHitsPoint, laserBeamSegment } from './game/src/hazards.js';

const STEP = 1 / 60;
const IDLE = { moveX: 0, moveY: 0, sneak: false, coinTarget: null, useSmoke: false, useEmp: false };
let passed = 0;
let failed = 0;

function check(name, ok, detail = '') {
  if (ok) {
    passed += 1;
    console.log(`PASS ${name}`);
  } else {
    failed += 1;
    console.log(`FAIL ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

function stepFor(world, seconds, input = IDLE) {
  const frames = Math.round(seconds / STEP);
  for (let i = 0; i < frames; i += 1) world.step(STEP, input);
}

function playFull(seed = 1) {
  const world = new World(seed);
  const state = { waits: 0 };
  let seconds = 0;
  for (let i = 0; i < 36000; i += 1) {
    world.step(STEP, autopilotInput(world, state));
    seconds += STEP;
    if (world.phase === 'win' || world.phase === 'over') break;
  }
  return { phase: world.phase, score: world.score, seconds, lives: world.lives, caught: world.timesCaught };
}

// 1. Five rooms.
check('five rooms', LEVELS.length === 5, `got ${LEVELS.length}`);

// 2. The pilot wins the whole job.
const run = playFull(1);
check('pilot wins all five rooms', run.phase === 'win', `phase=${run.phase} score=${run.score} caught=${run.caught}`);

// 3. Two runs with the same seed score the same.
const again = playFull(1);
check('deterministic score', again.score === run.score, `${run.score} vs ${again.score}`);

// 4. A laser beam trips the alarm.
{
  const world = new World(1);
  world.resetLevel(4);
  const laser = world.lasers[0];
  const segment = laserBeamSegment(laser, world.level.obstacles);
  const midX = (segment.x1 + segment.x2) / 2;
  const midY = (segment.y1 + segment.y2) / 2;
  check('beam geometry covers its midpoint', beamHitsPoint(segment, laser.x, laser.y, midX, midY, 13, LASER.beamHalfWidth, world.level.obstacles));
  world.player.x = midX;
  world.player.y = midY;
  const before = world.alarm;
  stepFor(world, 1);
  check('standing in a beam raises the alarm', world.alarm > before, `alarm ${before} -> ${world.alarm}`);
}

// 5. The fuse box cuts the lasers.
{
  const world = new World(1);
  world.resetLevel(4);
  world.player.x = world.level.fuseBox.x;
  world.player.y = world.level.fuseBox.y;
  stepFor(world, 2);
  check('fuse box disables the lasers', world.fuseDisabled === true, `fuseDisabled=${world.fuseDisabled}`);
}

// 6. The safe only opens after cracking it.
{
  const world = new World(1);
  world.resetLevel(4);
  world.guards.forEach((g) => { g.x = 60; g.y = 700; });
  world.cameras.forEach((c) => { c.blindLeft = 999; });
  const artifact = world.loot.find((item) => item.kind === 'artifact');
  world.player.x = artifact.x;
  world.player.y = artifact.y;
  stepFor(world, 1);
  check('safe does not open at once', artifact.taken === false && world.artifactProgress > 0, `progress=${world.artifactProgress.toFixed(2)}`);
  stepFor(world, 3);
  check('safe opens after the crack', artifact.taken === true, `taken=${artifact.taken}`);
}

// 7. EMP blinds every camera.
{
  const world = new World(1);
  world.resetLevel(0);
  world.step(STEP, { ...IDLE, useEmp: true });
  check('EMP blinds the cameras', world.cameras.every((c) => c.blindLeft > 0), `blindLeft=${world.cameras.map((c) => c.blindLeft.toFixed(1)).join(',')}`);
  stepFor(world, 9);
  check('EMP wears off', world.cameras.every((c) => c.blindLeft <= 0));
}

// 8. A sentry turns but never walks.
{
  const world = new World(1);
  world.resetLevel(3);
  const sentry = world.guards.find((g) => g.kind === 'sentry');
  const x = sentry.x;
  const y = sentry.y;
  const angle = sentry.angle;
  stepFor(world, 5);
  check('sentry holds its post', sentry.x === x && sentry.y === y && sentry.angle !== angle, `angle ${angle.toFixed(2)} -> ${sentry.angle.toFixed(2)}`);
}

// 9. A hound is faster and shorter-sighted than a patrol guard.
check(
  'hound outruns a patrol guard',
  GUARD_KINDS.hound.patrolSpeed > GUARD_KINDS.patrol.patrolSpeed && GUARD_KINDS.hound.coneRange < GUARD_KINDS.patrol.coneRange,
  JSON.stringify(GUARD_KINDS.hound),
);

// 10. No NaN anywhere after the full job.
{
  const world = new World(1);
  const state = { waits: 0 };
  for (let i = 0; i < 36000; i += 1) {
    world.step(STEP, autopilotInput(world, state));
    if (world.phase === 'win' || world.phase === 'over') break;
  }
  const clean = Number.isFinite(world.score) && Number.isFinite(world.player.x) && Number.isFinite(world.alarm);
  check('state stays finite', clean && world.phase === 'win', `phase=${world.phase}`);
}

console.log(`\n${passed} passed, ${failed} failed.`);
process.exit(failed === 0 ? 0 : 1);
