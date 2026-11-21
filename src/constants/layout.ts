/**
 * The app's one breakpoint. React Native has no size classes, so the window width stands in for
 * them: only an unfolded iPhone Duo (669 pt upright, 951 pt on its side) is this wide. Folded it is
 * 466 pt, and every other iPhone is narrower still.
 */
const REGULAR_WIDTH = 600;

export function isRegularWidth(width: number) {
  return width >= REGULAR_WIDTH;
}

/**
 * Space between the two columns of a regular-width screen. The columns split at the window's
 * middle, where an iPhone Duo folds, so nothing tappable sits on the fold.
 */
export const COLUMN_GAP = 32;
