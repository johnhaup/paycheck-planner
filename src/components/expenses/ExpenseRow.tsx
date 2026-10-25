import { useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { Pressable } from "react-native-gesture-handler";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useColors } from "@/hooks/useColors";
import { useMoneyFormat } from "@/hooks/useMoneyFormat";
import { useT } from "@/hooks/useLocale";
import { useGroupedRowStyles } from "@/hooks/useGroupedRowStyles";
import { MEASUREMENTS } from "@/constants/measurements";
import { AppText } from "@/components/AppText";
import { AppLetterTile } from "@/components/AppLetterTile";
import { AppSetAsideIcon } from "@/components/AppSetAsideIcon";
import { AppSwipeToDelete } from "@/components/AppSwipeToDelete";
import type { Expense } from "@/types";

interface Props {
  expense: Expense;
  meta: string;
  cadence: string;
  /** Tint of the linked income source; omit for the neutral tile */
  tintIndex?: number;
  isFirst: boolean;
  isLast: boolean;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onOpenLink: (link: string) => void;
}

export function ExpenseRow({
  expense,
  meta,
  cadence,
  tintIndex,
  isFirst,
  isLast,
  onEdit,
  onDelete,
  onOpenLink,
}: Props) {
  const colors = useColors();
  const groupedStyles = useGroupedRowStyles(isFirst, isLast);
  const { split } = useMoneyFormat();
  const t = useT();
  const { whole, cents } = split(expense.amount);

  const handlePress = useCallback(() => {
    onEdit(expense.id);
  }, [onEdit, expense.id]);

  const handleDelete = useCallback(() => {
    onDelete(expense.id);
  }, [onDelete, expense.id]);

  const handleOpenLink = useCallback(() => {
    if (expense.link) {
      onOpenLink(expense.link);
    }
  }, [onOpenLink, expense.link]);

  return (
    <AppSwipeToDelete
      confirmTitle={t("expenses.deleteTitle")}
      confirmMessage={t("expenses.deleteMessage", { payee: expense.payee })}
      onConfirm={handleDelete}
      style={groupedStyles.container}
    >
      <Pressable style={groupedStyles.row} onPress={handlePress}>
        <AppLetterTile label={expense.payee} tintIndex={tintIndex} />
        <View style={styles.text}>
          <View style={styles.titleRow}>
            {expense.kind === "set-aside" ? <AppSetAsideIcon size={15} /> : null}
            <AppText variant="rowTitle" numberOfLines={1} style={styles.title}>
              {expense.payee}
            </AppText>
            {expense.link ? (
              <Pressable
                onPress={handleOpenLink}
                hitSlop={MEASUREMENTS.hitSlop}
                accessibilityRole="link"
                accessibilityLabel={t("expenses.openLink", { payee: expense.payee })}
              >
                <Ionicons name="open-outline" size={15} color={colors.textMuted} />
              </Pressable>
            ) : null}
          </View>
          <AppText variant="meta" numberOfLines={1}>{meta}</AppText>
        </View>
        <View style={styles.amount}>
          <AppText variant="rowTitle">
            {whole}
            <AppText variant="rowTitle" color="textMuted">{cents}</AppText>
          </AppText>
          <AppText variant="caption">{cadence}</AppText>
        </View>
      </Pressable>
    </AppSwipeToDelete>
  );
}

const styles = StyleSheet.create({
  text: {
    flex: 1,
    gap: MEASUREMENTS.spacing.xs,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: MEASUREMENTS.spacing.sm + 2,
  },
  title: {
    flexShrink: 1,
  },
  amount: {
    alignItems: "flex-end",
    gap: MEASUREMENTS.spacing.xs,
  },
});
