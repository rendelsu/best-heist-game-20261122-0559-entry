// Staged scenes for ?shot=start|play|vault|win. Each one plays the real
// rules forward from a fresh world with the autopilot, so every screenshot
// is a frame of a real game, and the same seed always gives the same frame.
import { World, EVENT_WIN } from './world.js';
import { autopilotInput } from './pilot.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';

const STEP = 1 / 60;
const START_SECONDS = 4;
const PLAY_SECONDS = 22;
const VAULT_SECONDS = 6;

function runPilot(world, seconds) {
  const state = { waits: 0 };
  for (let index = 0; index < seconds / STEP; index += 1) {
    world.step(STEP, autopilotInput(world, state));
    if (world.phase === 'win' || world.phase === 'over') break;
  }
}

/**
 * Set `world` to the named scene and return the screen to draw over it.
 * Unknown names stage the title screen.
 */
export function stageShot(name, world) {
  world.resetLevel(0);
  if (name === 'play') {
    runPilot(world, PLAY_SECONDS);
    return { screen: SCREEN_PLAY, best: 0 };
  }
  if (name === 'vault') {
    world.resetLevel(2);
    runPilot(world, VAULT_SECONDS);
    return { screen: SCREEN_PLAY, best: 0 };
  }
  if (name === 'win') {
    // Play the whole job through: up to 300 seconds of game time. The pilot
    // wins it; if it ever could not, the loop still ends on a real end state
    // instead of a posed one.
    const state = { waits: 0 };
    for (let index = 0; index < 18000; index += 1) {
      world.step(STEP, autopilotInput(world, state));
      if (world.phase === 'win' || world.phase === 'over') break;
    }
    return { screen: world.phase === 'win' ? SCREEN_WIN : SCREEN_OVER, best: world.score };
  }
  if (name === 'over') {
    // Walk straight into the nearest guard's cone until the alarm catches us.
    for (let index = 0; index < 600; index += 1) {
      const guard = world.guards[0];
      const dx = guard.x - world.player.x;
      const dy = guard.y - world.player.y;
      const length = Math.hypot(dx, dy) || 1;
      world.step(STEP, { moveX: dx / length, moveY: dy / length, sneak: false, coinTarget: null, useSmoke: false });
      if (world.phase === 'over') break;
    }
    return { screen: SCREEN_OVER, best: 0 };
  }
  for (let index = 0; index < START_SECONDS / STEP; index += 1) {
    world.step(STEP, { moveX: 0, moveY: 0, sneak: false, coinTarget: null, useSmoke: false });
  }
  return { screen: SCREEN_TITLE, best: 0 };
}

export { EVENT_WIN };
