export type PanelId = 'NW' | 'N' | 'NE' | 'W' | 'C' | 'E' | 'SW' | 'S' | 'SE';

export interface GridCoord {
  row: 0 | 1 | 2;
  col: 0 | 1 | 2;
}

export interface PanelMetadata {
  id: PanelId;
  row: 0 | 1 | 2;
  col: 0 | 1 | 2;
  compassLabel: string;
  coordinateLabel: string;
  title: string;
  subtitle: string;
  kind: 'center' | 'cardinal' | 'diagonal';
}

export const GRID_PANELS: Record<PanelId, PanelMetadata> = {
  NW: {
    id: 'NW',
    row: 0,
    col: 0,
    compassLabel: 'NW',
    coordinateLabel: '-1, +1',
    title: 'first fracture',
    subtitle: 'origin of the unmapped signal',
    kind: 'diagonal',
  },
  N: {
    id: 'N',
    row: 0,
    col: 1,
    compassLabel: 'NORTH',
    coordinateLabel: '0, +1',
    title: 'game',
    subtitle: 'playable interactive simulations in the quiet dark',
    kind: 'cardinal',
  },
  NE: {
    id: 'NE',
    row: 0,
    col: 2,
    compassLabel: 'NE',
    coordinateLabel: '+1, +1',
    title: 'upper horizon',
    subtitle: 'echoes carried past the edge of sight',
    kind: 'diagonal',
  },
  W: {
    id: 'W',
    row: 1,
    col: 0,
    compassLabel: 'WEST',
    coordinateLabel: '-1, 0',
    title: 'creative endeavors',
    subtitle: 'monographs, sonic studies, and visual fragments',
    kind: 'cardinal',
  },
  C: {
    id: 'C',
    row: 1,
    col: 1,
    compassLabel: 'CENTER',
    coordinateLabel: '0, 0',
    title: 'delusion abyss',
    subtitle: 'the still threshold',
    kind: 'center',
  },
  E: {
    id: 'E',
    row: 1,
    col: 2,
    compassLabel: 'EAST',
    coordinateLabel: '+1, 0',
    title: 'software',
    subtitle: 'minimalist tools, compilers, and quiet engines',
    kind: 'cardinal',
  },
  SW: {
    id: 'SW',
    row: 2,
    col: 0,
    compassLabel: 'SW',
    coordinateLabel: '-1, -1',
    title: 'sunken archive',
    subtitle: 'submerged recordings beneath the floorboards',
    kind: 'diagonal',
  },
  S: {
    id: 'S',
    row: 2,
    col: 1,
    compassLabel: 'SOUTH',
    coordinateLabel: '0, -1',
    title: 'about',
    subtitle: 'field notes from a solitary architect',
    kind: 'cardinal',
  },
  SE: {
    id: 'SE',
    row: 2,
    col: 2,
    compassLabel: 'SE',
    coordinateLabel: '+1, -1',
    title: 'terminal drift',
    subtitle: 'where the last coordinates dissolve into ash',
    kind: 'diagonal',
  },
};

export const GRID_MATRIX: PanelId[][] = [
  ['NW', 'N', 'NE'],
  ['W', 'C', 'E'],
  ['SW', 'S', 'SE'],
];

export const ALL_PANEL_IDS: PanelId[] = ['NW', 'N', 'NE', 'W', 'C', 'E', 'SW', 'S', 'SE'];
export const CORNER_PANEL_IDS: PanelId[] = ['NW', 'NE', 'SW', 'SE'];

export function getCoordForPanel(id: PanelId): GridCoord {
  const meta = GRID_PANELS[id];
  return { row: meta.row, col: meta.col };
}

export function getPanelAtCoord(row: number, col: number): PanelId | null {
  if (row < 0 || row > 2 || col < 0 || col > 2) {
    return null;
  }
  return GRID_MATRIX[row][col];
}

export function clampGridIndex(val: number): 0 | 1 | 2 {
  if (val <= 0) return 0;
  if (val >= 2) return 2;
  return 1;
}

/**
 * Given a current panel and a delta in (dRow, dCol), returns the target PanelId.
 * Notice:
 * - Moving to NORTH means row - 1
 * - Moving to SOUTH means row + 1
 * - Moving to WEST means col - 1
 * - Moving to EAST means col + 1
 */
export function moveByDelta(current: PanelId, dRow: number, dCol: number): PanelId {
  const { row, col } = getCoordForPanel(current);
  const nextRow = clampGridIndex(row + dRow);
  const nextCol = clampGridIndex(col + dCol);
  return GRID_MATRIX[nextRow][nextCol];
}

/**
 * Resolves a swipe gesture vector (dx = endX - startX, dy = endY - startY) into a strictly orthogonal
 * grid delta (dRow, dCol) — only UP, DOWN, LEFT, or RIGHT.
 * - Dragging UP (dy < 0) pulls the grid up -> moves to SOUTH (dRow = +1, dCol = 0)
 * - Dragging DOWN (dy > 0) pulls the grid down -> moves to NORTH (dRow = -1, dCol = 0)
 * - Dragging LEFT (dx < 0) pulls the grid left -> moves to EAST (dRow = 0, dCol = +1)
 * - Dragging RIGHT (dx > 0) pulls the grid right -> moves to WEST (dRow = 0, dCol = -1)
 */
export function resolveSwipeDelta(
  dx: number,
  dy: number,
  threshold = 24
): { dRow: -1 | 0 | 1; dCol: -1 | 0 | 1 } {
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);

  if (absX < threshold && absY < threshold) {
    return { dRow: 0, dCol: 0 };
  }

  if (absX > absY) {
    return { dRow: 0, dCol: dx < 0 ? 1 : -1 };
  } else {
    return { dRow: dy < 0 ? 1 : -1, dCol: 0 };
  }
}

/**
 * Computes diagonal stagger delay (in ms) for cryptic text fragments in corner panels
 * so that fragments fade in diagonally based on the panel direction:
 * - NW (row 0, col 0): fades from Top-Left (0,0) toward Bottom-Right (maxRow, maxCol)
 * - NE (row 0, col 2): fades from Top-Right (0, maxCol) toward Bottom-Left (maxRow, 0)
 * - SW (row 2, col 0): fades from Bottom-Left (maxRow, 0) toward Top-Right (0, maxCol)
 * - SE (row 2, col 2): fades from Bottom-Right (maxRow, maxCol) toward Top-Left (0,0)
 */
export function computeDiagonalFadeDelay(
  panelId: 'NW' | 'NE' | 'SW' | 'SE',
  itemRow: number,
  itemCol: number,
  totalRows: number,
  totalCols: number,
  stepMs = 135
): number {
  const maxR = Math.max(1, totalRows - 1);
  const maxC = Math.max(1, totalCols - 1);

  let rDist = itemRow;
  let cDist = itemCol;

  if (panelId === 'NW') {
    rDist = itemRow;
    cDist = itemCol;
  } else if (panelId === 'NE') {
    rDist = itemRow;
    cDist = maxC - itemCol;
  } else if (panelId === 'SW') {
    rDist = maxR - itemRow;
    cDist = itemCol;
  } else if (panelId === 'SE') {
    rDist = maxR - itemRow;
    cDist = maxC - itemCol;
  }

  const diagonalIndex = Math.max(0, rDist + cDist);
  return Math.round(diagonalIndex * stepMs);
}

/**
 * Computes the directional CSS transform offset for a diagonal panel's items
 * prior to fading in, matching the panel's diagonal vector.
 */
export function getDiagonalSlideVector(panelId: 'NW' | 'NE' | 'SW' | 'SE'): { x: number; y: number } {
  switch (panelId) {
    case 'NW':
      return { x: -24, y: -24 };
    case 'NE':
      return { x: 24, y: -24 };
    case 'SW':
      return { x: -24, y: 24 };
    case 'SE':
      return { x: 24, y: 24 };
  }
}

export interface ExplorationState {
  visitedPanels: PanelId[];
  attunedCorners: ('NW' | 'NE' | 'SW' | 'SE')[];
}

export function isAbyssUnlocked(
  visitedPanels: ReadonlyArray<PanelId>,
  attunedCorners: ReadonlyArray<string>
): boolean {
  const allCornersAttuned = CORNER_PANEL_IDS.every((c) => attunedCorners.includes(c));
  const cardinalVisited = (['N', 'E', 'S', 'W'] as PanelId[]).every((p) => visitedPanels.includes(p));
  return allCornersAttuned && cardinalVisited;
}
