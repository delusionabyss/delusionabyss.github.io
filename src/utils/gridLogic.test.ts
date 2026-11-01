import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getCoordForPanel,
  getPanelAtCoord,
  moveByDelta,
  resolveSwipeDelta,
  computeDiagonalFadeDelay,
  getDiagonalSlideVector,
  isAbyssUnlocked,
} from './gridLogic';

test('Center panel is at (1, 1) and maps back to C', () => {
  const coord = getCoordForPanel('C');
  assert.deepEqual(coord, { row: 1, col: 1 });
  assert.equal(getPanelAtCoord(1, 1), 'C');
});

test('Swiping UP from CENTER moves to SOUTH panel', () => {
  // User swipes UP -> dy is negative (e.g., -120)
  const delta = resolveSwipeDelta(0, -120);
  assert.deepEqual(delta, { dRow: 1, dCol: 0 });
  const nextPanel = moveByDelta('C', delta.dRow, delta.dCol);
  assert.equal(nextPanel, 'S');
});

test('Swiping DOWN from CENTER moves to NORTH panel', () => {
  // User swipes DOWN -> dy is positive (+120)
  const delta = resolveSwipeDelta(0, 120);
  assert.deepEqual(delta, { dRow: -1, dCol: 0 });
  const nextPanel = moveByDelta('C', delta.dRow, delta.dCol);
  assert.equal(nextPanel, 'N');
});

test('Swiping LEFT from CENTER moves to EAST panel, RIGHT moves to WEST', () => {
  const leftSwipe = resolveSwipeDelta(-150, 10);
  assert.deepEqual(leftSwipe, { dRow: 0, dCol: 1 });
  assert.equal(moveByDelta('C', leftSwipe.dRow, leftSwipe.dCol), 'E');

  const rightSwipe = resolveSwipeDelta(150, -5);
  assert.deepEqual(rightSwipe, { dRow: 0, dCol: -1 });
  assert.equal(moveByDelta('C', rightSwipe.dRow, rightSwipe.dCol), 'W');
});

test('Swipes are strictly orthogonal (only up, down, left, right) and corners are reached via two orthogonal swipes', () => {
  // Even if user drags both X and Y, only the dominant axis moves
  const mostlyVertical = resolveSwipeDelta(60, 120);
  assert.deepEqual(mostlyVertical, { dRow: -1, dCol: 0 });
  const northPanel = moveByDelta('C', mostlyVertical.dRow, mostlyVertical.dCol);
  assert.equal(northPanel, 'N');

  // From N, swiping right (dx > 0) moves to NW
  const rightSwipe = resolveSwipeDelta(100, 30);
  assert.deepEqual(rightSwipe, { dRow: 0, dCol: -1 });
  assert.equal(moveByDelta(northPanel, rightSwipe.dRow, rightSwipe.dCol), 'NW');
});

test('Clamping prevents moving outside the 3x3 grid bounds', () => {
  assert.equal(moveByDelta('NW', -1, -1), 'NW');
  assert.equal(moveByDelta('SE', 1, 1), 'SE');
  assert.equal(getPanelAtCoord(-1, 0), null);
  assert.equal(getPanelAtCoord(3, 2), null);
});

test('Diagonal fade delay orders items diagonally based on corner orientation', () => {
  // In NW (top-left), (0,0) has 0 delay, and (2,2) has maximum delay
  const nwFirst = computeDiagonalFadeDelay('NW', 0, 0, 3, 3, 100);
  const nwLast = computeDiagonalFadeDelay('NW', 2, 2, 3, 3, 100);
  assert.equal(nwFirst, 0);
  assert.equal(nwLast, 400);

  // In SE (bottom-right), (2,2) has 0 delay, and (0,0) has maximum delay
  const seFirst = computeDiagonalFadeDelay('SE', 2, 2, 3, 3, 100);
  const seLast = computeDiagonalFadeDelay('SE', 0, 0, 3, 3, 100);
  assert.equal(seFirst, 0);
  assert.equal(seLast, 400);

  // In NE (top-right), (0,2) has 0 delay
  assert.equal(computeDiagonalFadeDelay('NE', 0, 2, 3, 3, 100), 0);
  // In SW (bottom-left), (2,0) has 0 delay
  assert.equal(computeDiagonalFadeDelay('SW', 2, 0, 3, 3, 100), 0);

  assert.deepEqual(getDiagonalSlideVector('NW'), { x: -24, y: -24 });
  assert.deepEqual(getDiagonalSlideVector('SE'), { x: 24, y: 24 });
});

test('Abyss secret unlock condition checks cardinal visits and corner attunements', () => {
  assert.equal(isAbyssUnlocked(['C', 'N', 'E', 'S', 'W'], ['NW', 'NE', 'SW']), false);
  assert.equal(
    isAbyssUnlocked(['C', 'N', 'E', 'S', 'W', 'NW', 'NE', 'SW', 'SE'], ['NW', 'NE', 'SW', 'SE']),
    true
  );
});
