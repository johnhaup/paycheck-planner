import type { ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import Animated from "react-native-reanimated";
import { LAYOUT_SPRING, ROW_ENTERING, ROW_EXITING } from "@/constants/motion";

interface Props {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * A group of form fields: it fades in and out when a choice shows or hides it, and springs to its
 * new place when one above it changes, as list rows do. Wrap the form in
 * `<LayoutAnimationConfig skipEntering>` so the sheet does not fade its fields in when it opens.
 */
export function AppFormSection({ children, style }: Props) {
  return (
    <Animated.View entering={ROW_ENTERING} exiting={ROW_EXITING} layout={LAYOUT_SPRING} style={style}>
      {children}
    </Animated.View>
  );
}
