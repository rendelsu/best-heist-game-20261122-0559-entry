// Keyboard and mouse input. WASD or arrows move, Shift sneaks, C tosses a
// coin where the thief faces, X drops smoke, E fires an EMP burst, click
// tosses a coin at the cursor, P pauses, M mutes, R restarts the level,
// Enter starts.
import { PLAY } from './config.js';

const KEY_MOVES = {
  ArrowUp: [0, -1],
  KeyW: [0, -1],
  ArrowDown: [0, 1],
  KeyS: [0, 1],
  ArrowLeft: [-1, 0],
  KeyA: [-1, 0],
  ArrowRight: [1, 0],
  KeyD: [1, 0],
};

export class Input {
  constructor(canvas) {
    this.keys = new Set();
    this.moveX = 0;
    this.moveY = 0;
    this.sneak = false;
    this.coinTarget = null;
    this.useSmoke = false;
    this.useEmp = false;
    this.pressed = new Set();
    this.mouse = { x: 0, y: 0 };
    this.canvas = canvas;
    this.onKeyDown = (event) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) event.preventDefault();
      if (!event.repeat) this.pressed.add(event.code);
      this.keys.add(event.code);
      this.recompute();
    };
    this.onKeyUp = (event) => {
      this.keys.delete(event.code);
      this.recompute();
    };
    this.onMouseMove = (event) => {
      const rect = canvas.getBoundingClientRect();
      this.mouse.x = ((event.clientX - rect.left) / rect.width) * canvas.width;
      this.mouse.y = ((event.clientY - rect.top) / rect.height) * canvas.height;
    };
    this.onClick = (event) => {
      this.onMouseMove(event);
      // A click inside the play area tosses a coin there; clicks on the
      // title or end screens are read by the game loop as "start".
      if (this.mouse.y > PLAY.y) this.coinTarget = { x: this.mouse.x, y: this.mouse.y };
      this.pressed.add('MouseClick');
    };
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    canvas.addEventListener('mousemove', this.onMouseMove);
    canvas.addEventListener('click', this.onClick);
  }

  recompute() {
    let x = 0;
    let y = 0;
    for (const code of this.keys) {
      const move = KEY_MOVES[code];
      if (move) {
        x += move[0];
        y += move[1];
      }
    }
    this.moveX = x;
    this.moveY = y;
    this.sneak = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight');
    if (this.keys.has('KeyC')) this.coinTarget = this.facingPoint();
    if (this.keys.has('KeyX')) this.useSmoke = true;
    if (this.keys.has('KeyE')) this.useEmp = true;
  }

  facingPoint() {
    return { x: this.mouse.x, y: this.mouse.y };
  }

  /** One frame of input for World.step; one-shot actions are consumed. */
  frame(playerAngle) {
    const coinTarget = this.coinTarget;
    const useSmoke = this.useSmoke;
    const useEmp = this.useEmp;
    this.coinTarget = null;
    this.useSmoke = false;
    this.useEmp = false;
    // C tosses toward the mouse; if the mouse never moved, toss ahead.
    let target = coinTarget;
    if (target && this.keys.has('KeyC')) {
      target = { x: this.mouse.x, y: this.mouse.y };
    }
    return { moveX: this.moveX, moveY: this.moveY, sneak: this.sneak, coinTarget: target, useSmoke, useEmp };
  }

  /** True once when the key was pressed since the last check. */
  wasPressed(code) {
    const hit = this.pressed.has(code);
    if (hit) this.pressed.delete(code);
    return hit;
  }

  consumeClick() {
    const hit = this.pressed.has('MouseClick');
    if (hit) this.pressed.delete('MouseClick');
    return hit;
  }
}
