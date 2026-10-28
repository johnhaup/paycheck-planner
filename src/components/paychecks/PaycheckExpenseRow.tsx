import { useCallback, useMemo } from "react";
import { View, Pressable, StyleSheet } from "react-native";
import Animated, { FadeIn, FadeOut, LinearTransition } from "react-native-reanimated";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useColors } from "@/hooks/useColors";
import { useMoneyFormat } from "@/hooks/useMoneyFormat";
import { useT } from "@/hooks/useLocale";
import { MEASUREMENTS } from "@/constants/measurements";
import { AppText } from "@/components/AppText";
import { AppCheckCircle } from "@/components/AppCheckCircle";
import { AppSetAsideIcon } from "@/components/AppSetAsideIcon";
import { AppSwipeActions, type SwipeAction } from "@/components/AppSwipeActions";
import type {
  EditAmountHandler,
  LinkTapHandler,
  PaycheckExpense,
  TogglePaidHandler,
} from "@/components/paychecks/types";

interface Props {
  expense: PaycheckExpense;
  payDate: string;
  sourceId: string;
  onTogglePaid: TogglePaidHandler;
  onLinkTap: LinkTapHandler;
  onEditAmount: EditAmountHandler;
  onMove: EditAmountHandler;
}

export function PaycheckExpenseRow({
  expense,
  payDate,
  sourceId,
  onTogglePaid,
  onLinkTap,
  onEditAmount,
  onMove,
}: Props) {
  const colors = useColors();
  const { format: formatMoney } = useMoneyFormat();
  const t = useT();

  const handleTogglePaid = useCallback(() => {
    onTogglePaid(expense.assignmentId, expense.expenseId, payDate, sourceId);
  }, [onTogglePaid, expense.assignmentId, expense.expenseId, payDate, sourceId]);

  const handleLinkTap = useCallback(() => {
    if (expense.link) {
      onLinkTap(expense.link, expense.assignmentId, expense.expenseId, payDate, sourceId);
    }
  }, [onLinkTap, expense.link, expense.assignmentId, expense.expenseId, payDate, sourceId]);

  const handleEditAmount = useCallback(() => {
    onEditAmount(expense.expenseId, payDate, sourceId);
  }, [onEditAmount, expense.expenseId, payDate, sourceId]);

  const handleMove = useCallback(() => {
    onMove(expense.expenseId, payDate, sourceId);
  }, [onMove, expense.expenseId, payDate, sourceId]);

  const rowStyle = useMemo(
    () => [styles.row, { borderTopColor: colors.divider, backgroundColor: colors.cardBackground }],
    [colors]
  );

  const markLabel = expense.paid
    ? t("paychecks.markUnpaid", { payee: expense.payee })
    : t(expense.isSetAside ? "paychecks.markSetAside" : "paychecks.markPaid", { payee: expense.payee });

  const paidAction = useMemo<SwipeAction>(
    () => ({
      icon: expense.paid ? "arrow-undo" : "checkmark",
      color: expense.paid ? colors.textMuted : colors.primary,
      accessibilityLabel: markLabel,
      onPress: handleTogglePaid,
    }),
    [expense.paid, colors, markLabel, handleTogglePaid]
  );

  // Paid bills stay put; moving is for shifting what's still owed
  const moveAction = useMemo<SwipeAction | undefined>(
    () =>
      expense.paid
        ? undefined
        : {
            icon: "swap-horizontal",
            color: colors.warning,
            accessibilityLabel: t("paychecks.moveThis", { payee: expense.payee }),
            onPress: handleMove,
          },
    [expense.paid, expense.payee, colors, handleMove, t]
  );

  const textColor = expense.paid ? "textMuted" : "textDefault";

  return (
    <Animated.View entering={FadeIn} exiting={FadeOut} layout={LinearTransition}>
      <AppSwipeActions leftAction={paidAction} rightAction={moveAction}>
        <View style={rowStyle}>
          <AppCheckCircle
            checked={!!expense.paid}
            onPress={handleTogglePaid}
            accessibilityLabel={markLabel}
          />
          <View style={styles.content}>
            <Pressable
              style={styles.payee}
              onPress={handleLinkTap}
              disabled={!expense.link}
              hitSlop={MEASUREMENTS.hitSlop}
              accessibilityRole={expense.link ? "link" : undefined}
            >
              {expense.isSetAside ? <AppSetAsideIcon /> : null}
              <AppText
                variant="body"
                color={textColor}
                numberOfLines={1}
                style={expense.paid ? styles.paid : undefined}
              >
                {expense.payee}
              </AppText>
              {expense.link ? (
                <Ionicons name="open-outline" size={14} color={colors.textMuted} />
              ) : null}
            </Pressable>
            <Pressable
              onPress={handleEditAmount}
              hitSlop={MEASUREMENTS.hitSlop}
              accessibilityRole="button"
              accessibilityLabel={t("paychecks.changeAmount", { payee: expense.payee })}
            >
              <AppText variant="body" color={textColor}>
                {formatMoney(expense.amount)}
              </AppText>
            </Pressable>
          </View>
        </View>
      </AppSwipeActions>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: MEASUREMENTS.spacing.base,
    paddingHorizontal: MEASUREMENTS.spacing.lg,
    paddingVertical: MEASUREMENTS.spacing.base - 1,
    borderTopWidth: 1,
  },
  content: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: MEASUREMENTS.spacing.md,
  },
  payee: {
    flexShrink: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: MEASUREMENTS.spacing.sm + 2,
  },
  paid: {
    textDecorationLine: "line-through",
  },
});
