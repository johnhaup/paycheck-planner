import { useCallback, useMemo, useRef, type ReactNode } from "react";
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from "react-native-gesture-handler/ReanimatedSwipeable";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useColors } from "@/hooks/useColors";
import { useT } from "@/hooks/useLocale";

const ACTION_WIDTH = 72;

interface Props {
  children: ReactNode;
  onDelete: () => void;
  style?: StyleProp<ViewStyle>;
}

export function AppSwipeToDelete({ children, onDelete, style }: Props) {
  const colors = useColors();
  const t = useT();
  const swipeableRef = useRef<SwipeableMethods>(null);

  // Undo restores the row, so close it first or it comes back swiped open
  const handleDeletePress = useCallback(() => {
    swipeableRef.current?.close();
    onDelete();
  }, [onDelete]);

  const actionStyle = useMemo(
    () => [styles.action, { backgroundColor: colors.destructive }],
    [colors]
  );

  const renderRightActions = useCallback(
    () => (
      <Pressable
        style={actionStyle}
        onPress={handleDeletePress}
        accessibilityRole="button"
        accessibilityLabel={t("common.delete")}
      >
        <Ionicons name="trash-outline" size={22} color={colors.onPrimary} />
      </Pressable>
    ),
    [actionStyle, handleDeletePress, colors, t]
  );

  return (
    <ReanimatedSwipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      rightThreshold={ACTION_WIDTH / 2}
      overshootRight={false}
      friction={2}
      containerStyle={style}
    >
      {children}
    </ReanimatedSwipeable>
  );
}

const styles = StyleSheet.create({
  action: {
    width: ACTION_WIDTH,
    alignItems: "center",
    justifyContent: "center",
  },
});
