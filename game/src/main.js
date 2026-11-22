// The Velvet Fox — game loop and screens. Wires the world, the input, the
// sound and the renderer together; nothing here knows how a guard thinks.
import { VIEW } from './config.js';
import { Input } from './input.js';
import { Sound } from './audio.js';
import { World, EVENT_CAUGHT, EVENT_COIN, EVENT_EMP, EVENT_FUSE, EVENT_LEVEL_DONE, EVENT_OVER, EVENT_PICKUP, EVENT_SMOKE, EVENT_WIN } from './world.js';
import { render, SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const statusLine = document.getElementById('status');
canvas.width = VIEW.width;
canvas.height = VIEW.height;
const ctx = canvas.getContext('2d');

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seed = Number(params.get('seed') ?? 1) || 1;

const world = new World(seed);
const input = new Input(canvas);
const sound = new Sound();

let screen = SCREEN_TITLE;
let best = Number(window.localStorage?.getItem('velvet-fox-best') ?? 0) || 0;
let banner = null;
let bannerSub = '';
let bannerLeft = 0;
let lastLevelIndex = 0;
let paused = false;
let time = 0;
let lastTimestamp = 0;

function showLevelBanner() {
  banner = world.level.name;
  bannerSub = world.level.intro;
  bannerLeft = 2.6;
}

function startGame() {
  sound.ensure();
  world.score = 0;
  world.lives = 3;
  world.totalLootTaken = 0;
  world.totalLootValue = 0;
  world.coinsUsed = 0;
  world.smokesUsed = 0;
  world.empsUsed = 0;
  world.timesCaught = 0;
  world.resetLevel(0);
  lastLevelIndex = 0;
  screen = SCREEN_PLAY;
  showLevelBanner();
  announce('The job begins. Take the artifact, then reach the exit.');
}

function announce(text) {
  if (statusLine) statusLine.textContent = text;
}

function handleEvents(events) {
  for (const event of events) {
    if (event === EVENT_PICKUP) {
      const artifact = world.loot.find((item) => item.taken && item.kind === 'artifact');
      if (artifact && world.artifactTaken()) sound.artifact();
      else sound.pickup();
      announce(`Loot taken. Score ${world.score}.`);
    } else if (event === EVENT_COIN) {
      sound.coin();
    } else if (event === EVENT_SMOKE) {
      sound.smoke();
    } else if (event === EVENT_EMP) {
      sound.emp();
    } else if (event === EVENT_FUSE) {
      sound.fuse();
      announce('Lasers cut. The vault is open ground now.');
    } else if (event === EVENT_CAUGHT) {
      sound.caught();
      sound.stopAlarm();
      announce(`Caught! Lives left: ${world.lives}.`);
    } else if (event === EVENT_LEVEL_DONE) {
      sound.levelDone();
      announce(`Room cleared. Score ${world.score}.`);
    } else if (event === EVENT_WIN) {
      sound.win();
      if (world.score > best) {
        best = world.score;
        try {
          window.localStorage?.setItem('velvet-fox-best', String(best));
        } catch {
          // Private mode: the best score just does not persist.
        }
      }
      screen = SCREEN_WIN;
      announce(`All five treasures are yours. Final score ${world.score}.`);
    } else if (event === EVENT_OVER) {
      sound.caught();
      screen = SCREEN_OVER;
      announce('The fox is caught. Game over.');
    }
  }
  if (world.seen) sound.startAlarm();
  else sound.stopAlarm();
}

function frame(timestamp) {
  const dt = Math.min(0.05, (timestamp - lastTimestamp) / 1000 || 0);
  lastTimestamp = timestamp;
  time += dt;

  if (input.wasPressed('KeyM')) {
    sound.ensure();
    const muted = sound.toggleMute();
    announce(muted ? 'Sound muted.' : 'Sound on.');
  }
  if (screen === SCREEN_TITLE) {
    if (input.wasPressed('Enter') || input.wasPressed('Space') || input.consumeClick()) startGame();
  } else if (screen === SCREEN_WIN || screen === SCREEN_OVER) {
    if (input.wasPressed('Enter') || input.wasPressed('Space') || input.consumeClick()) {
      screen = SCREEN_TITLE;
      world.resetLevel(0);
    }
  } else {
    if (input.wasPressed('KeyP') || input.wasPressed('Escape')) {
      paused = !paused;
      announce(paused ? 'Paused.' : 'Back to the job.');
    }
    if (input.wasPressed('KeyR')) {
      world.resetLevel(world.levelIndex);
      showLevelBanner();
      announce('Room restarted.');
    }
    if (!paused) {
      const events = world.step(dt, input.frame(world.player.angle));
      if (world.levelIndex !== lastLevelIndex) {
        lastLevelIndex = world.levelIndex;
        showLevelBanner();
      }
      handleEvents(events);
    }
  }
  if (bannerLeft > 0) {
    bannerLeft -= dt;
    if (bannerLeft <= 0) {
      banner = null;
      bannerSub = '';
    }
  }
  render(ctx, world, { screen, time, best, banner, bannerSub, paused, muted: sound.muted });
  window.requestAnimationFrame(frame);
}

if (shotName) {
  // Screenshot mode: stage one deterministic scene and draw it once.
  const staged = stageShot(shotName, world);
  screen = staged.screen;
  best = staged.best;
  render(ctx, world, { screen, time: 1.2, best, banner: null, bannerSub: '', paused: false, muted: false });
  announce(`Screenshot scene: ${shotName}.`);
} else {
  window.requestAnimationFrame(frame);
}
