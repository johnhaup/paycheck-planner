/**
 * The app's one breakpoint. React Native has no size classes, so the window width stands in for
 * them: only an unfolded iPhone Duo (669 pt upright, 951 pt on its side) is this wide. Folded it is
 * 466 pt, and every other iPhone is narrower still. On Android the unfolded Pixel 9 Pro Fold (852 x
 * 883 dp, hinge down the middle) and 7"/10" tablets are this wide; folded (443 dp) and phones are not.
 * Tablets kept their two columns on purpose: the Play tablet screenshots show them (HAU-663, HAU-669).
 */
const REGULAR_WIDTH = 600;

export function isRegularWidth(width: number) {
  return width >= REGULAR_WIDTH;
}

/**
 * Space between the two columns of a regular-width screen. The columns split at the window's
 * middle, where an iPhone Duo or an Android book foldable folds, so nothing tappable sits on the fold.
 */
export const COLUMN_GAP = 32;
