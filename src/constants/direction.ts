import { I18nManager } from "react-native";

/** Icons do not mirror on their own: this chevron points the way the screen moves forward. */
export const FORWARD_CHEVRON = I18nManager.isRTL ? "chevron-back" : "chevron-forward";

/**
 * Styles for the root list of a large-title screen. React Native mirrors an RTL
 * scroll view with a scale(-1, 1) transform and flips its content back; iOS 26
 * hosts the large title inside that scroll view, where UIKit's title gets the
 * mirror but not the flip back, so it was drawn as a mirror image at the wrong
 * edge (HAU-165). The list itself stays LTR (no transform) and only its content
 * lays out RTL. Side effect: the vertical scroll indicator stays on the right.
 */
export const LARGE_TITLE_LIST = { direction: "ltr" } as const;
export const LARGE_TITLE_LIST_CONTENT = { direction: I18nManager.isRTL ? "rtl" : "ltr" } as const;
