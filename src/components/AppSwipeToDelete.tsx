import { useCallback, useMemo, useRef, type ReactNode } from "react";
import { Alert, Pressable, StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from "react-native-gesture-handler/ReanimatedSwipeable";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useColors } from "@/hooks/useColors";
import { useT } from "@/hooks/useLocale";

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
  const t = useT();
  const swipeableRef = useRef<SwipeableMethods>(null);

  const handleCancel = useCallback(() => {
    swipeableRef.current?.close();
  }, []);

  const handleDeletePress = useCallback(() => {
    Alert.alert(
      confirmTitle,
      confirmMessage,
      [
        { text: t("common.cancel"), style: "cancel", onPress: handleCancel },
        { text: t("common.delete"), style: "destructive", onPress: onConfirm },
      ],
      { cancelable: true, onDismiss: handleCancel }
    );
  }, [confirmTitle, confirmMessage, onConfirm, handleCancel, t]);

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
