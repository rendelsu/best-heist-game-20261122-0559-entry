// Every pixel of The Velvet Fox is drawn here on one canvas: the marble
// floor, the walls and cases, the guards and their cones, the cameras, the
// loot, the thief, the HUD with its alarm meter, and the title and end
// screens. Nothing is loaded from outside the game folder.
import { CAMERA, COLORS, GUARD, HUD_HEIGHT, LOOT_POINTS, PLAYER, VIEW } from './config.js';
import { LEVELS } from './levels.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_WIN = 'win';
export const SCREEN_OVER = 'over';

function drawCone(ctx, x, y, angle, range, halfAngle, fill, edge) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - halfAngle, angle + halfAngle);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawFloor(ctx, time) {
  const tile = 64;
  for (let ty = HUD_HEIGHT; ty < VIEW.height; ty += tile) {
    for (let tx = 0; tx < VIEW.width; tx += tile) {
      const even = ((tx / tile + ty / tile) | 0) % 2 === 0;
      ctx.fillStyle = even ? COLORS.floorA : COLORS.floorB;
      ctx.fillRect(tx, ty, tile, tile);
    }
  }
  // Brass inlay lines between the marble slabs.
  ctx.strokeStyle = 'rgba(201, 162, 39, 0.10)';
  ctx.lineWidth = 1;
  for (let tx = 0; tx <= VIEW.width; tx += tile) {
    ctx.beginPath();
    ctx.moveTo(tx, HUD_HEIGHT);
    ctx.lineTo(tx, VIEW.height);
    ctx.stroke();
  }
  for (let ty = HUD_HEIGHT; ty <= VIEW.height; ty += tile) {
    ctx.beginPath();
    ctx.moveTo(0, ty);
    ctx.lineTo(VIEW.width, ty);
    ctx.stroke();
  }
  void time;
}

function drawObstacles(ctx, obstacles) {
  for (const obstacle of obstacles) {
    if (obstacle.kind === 'wall') {
      ctx.fillStyle = COLORS.wall;
      ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
      ctx.fillStyle = COLORS.wallTop;
      ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, 4);
      ctx.strokeStyle = COLORS.brassDim;
      ctx.lineWidth = 1;
      ctx.strokeRect(obstacle.x + 0.5, obstacle.y + 0.5, obstacle.width, obstacle.height);
    } else if (obstacle.kind === 'case') {
      ctx.fillStyle = COLORS.caseFrame;
      ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
      ctx.fillStyle = COLORS.caseGlass;
      ctx.fillRect(obstacle.x + 4, obstacle.y + 4, obstacle.width - 8, obstacle.height - 8);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.beginPath();
      ctx.moveTo(obstacle.x + 6, obstacle.y + obstacle.height - 6);
      ctx.lineTo(obstacle.x + obstacle.width - 6, obstacle.y + 6);
      ctx.stroke();
    } else {
      // Velvet rope: two brass posts and a sagging red cord.
      ctx.strokeStyle = COLORS.rope;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(obstacle.x, obstacle.y + obstacle.height / 2);
      ctx.quadraticCurveTo(
        obstacle.x + obstacle.width / 2,
        obstacle.y + obstacle.height / 2 + 14,
        obstacle.x + obstacle.width,
        obstacle.y + obstacle.height / 2,
      );
      ctx.stroke();
      ctx.fillStyle = COLORS.ropePost;
      ctx.beginPath();
      ctx.arc(obstacle.x, obstacle.y + obstacle.height / 2, 5, 0, Math.PI * 2);
      ctx.arc(obstacle.x + obstacle.width, obstacle.y + obstacle.height / 2, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawExit(ctx, world) {
  const exit = world.level.exit;
  const open = world.artifactTaken();
  ctx.fillStyle = open ? COLORS.exit : '#7a2e2e';
  ctx.fillRect(exit.x, exit.y, exit.width, exit.height);
  ctx.strokeStyle = open ? COLORS.exit : COLORS.brassDim;
  ctx.lineWidth = 3;
  ctx.strokeRect(exit.x + 1.5, exit.y + 1.5, exit.width - 3, exit.height - 3);
  ctx.fillStyle = '#0b0e13';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(open ? 'EXIT' : 'LOCKED', exit.x + exit.width / 2, exit.y + exit.height / 2 - 8);
  ctx.font = '11px system-ui, sans-serif';
  ctx.fillStyle = open ? '#d7ffe9' : '#d8b25e';
  ctx.fillText(open ? 'GO!' : 'NEED ARTIFACT', exit.x + exit.width / 2, exit.y + exit.height / 2 + 12);
}

function drawLoot(ctx, world, time) {
  for (const item of world.loot) {
    if (item.taken) continue;
    const bob = Math.sin(time * 3 + item.x) * 3;
    const y = item.y + bob;
    const sparkle = 0.5 + 0.5 * Math.sin(time * 5 + item.y);
    if (item.kind === 'gem') {
      ctx.save();
      ctx.translate(item.x, y);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = COLORS.gem;
      ctx.fillRect(-9, -9, 18, 18);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-9, -9, 18, 18);
      ctx.restore();
    } else if (item.kind === 'painting') {
      ctx.fillStyle = '#3a2c14';
      ctx.fillRect(item.x - 22, y - 16, 44, 32);
      ctx.fillStyle = COLORS.painting;
      ctx.fillRect(item.x - 18, y - 12, 36, 24);
      ctx.strokeStyle = COLORS.brass;
      ctx.lineWidth = 2;
      ctx.strokeRect(item.x - 22, y - 16, 44, 32);
      ctx.fillStyle = '#7a5c1e';
      ctx.beginPath();
      ctx.arc(item.x - 6, y + 2, 5, 0, Math.PI * 2);
      ctx.arc(item.x + 8, y - 3, 4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // The artifact: a pedestal and a pulsing jewel.
      ctx.fillStyle = '#4a4232';
      ctx.fillRect(item.x - 20, item.y + 6, 40, 14);
      ctx.fillStyle = COLORS.brass;
      ctx.fillRect(item.x - 20, item.y + 6, 40, 3);
      ctx.save();
      ctx.translate(item.x, y - 8);
      ctx.rotate(Math.PI / 4 + Math.sin(time * 2) * 0.15);
      ctx.fillStyle = COLORS.artifact;
      ctx.fillRect(-13, -13, 26, 26);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(-13, -13, 26, 26);
      ctx.restore();
    }
    // Sparkle halo so loot reads at a glance, even shrunk.
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.25 + sparkle * 0.5})`;
    ctx.lineWidth = 1.5;
    const r = 20 + sparkle * 6;
    ctx.beginPath();
    ctx.arc(item.x, y, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(242, 234, 216, 0.9)';
    ctx.font = '10px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(item.name.toUpperCase(), item.x, y + 34);
  }
}

function drawSmoke(ctx, world) {
  for (const cloud of world.smokeClouds) {
    const alpha = Math.min(0.55, cloud.ttl * 0.2);
    ctx.fillStyle = `rgba(200, 200, 210, ${alpha})`;
    ctx.beginPath();
    ctx.arc(cloud.x, cloud.y, cloud.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(220, 220, 230, ${alpha * 0.7})`;
    ctx.beginPath();
    ctx.arc(cloud.x - 30, cloud.y + 12, cloud.radius * 0.5, 0, Math.PI * 2);
    ctx.arc(cloud.x + 32, cloud.y - 10, cloud.radius * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawCoin(ctx, world) {
  if (!world.coin) return;
  ctx.fillStyle = COLORS.brass;
  ctx.beginPath();
  ctx.arc(world.coin.x, world.coin.y, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#fff2b0';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(201, 162, 39, 0.6)';
  ctx.beginPath();
  ctx.arc(world.coin.x, world.coin.y, 13, 0, Math.PI * 2);
  ctx.stroke();
}

function drawGuard(ctx, world, guard, time) {
  const seesPlayer = world.watcherSees(guard, GUARD.coneRange, GUARD.coneHalfAngle);
  const fill = seesPlayer ? 'rgba(255, 82, 82, 0.30)' : COLORS.guardCone;
  const edge = seesPlayer ? 'rgba(255, 82, 82, 0.7)' : COLORS.guardConeEdge;
  drawCone(ctx, guard.x, guard.y, guard.angle, GUARD.coneRange, GUARD.coneHalfAngle, fill, edge);
  // Body: navy uniform, brass cap, facing nose.
  ctx.fillStyle = COLORS.guard;
  ctx.beginPath();
  ctx.arc(guard.x, guard.y, GUARD.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = COLORS.guardDark;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#1d2b3d';
  ctx.beginPath();
  ctx.arc(guard.x, guard.y, GUARD.radius - 4, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.brass;
  ctx.fillRect(guard.x - 9, guard.y - GUARD.radius + 1, 18, 2);
  ctx.strokeStyle = '#dfe9f5';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(guard.x + Math.cos(guard.angle) * 6, guard.y + Math.sin(guard.angle) * 6);
  ctx.lineTo(guard.x + Math.cos(guard.angle) * (GUARD.radius + 4), guard.y + Math.sin(guard.angle) * (GUARD.radius + 4));
  ctx.stroke();
  if (seesPlayer) {
    ctx.fillStyle = '#ff5252';
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('!', guard.x, guard.y - GUARD.radius - 8 + Math.sin(time * 10) * 2);
  } else if (guard.mode === 'investigate') {
    ctx.fillStyle = COLORS.brass;
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('?', guard.x, guard.y - GUARD.radius - 6);
  }
}

function drawCamera(ctx, world, camera) {
  const seesPlayer = world.watcherSees(camera, CAMERA.coneRange, CAMERA.coneHalfAngle);
  const fill = seesPlayer ? 'rgba(255, 82, 82, 0.30)' : COLORS.cameraCone;
  const edge = seesPlayer ? 'rgba(255, 82, 82, 0.7)' : COLORS.cameraConeEdge;
  drawCone(ctx, camera.x, camera.y, camera.angle, CAMERA.coneRange, CAMERA.coneHalfAngle, fill, edge);
  ctx.save();
  ctx.translate(camera.x, camera.y);
  ctx.rotate(camera.angle);
  ctx.fillStyle = '#20242e';
  ctx.fillRect(-8, -6, 18, 12);
  ctx.fillStyle = seesPlayer ? '#ff5252' : '#ff8a80';
  ctx.beginPath();
  ctx.arc(11, 0, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#5a6b7d';
  ctx.beginPath();
  ctx.arc(camera.x, camera.y, 3, 0, Math.PI * 2);
  ctx.fill();
}

function drawThief(ctx, world, time) {
  const player = world.player;
  const bob = player.sneaking ? 0 : Math.sin(time * 9) * 1.5;
  ctx.save();
  ctx.translate(player.x, player.y + bob);
  ctx.rotate(player.angle);
  // Tail.
  ctx.strokeStyle = COLORS.thiefDark;
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-8, 0);
  ctx.quadraticCurveTo(-20, -10, -24, 2);
  ctx.stroke();
  ctx.strokeStyle = '#f2ead8';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-22, 0);
  ctx.quadraticCurveTo(-25, -4, -26, 2);
  ctx.stroke();
  // Body.
  ctx.fillStyle = COLORS.thief;
  ctx.beginPath();
  ctx.arc(0, 0, PLAYER.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = COLORS.thiefDark;
  ctx.lineWidth = 2;
  ctx.stroke();
  // Ears.
  ctx.fillStyle = COLORS.thief;
  ctx.beginPath();
  ctx.moveTo(-2, -10);
  ctx.lineTo(4, -19);
  ctx.lineTo(9, -9);
  ctx.closePath();
  ctx.moveTo(2, 10);
  ctx.lineTo(8, 19);
  ctx.lineTo(12, 8);
  ctx.closePath();
  ctx.fill();
  // Mask across the eyes.
  ctx.fillStyle = '#20242e';
  ctx.fillRect(2, -9, 7, 18);
  // Snout.
  ctx.fillStyle = '#f2ead8';
  ctx.beginPath();
  ctx.arc(11, 0, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  if (player.sneaking) {
    ctx.fillStyle = 'rgba(242, 234, 216, 0.75)';
    ctx.font = '10px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SNEAKING', player.x, player.y - PLAYER.radius - 10);
  }
}

function drawFoxHead(ctx, x, y, size) {
  ctx.fillStyle = COLORS.thief;
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - size * 0.6, y - size * 0.6);
  ctx.lineTo(x - size * 0.3, y - size * 1.4);
  ctx.lineTo(x + size * 0.1, y - size * 0.8);
  ctx.closePath();
  ctx.moveTo(x + size * 0.6, y - size * 0.6);
  ctx.lineTo(x + size * 0.3, y - size * 1.4);
  ctx.lineTo(x - size * 0.1, y - size * 0.8);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#20242e';
  ctx.fillRect(x - size * 0.7, y - size * 0.25, size * 1.4, size * 0.5);
}

function alarmColor(value) {
  if (value < 40) return COLORS.alarmLow;
  if (value < 75) return COLORS.alarmMid;
  return COLORS.alarmHigh;
}

function drawHud(ctx, world) {
  ctx.fillStyle = '#10131a';
  ctx.fillRect(0, 0, VIEW.width, HUD_HEIGHT);
  ctx.fillStyle = COLORS.brass;
  ctx.fillRect(0, HUD_HEIGHT - 3, VIEW.width, 3);
  ctx.textBaseline = 'middle';

  ctx.fillStyle = COLORS.brass;
  ctx.font = 'bold 17px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('THE VELVET FOX', 16, 20);
  ctx.fillStyle = COLORS.inkDim;
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText(world.level.name, 16, 44);

  ctx.fillStyle = COLORS.ink;
  ctx.font = 'bold 16px system-ui, sans-serif';
  ctx.fillText(`SCORE ${world.score}`, 330, 20);
  const taken = world.lootTakenCount();
  ctx.fillStyle = COLORS.inkDim;
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText(`LOOT ${taken}/${world.loot.length}  •  ARTIFACT ${world.artifactTaken() ? 'TAKEN' : '—'}`, 330, 44);

  // Alarm meter.
  const meterX = 600;
  const meterWidth = 240;
  ctx.fillStyle = COLORS.inkDim;
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.fillText('ALARM', meterX, 20);
  ctx.fillStyle = '#262a33';
  ctx.fillRect(meterX, 30, meterWidth, 18);
  ctx.fillStyle = alarmColor(world.alarm);
  ctx.fillRect(meterX, 30, meterWidth * (world.alarm / 100), 18);
  ctx.strokeStyle = COLORS.brassDim;
  ctx.lineWidth = 1;
  ctx.strokeRect(meterX + 0.5, 30.5, meterWidth, 18);
  ctx.fillStyle = world.alarm >= 75 ? '#ff8a80' : COLORS.inkDim;
  ctx.font = '11px system-ui, sans-serif';
  ctx.fillText(world.alarm >= 75 ? 'THEY SEE YOU — BREAK LINE OF SIGHT!' : 'stay out of the cones', meterX, 56);

  // Timer.
  const seconds = Math.max(0, Math.ceil(world.timeLeftSeconds));
  const timerText = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  ctx.fillStyle = seconds <= 30 ? '#ff8a80' : COLORS.ink;
  ctx.font = 'bold 20px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(timerText, 920, 24);
  ctx.fillStyle = COLORS.inkDim;
  ctx.font = '11px system-ui, sans-serif';
  ctx.fillText('TIME LEFT', 920, 46);

  // Lives as little fox heads.
  ctx.fillStyle = COLORS.inkDim;
  ctx.font = '11px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('LIVES', 990, 18);
  for (let i = 0; i < world.lives; i += 1) drawFoxHead(ctx, 1006 + i * 26, 40, 8);

  // Tools.
  ctx.fillStyle = COLORS.ink;
  ctx.font = '12px system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`◉ COIN ×${world.coins}  (click / C)`, 1264, 20);
  ctx.fillText(`☁ SMOKE ×${world.smokes}  (X)`, 1264, 44);
  ctx.textAlign = 'left';
}

function drawBanner(ctx, text, subtext) {
  ctx.fillStyle = COLORS.panel;
  ctx.fillRect(0, 300, VIEW.width, 110);
  ctx.fillStyle = COLORS.brass;
  ctx.fillRect(0, 300, VIEW.width, 2);
  ctx.fillRect(0, 408, VIEW.width, 2);
  ctx.fillStyle = COLORS.ink;
  ctx.font = 'bold 34px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(text, VIEW.width / 2, 342);
  ctx.fillStyle = COLORS.inkDim;
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillText(subtext, VIEW.width / 2, 378);
  ctx.textAlign = 'left';
}

function drawTitle(ctx, world, best) {
  ctx.fillStyle = 'rgba(8, 10, 15, 0.72)';
  ctx.fillRect(0, HUD_HEIGHT, VIEW.width, VIEW.height - HUD_HEIGHT);
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.brass;
  ctx.font = 'bold 64px Georgia, serif';
  ctx.fillText('THE VELVET FOX', VIEW.width / 2, 250);
  ctx.fillStyle = COLORS.ink;
  ctx.font = 'italic 24px Georgia, serif';
  ctx.fillText('Heist at the Meridian Museum', VIEW.width / 2, 296);
  ctx.fillStyle = COLORS.inkDim;
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillText('Three rooms. Three treasures. One fox, and a museum full of eyes.', VIEW.width / 2, 336);
  const lines = [
    'WASD / arrows — move        SHIFT — sneak (slower, harder to spot)',
    'CLICK or C — toss a coin to lure a guard        X — smoke bomb (blinds cameras)',
    'Take the artifact, then reach the green EXIT before the alarm hits 100.',
    'Guards and cameras raise the alarm while they see you. Break line of sight to cool down.',
  ];
  ctx.font = '15px system-ui, sans-serif';
  lines.forEach((line, index) => ctx.fillText(line, VIEW.width / 2, 396 + index * 28));
  ctx.fillStyle = COLORS.ink;
  ctx.font = 'bold 20px system-ui, sans-serif';
  ctx.fillText('Press ENTER or click to begin the job', VIEW.width / 2, 540);
  if (best > 0) {
    ctx.fillStyle = COLORS.brass;
    ctx.font = '15px system-ui, sans-serif';
    ctx.fillText(`Best haul so far: ${best}`, VIEW.width / 2, 574);
  }
  ctx.textAlign = 'left';
}

function drawEndScreen(ctx, title, lines, hint) {
  ctx.fillStyle = 'rgba(8, 10, 15, 0.78)';
  ctx.fillRect(0, HUD_HEIGHT, VIEW.width, VIEW.height - HUD_HEIGHT);
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.brass;
  ctx.font = 'bold 52px Georgia, serif';
  ctx.fillText(title, VIEW.width / 2, 280);
  ctx.fillStyle = COLORS.ink;
  ctx.font = '18px system-ui, sans-serif';
  lines.forEach((line, index) => ctx.fillText(line, VIEW.width / 2, 340 + index * 32));
  ctx.fillStyle = COLORS.inkDim;
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillText(hint, VIEW.width / 2, 340 + lines.length * 32 + 30);
  ctx.textAlign = 'left';
}

export function render(ctx, world, ui) {
  const time = ui.time;
  ctx.clearRect(0, 0, VIEW.width, VIEW.height);
  drawFloor(ctx, time);
  drawExit(ctx, world);
  drawObstacles(ctx, world.level.obstacles);
  drawLoot(ctx, world, time);
  drawCoin(ctx, world);
  drawSmoke(ctx, world);
  for (const camera of world.cameras) drawCamera(ctx, world, camera);
  for (const guard of world.guards) drawGuard(ctx, world, guard, time);
  drawThief(ctx, world, time);
  drawHud(ctx, world);

  if (ui.screen === SCREEN_TITLE) {
    drawTitle(ctx, world, ui.best);
  } else if (ui.banner) {
    drawBanner(ctx, ui.banner, ui.bannerSub ?? '');
  } else if (world.phase === 'caught') {
    ctx.fillStyle = 'rgba(163, 22, 33, 0.25)';
    ctx.fillRect(0, HUD_HEIGHT, VIEW.width, VIEW.height - HUD_HEIGHT);
    drawBanner(ctx, 'CAUGHT!', `The guards drag the fox back to the door. Lives left: ${world.lives}`);
  } else if (world.phase === 'levelDone') {
    drawBanner(ctx, 'CLEAN GETAWAY!', `Time bonus banked. Score: ${world.score}`);
  } else if (world.phase === 'win') {
    drawEndScreen(
      ctx,
      'THE STAR SAPPHIRE IS YOURS',
      [
        `Final score: ${world.score}`,
        `Loot taken: ${world.totalLootTaken} piece${world.totalLootTaken === 1 ? '' : 's'} worth ${world.totalLootValue} points`,
        `Times caught: ${world.timesCaught}   •   Coins tossed: ${world.coinsUsed}   •   Smoke used: ${world.smokesUsed}`,
      ],
      'Press ENTER to run the job again.',
    );
  } else if (world.phase === 'over') {
    drawEndScreen(
      ctx,
      'THE FOX IS CAUGHT',
      [
        `The museum keeps its treasures this time. Score: ${world.score}`,
        `You reached ${LEVELS[world.levelIndex].name} and took ${world.totalLootTaken} pieces of loot.`,
      ],
      'Press ENTER to try the job again.',
    );
  } else if (ui.paused) {
    drawBanner(ctx, 'PAUSED', 'Press P to keep sneaking.');
  }
  if (ui.muted) {
    ctx.fillStyle = COLORS.inkDim;
    ctx.font = '12px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('MUTED (M)', VIEW.width - 16, VIEW.height - 16);
    ctx.textAlign = 'left';
  }
}
