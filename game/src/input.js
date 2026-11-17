// SOLMARA — keyboard and mouse, read once per frame. Movement comes from
// WASD or the arrow keys; the mouse aims. A tap fires exactly once.
//
// UI actions and player actions are read through SEPARATE calls that each
// consume only their own keys. The menu layer reads takeUiActions
// (confirm / pause / restart / mute); the player reads takePlayerActions
// (enter a car / punch). Neither call can eat the other's keys, so E and F
// always reach the player even on the frame a menu also reads input.

export const UI_CONFIRM = 1;
export const UI_PAUSE = 2;
export const UI_RESTART = 4;
export const UI_MUTE = 8;
export const PLAYER_ENTER = 1;
export const PLAYER_PUNCH = 2;

export function createInput(canvas) {
  const keys = new Set();
  const pressed = new Set();
  const mouse = { x: 0, y: 0, down: false };

  window.addEventListener('keydown', (event) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
      event.preventDefault();
    }
    if (!event.repeat) pressed.add(event.code);
    keys.add(event.code);
  });
  window.addEventListener('keyup', (event) => {
    keys.delete(event.code);
  });
  window.addEventListener('blur', () => {
    keys.clear();
  });
  canvas.addEventListener('mousemove', (event) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = event.clientX - rect.left;
    mouse.y = event.clientY - rect.top;
  });
  canvas.addEventListener('mousedown', (event) => {
    if (event.button === 0) mouse.down = true;
    if (event.button === 2) pressed.add('MouseRight');
  });
  window.addEventListener('mouseup', (event) => {
    if (event.button === 0) mouse.down = false;
  });
  canvas.addEventListener('contextmenu', (event) => event.preventDefault());

  function isDown(...codes) {
    return codes.some((c) => keys.has(c));
  }

  // The WASD / arrow movement vector, normalised.
  function moveVector() {
    let x = 0;
    let y = 0;
    if (isDown('KeyA', 'ArrowLeft')) x -= 1;
    if (isDown('KeyD', 'ArrowRight')) x += 1;
    if (isDown('KeyW', 'ArrowUp')) y -= 1;
    if (isDown('KeyS', 'ArrowDown')) y += 1;
    if (x !== 0 && y !== 0) {
      const length = Math.hypot(x, y);
      x /= length;
      y /= length;
    }
    return { x, y };
  }

  // Menu keys only: Enter / Space / right-click confirms, P or Escape
  // pauses, R restarts, M mutes. Consumes nothing but these keys.
  function takeUiActions() {
    let actions = 0;
    if (pressed.has('Enter') || pressed.has('Space') || pressed.has('MouseRight')) actions |= UI_CONFIRM;
    if (pressed.has('KeyP') || pressed.has('Escape')) actions |= UI_PAUSE;
    if (pressed.has('KeyR')) actions |= UI_RESTART;
    if (pressed.has('KeyM')) actions |= UI_MUTE;
    pressed.delete('Enter');
    pressed.delete('Space');
    pressed.delete('MouseRight');
    pressed.delete('KeyP');
    pressed.delete('Escape');
    pressed.delete('KeyR');
    pressed.delete('KeyM');
    return actions;
  }

  // Player keys only: E enters / exits a car, F punches. Consumes
  // nothing but these keys, so the menu can never swallow them.
  function takePlayerActions() {
    let actions = 0;
    if (pressed.has('KeyE')) actions |= PLAYER_ENTER;
    if (pressed.has('KeyF')) actions |= PLAYER_PUNCH;
    pressed.delete('KeyE');
    pressed.delete('KeyF');
    return actions;
  }

  return { isDown, moveVector, takeUiActions, takePlayerActions, mouse, keys };
}
