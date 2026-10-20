import { useCallback, useMemo, useRef, type ReactNode } from "react";
import { Alert, Pressable, StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from "react-native-gesture-handler/ReanimatedSwipeable";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useColors } from "@/hooks/useColors";

const ACTION_WIDTH = 72;

interface Props {
  children: ReactNode;
  confirmTitle: string;
  confirmMessage: string;
  onConfirm: () => void;
  style?: StyleProp<ViewStyle>;
}

export function AppSwipeToDelete({ children, confirmTitle, confirmMessage, onConfirm, style }: Props) {
  const colors = useColors();
  const swipeableRef = useRef<SwipeableMethods>(null);

  const handleCancel = useCallback(() => {
    swipeableRef.current?.close();
  }, []);

  const handleDeletePress = useCallback(() => {
    Alert.alert(
      confirmTitle,
      confirmMessage,
      [
        { text: "Cancel", style: "cancel", onPress: handleCancel },
        { text: "Delete", style: "destructive", onPress: onConfirm },
      ],
      { cancelable: true, onDismiss: handleCancel }
    );
  }, [confirmTitle, confirmMessage, onConfirm, handleCancel]);

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
        accessibilityLabel="Delete"
      >
        <Ionicons name="trash-outline" size={22} color={colors.onPrimary} />
      </Pressable>
    ),
    [actionStyle, handleDeletePress, colors]
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
