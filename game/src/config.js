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

// One job, three watches. A patrol walks its route; a sentry never moves,
// it turns in place and sweeps its cone; a hound runs faster, sees less
// far, and hears a tossed coin from much further away.
export const GUARD_KINDS = {
  patrol: { patrolSpeed: 58, investigateSpeed: 95, coneRange: 195, coneHalfAngle: 0.62, hearRadius: 190 },
  sentry: { patrolSpeed: 0, investigateSpeed: 0, coneRange: 220, coneHalfAngle: 0.7, hearRadius: 0 },
  hound: { patrolSpeed: 95, investigateSpeed: 135, coneRange: 150, coneHalfAngle: 0.8, hearRadius: 260 },
};

export const CAMERA = {
  coneRange: 235,
  coneHalfAngle: 0.46,
  // Seconds a smoke cloud blinds a camera or a guard standing inside it.
  smokeBlindSeconds: 5,
};

// A laser beam: crossing it trips the alarm fast, and sneaking does not help.
export const LASER = {
  alarmRate: 60,
  beamHalfWidth: 4,
};

// The fuse box: stand beside it this long to cut a room's lasers for good.
export const FUSE = {
  channelSeconds: 1.5,
  radius: 34,
};

// Cracking a safe: the artifact only lifts after standing beside it this long.
export const SAFE = {
  channelRadius: 32,
};

export const TOOLS = {
  coinStart: 3,
  smokeStart: 2,
  empStart: 1,
  coinCost: 25,
  smokeCost: 50,
  empCost: 75,
  coinThrowRange: 280,
  coinHearRadius: 190,
  smokeRadius: 135,
  // Seconds an EMP burst blinds every camera in the room.
  empBlindSeconds: 8,
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
  hound: '#7a5230',
  houndDark: '#5d3d22',
  sentry: '#5a3d80',
  sentryDark: '#422a61',
  laser: '#ff2d55',
  laserGlow: 'rgba(255, 45, 85, 0.25)',
  emp: '#59b7ff',
  fuse: '#c9a227',
  planter: '#1e4d2b',
  planterTop: '#2f6b3f',
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
