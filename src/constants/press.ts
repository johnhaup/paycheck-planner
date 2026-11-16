import { StyleSheet, type PressableStateCallbackType, type StyleProp, type ViewStyle } from "react-native";

/** How far a button, link or icon fades while held, like a UIKit borderless button */
const PRESSED_OPACITY = 0.6;

const styles = StyleSheet.create({
  dimmed: { opacity: PRESSED_OPACITY },
});

/** Pressable style for buttons, links and icons: the content dims while held. */
export function dimOnPress(style?: StyleProp<ViewStyle>) {
  return ({ pressed }: PressableStateCallbackType) => (pressed ? [style, styles.dimmed] : style);
}

/** Pressable style for list rows and cards: the background takes `color` while held, like a table cell. */
export function highlightOnPress(style: StyleProp<ViewStyle>, color: string) {
  return ({ pressed }: PressableStateCallbackType) => (pressed ? [style, { backgroundColor: color }] : style);
}

/** `dimOnPress` for a Pressable with no style of its own */
export const DIM_ON_PRESS = dimOnPress();
