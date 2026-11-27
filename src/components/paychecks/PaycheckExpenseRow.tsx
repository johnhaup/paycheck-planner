import { useCallback, useMemo } from "react";
import { View, Pressable, StyleSheet, useWindowDimensions } from "react-native";
import Animated from "react-native-reanimated";
import { LAYOUT_SPRING, ROW_ENTERING, ROW_EXITING } from "@/constants/motion";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useAccessibilityTextSize } from "@/hooks/useAccessibilityTextSize";
import { useColors } from "@/hooks/useColors";
import { useMoneyFormat } from "@/hooks/useMoneyFormat";
import { useT } from "@/hooks/useLocale";
import { MEASUREMENTS } from "@/constants/measurements";
import { AppText } from "@/components/AppText";
import { AppCheckCircle } from "@/components/AppCheckCircle";
import { AppSetAsideIcon } from "@/components/AppSetAsideIcon";
import { AppSwipeActions, type SwipeAction } from "@/components/AppSwipeActions";
import { AppWordWrapText } from "@/components/AppWordWrapText";
import { formatDueDay } from "@/utils/payDates";
import type {
  EditAmountHandler,
  LinkTapHandler,
  PaycheckExpense,
  TogglePaidHandler,
} from "@/components/paychecks/types";
import { DIM_ON_PRESS, dimOnPress } from "@/constants/press";
import { hapticTap } from "@/utils/haptics";

/** Size of the payee's icons at the default text size; they scale with the text where rows stack */
const ICON_SIZE = 14;

/** iOS's line height for the system font, as a share of its size */
const LINE_HEIGHT_RATIO = 1.2;

/** An amount too long for the row's width shrinks this far instead of breaking mid-number */
const AMOUNT_MIN_FONT_SCALE = 0.5;

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
  const stacked = useAccessibilityTextSize();
  const { fontScale } = useWindowDimensions();
  const iconSize = stacked ? ICON_SIZE * fontScale : ICON_SIZE;

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
    () => [
      styles.row,
      stacked ? styles.rowStacked : undefined,
      { borderTopColor: colors.divider, backgroundColor: colors.cardBackground },
    ],
    [colors, stacked]
  );

  const markLabel = expense.paid
    ? t("paychecks.markUnpaid", { payee: expense.payee })
    : t(expense.isSetAside ? "paychecks.markSetAside" : "paychecks.markPaid", { payee: expense.payee });

  const paidAction = useMemo<SwipeAction>(
    () => ({
      icon: expense.paid ? "arrow-undo" : "checkmark",
      color: expense.paid ? colors.textMuted : colors.primary,
      accessibilityLabel: markLabel,
      // The check circle ticks by itself; the swipe action goes around it
      onPress: () => {
        hapticTap();
        handleTogglePaid();
      },
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

  const payeePressStyle = useMemo(() => dimOnPress(styles.payee), []);

  const payeeStyle = useMemo(
    () => [styles.payeeText, expense.paid ? styles.paid : undefined],
    [expense.paid]
  );

  const textColor = expense.paid ? "textMuted" : "textDefault";
  const setAsideIcon = expense.isSetAside ? <AppSetAsideIcon size={iconSize} /> : null;
  const linkIcon = expense.link ? (
    <Ionicons name="open-outline" size={iconSize} color={colors.textMuted} />
  ) : null;

  return (
    <Animated.View entering={ROW_ENTERING} exiting={ROW_EXITING} layout={LAYOUT_SPRING}>
      <AppSwipeActions startAction={paidAction} endAction={moveAction}>
        <View style={rowStyle}>
          <AppCheckCircle
            checked={!!expense.paid}
            onPress={handleTogglePaid}
            accessibilityLabel={markLabel}
            // Stacked, the circle is one line of the name tall and sits on its first line
            size={stacked ? MEASUREMENTS.font.body * fontScale * LINE_HEIGHT_RATIO : undefined}
          />
          <View style={stacked ? styles.contentStacked : styles.content}>
            <View style={styles.payeeColumn}>
              <Pressable
                style={payeePressStyle}
                onPress={handleLinkTap}
                disabled={!expense.link}
                hitSlop={MEASUREMENTS.hitSlop}
                accessibilityRole={expense.link ? "link" : undefined}
              >
                {stacked ? (
                  <AppWordWrapText
                    variant="body"
                    color={textColor}
                    style={expense.paid ? styles.paid : undefined}
                    leading={setAsideIcon}
                    trailing={linkIcon}
                  >
                    {expense.payee}
                  </AppWordWrapText>
                ) : (
                  <>
                    {setAsideIcon}
                    <AppText variant="body" color={textColor} numberOfLines={1} style={payeeStyle}>
                      {expense.payee}
                    </AppText>
                    {linkIcon}
                  </>
                )}
              </Pressable>
              {expense.dueDay !== undefined ? (
                <AppText variant="caption">{formatDueDay(expense.dueDay)}</AppText>
              ) : null}
            </View>
            <Pressable
              style={DIM_ON_PRESS}
              onPress={handleEditAmount}
              hitSlop={MEASUREMENTS.hitSlop}
              accessibilityRole="button"
              accessibilityLabel={t("paychecks.changeAmount", { payee: expense.payee })}
            >
              <AppText
                variant="body"
                color={textColor}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={AMOUNT_MIN_FONT_SCALE}
              >
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
  rowStacked: {
    alignItems: "flex-start",
  },
  content: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: MEASUREMENTS.spacing.md,
  },
  contentStacked: {
    flex: 1,
    alignItems: "flex-start",
    gap: MEASUREMENTS.spacing.md,
  },
  payeeColumn: {
    flexShrink: 1,
    gap: MEASUREMENTS.spacing.xs,
  },
  payee: {
    flexShrink: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: MEASUREMENTS.spacing.sm + 2,
  },
  payeeText: {
    flexShrink: 1,
  },
  paid: {
    textDecorationLine: "line-through",
  },
});
