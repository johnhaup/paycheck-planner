import { useCallback, useEffect, useMemo, useRef, type ComponentProps, type ReactNode, type RefObject } from "react";
import { I18nManager, Pressable, StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from "react-native-gesture-handler/ReanimatedSwipeable";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { dimOnPress } from "@/constants/press";

const ACTION_WIDTH = 72;

// As in an iOS list, at most one row is open: the row that is open or opening, app wide
let openRow: RefObject<SwipeableMethods | null> | null = null;

/** Slides the open row closed. Lists call it when a drag starts, so an open row never scrolls away open */
export function closeOpenSwipeRow() {
  openRow?.current?.close();
  openRow = null;
}

export interface SwipeAction {
  icon: ComponentProps<typeof Ionicons>["name"];
  color: string;
  accessibilityLabel: string;
  onPress: () => void;
}

interface Props {
  children: ReactNode;
  /** Sits at the row's start edge: left, or right in RTL */
  startAction?: SwipeAction;
  /** Sits at the row's end edge: right, or left in RTL */
  endAction?: SwipeAction;
  style?: StyleProp<ViewStyle>;
}

export function AppSwipeActions({ children, startAction, endAction, style }: Props) {
  const swipeableRef = useRef<SwipeableMethods>(null);
  // ReanimatedSwipeable's left and right are physical edges in every direction
  const leftAction = I18nManager.isRTL ? endAction : startAction;
  const rightAction = I18nManager.isRTL ? startAction : endAction;

  const claimOpen = useCallback(() => {
    if (openRow !== swipeableRef) closeOpenSwipeRow();
    openRow = swipeableRef;
  }, []);

  const releaseOpen = useCallback(() => {
    if (openRow === swipeableRef) openRow = null;
  }, []);

  // Leaving the screen (tab switch, a form or sheet over it) closes the row, so it comes back closed
  const closeOnBlur = useCallback(
    () => () => {
      if (openRow === swipeableRef) closeOpenSwipeRow();
    },
    []
  );
  useFocusEffect(closeOnBlur);
  useEffect(() => releaseOpen, [releaseOpen]);

  // Close first so a row that comes back (undo, re-render) isn't left swiped open
  const run = useCallback((action: SwipeAction) => {
    swipeableRef.current?.close();
    action.onPress();
  }, []);

  const renderLeftActions = useCallback(
    () => (leftAction ? <ActionButton action={leftAction} onRun={run} /> : null),
    [leftAction, run]
  );

  const renderRightActions = useCallback(
    () => (rightAction ? <ActionButton action={rightAction} onRun={run} /> : null),
    [rightAction, run]
  );

  return (
    <ReanimatedSwipeable
      ref={swipeableRef}
      renderLeftActions={leftAction ? renderLeftActions : undefined}
      renderRightActions={rightAction ? renderRightActions : undefined}
      leftThreshold={ACTION_WIDTH / 2}
      rightThreshold={ACTION_WIDTH / 2}
      overshootLeft={false}
      overshootRight={false}
      friction={2}
      onSwipeableOpenStartDrag={claimOpen}
      onSwipeableWillOpen={claimOpen}
      onSwipeableClose={releaseOpen}
      containerStyle={style}
    >
      {children}
    </ReanimatedSwipeable>
  );
}

function ActionButton({ action, onRun }: { action: SwipeAction; onRun: (action: SwipeAction) => void }) {
  const colors = useColors();
  const style = useMemo(() => dimOnPress([styles.action, { backgroundColor: action.color }]), [action.color]);
  const handlePress = useCallback(() => onRun(action), [onRun, action]);

  return (
    <Pressable
      style={style}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={action.accessibilityLabel}
    >
      <Ionicons name={action.icon} size={22} color={colors.onPrimary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  action: {
    width: ACTION_WIDTH,
    alignItems: "center",
    justifyContent: "center",
  },
});
