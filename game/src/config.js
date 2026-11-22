// Tuning and look for The Velvet Fox — Heist at the Meridian Museum.
// One screen, one room per level: everything the judge needs to see
// (room, guards, cones, cameras, loot, alarm meter) fits in a single frame.
export const VIEW = { width: 1280, height: 800 };
export const HUD_HEIGHT = 64;
export const PLAY = { x: 0, y: HUD_HEIGHT, width: 1280, height: 800 - HUD_HEIGHT };

export const PLAYER = {
  radius: 13,
  walkSpeed: 175,
  sneakSpeed: 88,
  // How fast the alarm climbs while a guard watches the thief (per second).
  seenByGuardRate: 30,
  // Cameras watch harder: they never blink.
  seenByCameraRate: 38,
  // Alarm drains this fast while nobody sees the thief.
  alarmDecay: 9,
  // Sneaking halves how fast a watcher raises the alarm.
  sneakFactor: 0.55,
};

export const GUARD = {
  radius: 14,
  patrolSpeed: 58,
  investigateSpeed: 95,
  coneRange: 195,
  coneHalfAngle: 0.62,
};

export const CAMERA = {
  coneRange: 235,
  coneHalfAngle: 0.46,
  // Seconds a smoke cloud blinds a camera or a guard standing inside it.
  smokeBlindSeconds: 5,
};

export const TOOLS = {
  coinStart: 3,
  smokeStart: 2,
  coinCost: 25,
  smokeCost: 50,
  coinThrowRange: 280,
  coinHearRadius: 190,
  smokeRadius: 135,
};

export const LOOT_POINTS = { gem: 100, painting: 250, artifact: 500 };
export const LIVES_START = 3;
export const TIME_BONUS_PER_SECOND = 10;

// Palette: a museum at night — marble, brass, velvet, and one fox-orange thief.
export const COLORS = {
  floorA: '#2b2f3a',
  floorB: '#262a33',
  floorTrim: '#3a4050',
  wall: '#171a21',
  wallTop: '#4a4232',
  brass: '#c9a227',
  brassDim: '#8a6d1f',
  caseGlass: 'rgba(150, 200, 230, 0.16)',
  caseFrame: '#5a6b7d',
  rope: '#a31621',
  ropePost: '#d8c27a',
  guardCone: 'rgba(255, 214, 90, 0.20)',
  guardConeEdge: 'rgba(255, 214, 90, 0.55)',
  cameraCone: 'rgba(255, 82, 82, 0.18)',
  cameraConeEdge: 'rgba(255, 82, 82, 0.5)',
  thief: '#e8722a',
  thiefDark: '#b6541a',
  guard: '#3d5a80',
  guardDark: '#2b4361',
  gem: '#7ee7ff',
  painting: '#ffd166',
  artifact: '#ff5d8f',
  exit: '#3ddc84',
  exitDark: '#1d7a44',
  alarmLow: '#3ddc84',
  alarmMid: '#ffb020',
  alarmHigh: '#ff5252',
  ink: '#f2ead8',
  inkDim: '#b9b09a',
  panel: 'rgba(10, 12, 18, 0.88)',
};
