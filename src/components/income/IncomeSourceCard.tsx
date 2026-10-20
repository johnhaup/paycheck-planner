import { useCallback, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { Pressable } from "react-native-gesture-handler";
import { useColors } from "@/hooks/useColors";
import { MEASUREMENTS } from "@/constants/measurements";
import { AppText } from "@/components/AppText";
import { AppSwipeToDelete } from "@/components/AppSwipeToDelete";
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
  onDelete: (id: string) => void;
}

export function IncomeSourceCard({ source, onEdit, onDelete }: Props) {
  const colors = useColors();

  const handlePress = useCallback(() => {
    onEdit(source.id);
  }, [onEdit, source.id]);

  const handleDelete = useCallback(() => {
    onDelete(source.id);
  }, [onDelete, source.id]);

  const cardStyle = useMemo(
    () => [styles.card, { backgroundColor: colors.cardBackground }],
    [colors]
  );

  return (
    <AppSwipeToDelete
      confirmTitle="Delete Income Source"
      confirmMessage={`Delete "${source.name}" and all its expense assignments?`}
      onConfirm={handleDelete}
      style={styles.swipeable}
    >
      <Pressable style={cardStyle} onPress={handlePress}>
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
    </AppSwipeToDelete>
  );
}

const styles = StyleSheet.create({
  swipeable: {
    marginBottom: MEASUREMENTS.spacing.md + 2,
  },
  card: {
    padding: MEASUREMENTS.spacing.lg,
    borderRadius: MEASUREMENTS.radius.lg,
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
