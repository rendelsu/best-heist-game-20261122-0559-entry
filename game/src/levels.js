// The three rooms of the Meridian Museum job. Each level is one screen:
// the entry door, the loot, the guards and cameras, and the exit — all
// visible in one frame, with more than one route between them.
//
// Obstacles: { x, y, width, height, kind } — kind 'wall' and 'case' block
// movement and sight; 'rope' blocks movement only (a low velvet rope).
// Guards patrol their waypoints in a loop. Cameras sweep around a base angle.
// Loot: { x, y, kind: 'gem' | 'painting' | 'artifact', name }.
// The artifact is the job's target: the exit only opens once it is taken.
import { PLAY } from './config.js';

const TOP = PLAY.y;
const BOTTOM = PLAY.y + PLAY.height;

function wall(x, y, width, height) {
  return { x, y, width, height, kind: 'wall', blocksSight: true };
}
function displayCase(x, y, width, height) {
  return { x, y, width, height, kind: 'case', blocksSight: true };
}
function rope(x, y, width, height) {
  return { x, y, width, height, kind: 'rope', blocksSight: false };
}

export const LEVELS = [
  {
    name: 'I — The Marble Gallery',
    intro: 'Lift the Moonlight Opal, then slip out the east door.',
    timeLimit: 150,
    start: { x: 70, y: BOTTOM - 70 },
    exit: { x: 1190, y: TOP + 30, width: 64, height: 96 },
    obstacles: [
      // Outer walls (the room shell, with the entry gap at the south-west
      // and the exit gap at the north-east handled by the exit rect itself).
      wall(0, TOP, 1280, 14),
      wall(0, BOTTOM - 14, 1280, 14),
      wall(0, TOP, 14, PLAY.height),
      wall(1266, TOP, 14, PLAY.height),
      // A central colonnade: two routes around it, north and south.
      wall(430, TOP + 130, 26, 300),
      wall(430, TOP + 520, 26, 150),
      wall(820, TOP + 40, 26, 190),
      wall(820, TOP + 320, 26, 300),
      // Display cases the thief can hide behind.
      displayCase(180, TOP + 130, 150, 70),
      displayCase(180, TOP + 480, 150, 70),
      displayCase(620, TOP + 300, 150, 70),
      displayCase(1010, TOP + 430, 150, 70),
      // Velvet ropes funnel the middle lane.
      rope(560, TOP + 90, 180, 10),
      rope(560, TOP + 590, 180, 10),
    ],
    guards: [
      {
        waypoints: [
          { x: 560, y: TOP + 180 },
          { x: 560, y: TOP + 560 },
        ],
        pauseSeconds: 1.2,
      },
      {
        waypoints: [
          { x: 980, y: TOP + 86 },
          { x: 1140, y: TOP + 86 },
          { x: 1140, y: TOP + 226 },
          { x: 980, y: TOP + 226 },
        ],
        pauseSeconds: 0.8,
      },
    ],
    cameras: [
      { x: 456, y: TOP + 60, baseAngle: Math.PI / 2, sweep: 0.85, speed: 0.55 },
      { x: 846, y: TOP + 640, baseAngle: -Math.PI / 2, sweep: 0.9, speed: 0.45 },
    ],
    loot: [
      { x: 255, y: TOP + 236, kind: 'gem', name: 'Topaz' },
      { x: 695, y: TOP + 236, kind: 'gem', name: 'Amethyst' },
      { x: 1085, y: TOP + 556, kind: 'gem', name: 'Ruby' },
      { x: 255, y: TOP + 576, kind: 'painting', name: 'Lady in Gold' },
      { x: 1085, y: TOP + 256, kind: 'artifact', name: 'Moonlight Opal' },
    ],
  },
  {
    name: 'II — The Gilded Corridor',
    intro: 'The Sunken Crown sits behind the long hall. Mind the cameras.',
    timeLimit: 180,
    start: { x: 70, y: TOP + 70 },
    exit: { x: 1190, y: BOTTOM - 130, width: 64, height: 96 },
    obstacles: [
      wall(0, TOP, 1280, 14),
      wall(0, BOTTOM - 14, 1280, 14),
      wall(0, TOP, 14, PLAY.height),
      wall(1266, TOP, 14, PLAY.height),
      // A zig-zag hall: three lanes, two crossings.
      wall(300, TOP + 40, 26, 260),
      wall(300, TOP + 400, 26, 260),
      wall(640, TOP + 40, 26, 260),
      wall(640, TOP + 400, 26, 260),
      wall(980, TOP + 40, 26, 260),
      wall(980, TOP + 400, 26, 260),
      displayCase(150, TOP + 330, 150, 70),
      displayCase(480, TOP + 330, 150, 70),
      displayCase(810, TOP + 330, 150, 70),
      displayCase(1110, TOP + 120, 130, 70),
      rope(180, TOP + 180, 120, 10),
      rope(840, TOP + 480, 120, 10),
    ],
    guards: [
      {
        waypoints: [
          { x: 420, y: TOP + 130 },
          { x: 420, y: TOP + 600 },
        ],
        pauseSeconds: 1.0,
      },
      {
        waypoints: [
          { x: 740, y: TOP + 600 },
          { x: 740, y: TOP + 130 },
        ],
        pauseSeconds: 1.0,
      },
      {
        waypoints: [
          { x: 1130, y: TOP + 300 },
          { x: 1130, y: TOP + 620 },
          { x: 1130, y: TOP + 300 },
        ],
        pauseSeconds: 0.6,
      },
    ],
    cameras: [
      { x: 326, y: TOP + 60, baseAngle: Math.PI / 2, sweep: 0.8, speed: 0.6 },
      { x: 666, y: TOP + 640, baseAngle: -Math.PI / 2, sweep: 0.8, speed: 0.5 },
      { x: 1006, y: TOP + 60, baseAngle: Math.PI / 2, sweep: 0.95, speed: 0.65 },
    ],
    loot: [
      { x: 225, y: TOP + 456, kind: 'gem', name: 'Emerald' },
      { x: 555, y: TOP + 456, kind: 'gem', name: 'Sapphire' },
      { x: 885, y: TOP + 456, kind: 'gem', name: 'Opal' },
      { x: 1175, y: TOP + 236, kind: 'gem', name: 'Diamond' },
      { x: 225, y: TOP + 120, kind: 'painting', name: 'The Fox Hunt' },
      { x: 885, y: TOP + 600, kind: 'painting', name: 'Gilded Dawn' },
      { x: 555, y: TOP + 120, kind: 'artifact', name: 'Sunken Crown' },
    ],
  },
  {
    name: 'III — The Sapphire Sanctum',
    intro: 'The Star Sapphire. Four cameras, three guards, one way out.',
    timeLimit: 210,
    start: { x: 70, y: BOTTOM - 70 },
    exit: { x: 1190, y: TOP + 30, width: 64, height: 96 },
    obstacles: [
      wall(0, TOP, 1280, 14),
      wall(0, BOTTOM - 14, 1280, 14),
      wall(0, TOP, 14, PLAY.height),
      wall(1266, TOP, 14, PLAY.height),
      // The vault ring: a square of cases around the pedestal, with gaps at
      // the south-west and north-east corners so the thief must pick an
      // approach — the pedestal itself sits on open floor.
      displayCase(520, TOP + 150, 240, 50),
      displayCase(520, TOP + 490, 240, 50),
      displayCase(520, TOP + 200, 50, 200),
      displayCase(710, TOP + 286, 50, 204),
      // Side halls with cover.
      wall(330, TOP + 90, 26, 240),
      wall(330, TOP + 430, 26, 210),
      wall(950, TOP + 90, 26, 240),
      wall(950, TOP + 430, 26, 210),
      displayCase(150, TOP + 300, 140, 70),
      displayCase(990, TOP + 300, 140, 70),
      rope(420, TOP + 120, 160, 10),
      rope(700, TOP + 626, 160, 10),
    ],
    guards: [
      {
        waypoints: [
          { x: 470, y: TOP + 236 },
          { x: 470, y: TOP + 536 },
        ],
        pauseSeconds: 0.7,
      },
      {
        waypoints: [
          { x: 420, y: TOP + 566 },
          { x: 860, y: TOP + 566 },
        ],
        pauseSeconds: 0.9,
      },
      {
        waypoints: [
          { x: 1180, y: TOP + 140 },
          { x: 1180, y: TOP + 560 },
        ],
        pauseSeconds: 0.8,
      },
    ],
    cameras: [
      { x: 570, y: TOP + 200, baseAngle: Math.PI / 2, sweep: 1.0, speed: 0.7 },
      { x: 760, y: TOP + 200, baseAngle: Math.PI / 2, sweep: 1.0, speed: 0.7 },
      { x: 570, y: TOP + 490, baseAngle: -Math.PI / 2, sweep: 1.0, speed: 0.6 },
      { x: 760, y: TOP + 490, baseAngle: -Math.PI / 2, sweep: 1.0, speed: 0.6 },
    ],
    loot: [
      { x: 220, y: TOP + 416, kind: 'gem', name: 'Garnet' },
      { x: 1060, y: TOP + 416, kind: 'gem', name: 'Aquamarine' },
      { x: 420, y: TOP + 600, kind: 'gem', name: 'Pearl' },
      { x: 860, y: TOP + 90, kind: 'gem', name: 'Tourmaline' },
      { x: 220, y: TOP + 120, kind: 'painting', name: 'Midnight Fox' },
      { x: 1060, y: TOP + 600, kind: 'painting', name: 'The Getaway' },
      { x: 640, y: TOP + 345, kind: 'artifact', name: 'Star Sapphire' },
    ],
  },
];
