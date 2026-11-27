import { useCallback, useMemo } from "react";
import { View, Pressable, StyleSheet, useWindowDimensions } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useAccessibilityTextSize } from "@/hooks/useAccessibilityTextSize";
import { useColors } from "@/hooks/useColors";
import { useMoneyFormat } from "@/hooks/useMoneyFormat";
import { useT } from "@/hooks/useLocale";
import { useGroupedRowStyles } from "@/hooks/useGroupedRowStyles";
import { MEASUREMENTS } from "@/constants/measurements";
import { AppText } from "@/components/AppText";
import { AppWordWrapText } from "@/components/AppWordWrapText";
import { AppCheckCircle } from "@/components/AppCheckCircle";
import { AppSetAsideIcon } from "@/components/AppSetAsideIcon";
import { formatDueDay, parseLocalDate } from "@/utils/payDates";
import type { Expense } from "@/types";
import { DIM_ON_PRESS, dimOnPress } from "@/constants/press";
import { hapticTap } from "@/utils/haptics";

/** Icon sizes at the default text size; they scale with the text where rows stack */
const ICON_SIZE = 14;
const TOGGLE_SIZE = 26;

/** iOS's line height for the system font, as a share of its size */
const LINE_HEIGHT_RATIO = 1.2;

/** The add / remove button stops growing here, so it fits the card */
const TOGGLE_MAX_SCALE = 2;

interface Props {
  expense: Expense;
  /** This paycheck's date (YYYY-MM-DD), for the due day in its month */
  payDate: string;
  /** This paycheck's amount, which may differ from the expense default */
  amount: number;
  isAssigned: boolean;
  isPaid: boolean;
  /** Linked to the income source but not yet explicitly assigned, so it can't be removed */
  isLinkedPreload: boolean;
  isFirst: boolean;
  isLast: boolean;
  onTogglePaid: (expenseId: string) => void;
  onOpenLink: (link: string, expenseId: string) => void;
  onAssign: (expenseId: string) => void;
  onUnassign: (expenseId: string) => void;
  onEditAmount: (expenseId: string) => void;
}

export function PayDateExpenseRow({
  expense,
  payDate,
  amount,
  isAssigned,
  isPaid,
  isLinkedPreload,
  isFirst,
  isLast,
  onTogglePaid,
  onOpenLink,
  onAssign,
  onUnassign,
  onEditAmount,
}: Props) {
  const colors = useColors();
  const { format: formatMoney } = useMoneyFormat();
  const t = useT();
  const groupedStyles = useGroupedRowStyles(isFirst, isLast);
  const stacked = useAccessibilityTextSize();
  const { fontScale } = useWindowDimensions();
  const iconSize = stacked ? ICON_SIZE * fontScale : ICON_SIZE;
  const toggleSize = stacked
    ? TOGGLE_SIZE * Math.min(fontScale, TOGGLE_MAX_SCALE)
    : TOGGLE_SIZE;

  const handleTogglePaid = useCallback(() => {
    onTogglePaid(expense.id);
  }, [onTogglePaid, expense.id]);

  const handleOpenLink = useCallback(() => {
    if (expense.link) {
      onOpenLink(expense.link, expense.id);
    }
  }, [onOpenLink, expense.link, expense.id]);

  const handleEditAmount = useCallback(() => {
    onEditAmount(expense.id);
  }, [onEditAmount, expense.id]);

  const handleToggleAssigned = useCallback(() => {
    hapticTap();
    if (isAssigned) {
      onUnassign(expense.id);
    } else {
      onAssign(expense.id);
    }
  }, [isAssigned, onAssign, onUnassign, expense.id]);

  const titleRowStyle = useMemo(() => dimOnPress(styles.titleRow), []);

  const textColor = isPaid ? "textMuted" : "textDefault";
  const isSetAside = expense.kind === "set-aside";
  const linkIcon = expense.link ? (
    <Ionicons name="open-outline" size={iconSize} color={colors.textMuted} />
  ) : null;

  const toggle = isLinkedPreload ? null : (
    <Pressable
      style={DIM_ON_PRESS}
      onPress={handleToggleAssigned}
      hitSlop={MEASUREMENTS.hitSlop}
      accessibilityRole="button"
      accessibilityLabel={
        isAssigned
          ? t("payDate.remove", { payee: expense.payee })
          : t("payDate.add", { payee: expense.payee })
      }
    >
      <Ionicons
        name={isAssigned ? "remove-circle-outline" : "add-circle"}
        size={toggleSize}
        color={isAssigned ? colors.textMuted : colors.primary}
      />
    </Pressable>
  );

  return (
    <View style={groupedStyles.container}>
      <View
        style={
          stacked ? [groupedStyles.row, styles.rowStacked] : groupedStyles.row
        }
      >
        {isAssigned ? (
          <AppCheckCircle
            checked={isPaid}
            onPress={handleTogglePaid}
            // Stacked, the circle is one line of the name tall and sits on its first line
            size={
              stacked
                ? MEASUREMENTS.font.body * fontScale * LINE_HEIGHT_RATIO
                : undefined
            }
            accessibilityLabel={t(
              isPaid
                ? "paychecks.markUnpaid"
                : isSetAside
                  ? "paychecks.markSetAside"
                  : "paychecks.markPaid",
              { payee: expense.payee },
            )}
          />
        ) : null}
        <View style={styles.info}>
          <Pressable
            style={titleRowStyle}
            onPress={handleOpenLink}
            disabled={!expense.link}
            accessibilityRole={expense.link ? "link" : undefined}
          >
            {isSetAside && !stacked ? <AppSetAsideIcon /> : null}
            {stacked ? (
              <AppWordWrapText
                variant="body"
                color={textColor}
                style={isPaid ? styles.titlePaid : undefined}
                leading={
                  isSetAside ? <AppSetAsideIcon size={iconSize} /> : null
                }
                trailing={linkIcon}
              >
                {expense.payee}
              </AppWordWrapText>
            ) : (
              <AppText
                variant="body"
                color={textColor}
                numberOfLines={1}
                style={isPaid ? styles.titlePaid : styles.title}
              >
                {expense.payee}
              </AppText>
            )}
            {stacked ? null : linkIcon}
          </Pressable>
          <View style={styles.amountRow}>
            <Pressable
              style={DIM_ON_PRESS}
              onPress={handleEditAmount}
              disabled={!isAssigned}
              accessibilityRole={isAssigned ? "button" : undefined}
              accessibilityLabel={t("paychecks.changeAmount", {
                payee: expense.payee,
              })}
            >
              <AppText
                variant="meta"
                color={isPaid ? "textMuted" : "textSecondary"}
              >
                {formatMoney(amount)}
              </AppText>
            </Pressable>
            {stacked ? toggle : null}
          </View>
          {expense.dueDay !== undefined && expense.isRecurring ? (
            <AppText variant="caption">
              {formatDueDay(expense.dueDay, parseLocalDate(payDate))}
            </AppText>
          ) : null}
          {isLinkedPreload && stacked ? (
            <AppText variant="caption">{t("payDate.linked")}</AppText>
          ) : null}
        </View>
        {stacked ? null : isLinkedPreload ? (
          <AppText variant="caption">{t("payDate.linked")}</AppText>
        ) : (
          toggle
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rowStacked: {
    alignItems: "flex-start",
  },
  info: {
    flex: 1,
    gap: MEASUREMENTS.spacing.xs,
  },
  titleRow: {
    alignSelf: "flex-start",
    maxWidth: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: MEASUREMENTS.spacing.sm + 2,
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    flexShrink: 1,
  },
  titlePaid: {
    flexShrink: 1,
    textDecorationLine: "line-through",
  },
});
