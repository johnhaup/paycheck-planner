import { useCallback, useMemo } from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { useColors } from "@/hooks/useColors";
import { MEASUREMENTS } from "@/constants/measurements";
import { AppText } from "@/components/AppText";
import type { IncomeSource } from "@/types";

const FREQUENCY_LABELS: Record<string, string> = {
  weekly: "Weekly",
  biweekly: "Bi-weekly",
  "semi-monthly": "Semi-monthly",
  monthly: "Monthly",
};

interface Props {
  source: IncomeSource;
  onEdit: (id: string) => void;
  onDelete: (source: IncomeSource) => void;
}

export function IncomeSourceCard({ source, onEdit, onDelete }: Props) {
  const colors = useColors();

  const handlePress = useCallback(() => {
    onEdit(source.id);
  }, [onEdit, source.id]);

  const handleLongPress = useCallback(() => {
    onDelete(source);
  }, [onDelete, source]);

  const cardStyle = useMemo(
    () => [styles.card, { backgroundColor: colors.cardBackground }],
    [colors]
  );

  return (
    <Pressable style={cardStyle} onPress={handlePress} onLongPress={handleLongPress}>
      <View style={styles.cardTop}>
        <AppText variant="h3">{source.name}</AppText>
        <AppText variant="h3" color="primary">
          ${source.payAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
        </AppText>
      </View>
      <AppText variant="caption" style={styles.frequency}>
        {FREQUENCY_LABELS[source.payFrequency] ?? source.payFrequency}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: MEASUREMENTS.spacing.lg,
    borderRadius: MEASUREMENTS.radius.lg,
    marginBottom: MEASUREMENTS.spacing.md + 2,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  frequency: {
    marginTop: MEASUREMENTS.spacing.sm,
  },
});
