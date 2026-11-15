import { useCallback, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { Pressable } from "react-native-gesture-handler";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useAccessibilityTextSize } from "@/hooks/useAccessibilityTextSize";
import { useColors } from "@/hooks/useColors";
import { useMoneyFormat } from "@/hooks/useMoneyFormat";
import { useT } from "@/hooks/useLocale";
import { useGroupedRowStyles } from "@/hooks/useGroupedRowStyles";
import { MEASUREMENTS } from "@/constants/measurements";
import { AppText } from "@/components/AppText";
import { AppLetterTile } from "@/components/AppLetterTile";
import { AppSetAsideIcon } from "@/components/AppSetAsideIcon";
import { AppSwipeActions, type SwipeAction } from "@/components/AppSwipeActions";
import { AppWordWrapText } from "@/components/AppWordWrapText";
import type { Expense } from "@/types";

/** An amount too long for the row's width shrinks this far instead of breaking mid-number */
const AMOUNT_MIN_FONT_SCALE = 0.5;

interface Props {
  expense: Expense;
  meta: string;
  cadence: string;
  /** Tint of the linked income source; omit for the neutral tile */
  tintIndex?: number;
  goalProgress?: { saved: number; goal: number };
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
  goalProgress,
  isFirst,
  isLast,
  onEdit,
  onDelete,
  onOpenLink,
}: Props) {
  const colors = useColors();
  const groupedStyles = useGroupedRowStyles(isFirst, isLast);
  const { split, format: formatMoney } = useMoneyFormat();
  const t = useT();
  const stacked = useAccessibilityTextSize();
  const { whole, cents } = split(expense.amount);

  const handlePress = useCallback(() => {
    onEdit(expense.id);
  }, [onEdit, expense.id]);

  const handleDelete = useCallback(() => {
    onDelete(expense.id);
  }, [onDelete, expense.id]);

  const deleteAction = useMemo<SwipeAction>(
    () => ({
      icon: "trash-outline",
      color: colors.destructive,
      accessibilityLabel: t("common.delete"),
      onPress: handleDelete,
    }),
    [colors, t, handleDelete]
  );

  const handleOpenLink = useCallback(() => {
    if (expense.link) {
      onOpenLink(expense.link);
    }
  }, [onOpenLink, expense.link]);

  const goalReached = !!goalProgress && goalProgress.saved >= goalProgress.goal;

  const goalTrackStyle = useMemo(() => [styles.goalTrack, { backgroundColor: colors.border }], [colors]);

  const goalFillStyle = useMemo(
    () =>
      goalProgress
        ? [
            styles.goalFill,
            {
              width: `${Math.min(100, (goalProgress.saved / goalProgress.goal) * 100)}%` as const,
              backgroundColor: colors.primary,
            },
          ]
        : undefined,
    [goalProgress, colors]
  );

  const rowStyle = useMemo(
    () => (stacked ? [groupedStyles.row, styles.rowStacked] : groupedStyles.row),
    [stacked, groupedStyles]
  );

  return (
    <AppSwipeActions
      rightAction={deleteAction}
      style={groupedStyles.container}
    >
      <Pressable style={rowStyle} onPress={handlePress}>
        <AppLetterTile label={expense.payee} tintIndex={tintIndex} icon={expense.icon} />
        <View style={stacked ? styles.textStacked : styles.text}>
          <View style={styles.titleRow}>
            {expense.kind === "set-aside" ? <AppSetAsideIcon size={15} /> : null}
            {stacked ? (
              <AppWordWrapText variant="rowTitle">{expense.payee}</AppWordWrapText>
            ) : (
              <AppText variant="rowTitle" numberOfLines={1} style={styles.title}>
                {expense.payee}
              </AppText>
            )}
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
          <AppText variant="meta" numberOfLines={stacked ? undefined : 1}>{meta}</AppText>
          {goalProgress ? (
            <>
              <AppText
                variant="caption"
                color={goalReached ? "primaryText" : "textSecondary"}
                numberOfLines={stacked ? undefined : 1}
              >
                {t(goalReached ? "expenses.goalReached" : "expenses.goalProgress", {
                  saved: formatMoney(goalProgress.saved),
                  goal: formatMoney(goalProgress.goal),
                })}
              </AppText>
              <View style={goalTrackStyle}>
                <View style={goalFillStyle} />
              </View>
            </>
          ) : null}
        </View>
        <View style={stacked ? styles.amountStacked : styles.amount}>
          <AppText
            variant="rowTitle"
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={AMOUNT_MIN_FONT_SCALE}
          >
            {whole}
            <AppText variant="rowTitle" color="textMuted">{cents}</AppText>
          </AppText>
          <AppText variant="caption">{cadence}</AppText>
        </View>
      </Pressable>
    </AppSwipeActions>
  );
}

const styles = StyleSheet.create({
  rowStacked: {
    flexDirection: "column",
    alignItems: "flex-start",
  },
  text: {
    flex: 1,
    gap: MEASUREMENTS.spacing.xs,
  },
  textStacked: {
    alignSelf: "stretch",
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
  goalTrack: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
    marginTop: MEASUREMENTS.spacing.xs,
  },
  goalFill: {
    height: 4,
    borderRadius: 2,
  },
  amount: {
    alignItems: "flex-end",
    gap: MEASUREMENTS.spacing.xs,
  },
  amountStacked: {
    gap: MEASUREMENTS.spacing.xs,
  },
});
