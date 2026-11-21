import { useMemo, type ComponentProps } from "react";
import { View, StyleSheet } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useColors } from "@/hooks/useColors";
import { useColumns } from "@/hooks/useColumns";
import { COLUMN_GAP } from "@/constants/layout";
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

  // Regular width (iPhone Duo unfolded): the message in the first column, its button in the second
  const columns = useColumns(MEASUREMENTS.spacing.section);
  const messageStyle = useMemo(
    () => (columns ? [styles.message, { width: columns.startWidth }] : styles.message),
    [columns]
  );

  return (
    <View style={columns ? styles.containerWide : styles.container}>
      <View style={messageStyle}>
        <View style={iconWrapStyle}>
          <Ionicons name={icon} size={30} color={colors.primaryText} />
        </View>
        <AppText variant="title" center>{title}</AppText>
        <AppText variant="meta" center>{body}</AppText>
      </View>
      <AppButton title={actionLabel} onPress={onAction} style={columns ? styles.buttonWide : styles.button} />
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
  containerWide: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: COLUMN_GAP,
    paddingHorizontal: MEASUREMENTS.spacing.section,
  },
  message: {
    alignItems: "center",
    gap: MEASUREMENTS.spacing.md,
  },
  buttonWide: {
    flex: 1,
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
