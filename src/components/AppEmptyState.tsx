import { useMemo, type ComponentProps } from "react";
import { View, StyleSheet } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useColors } from "@/hooks/useColors";
import { MEASUREMENTS } from "@/constants/measurements";
import { AppText } from "@/components/AppText";
import { AppButton } from "@/components/AppButton";

type IconName = ComponentProps<typeof Ionicons>["name"];

interface Props {
  icon: IconName;
  title: string;
  body: string;
  actionLabel: string;
  onAction: () => void;
}

export function AppEmptyState({ icon, title, body, actionLabel, onAction }: Props) {
  const colors = useColors();

  const iconWrapStyle = useMemo(
    () => [styles.iconWrap, { backgroundColor: colors.cardBackground }],
    [colors]
  );

  return (
    <View style={styles.container}>
      <View style={iconWrapStyle}>
        <Ionicons name={icon} size={30} color={colors.primaryText} />
      </View>
      <AppText variant="title" center>{title}</AppText>
      <AppText variant="meta" center>{body}</AppText>
      <AppButton title={actionLabel} onPress={onAction} style={styles.button} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: MEASUREMENTS.spacing.md,
    paddingHorizontal: MEASUREMENTS.spacing.section,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: MEASUREMENTS.spacing.md,
  },
  button: {
    marginTop: MEASUREMENTS.spacing.lg,
    alignSelf: "stretch",
  },
});
