import { useCallback } from "react";
import { View, Pressable, StyleSheet } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useColors } from "@/hooks/useColors";
import { useMoneyFormat } from "@/hooks/useMoneyFormat";
import { useT } from "@/hooks/useLocale";
import { useGroupedRowStyles } from "@/hooks/useGroupedRowStyles";
import { MEASUREMENTS } from "@/constants/measurements";
import { AppText } from "@/components/AppText";
import { AppCheckCircle } from "@/components/AppCheckCircle";
import { AppSetAsideIcon } from "@/components/AppSetAsideIcon";
import type { Expense } from "@/types";

interface Props {
  expense: Expense;
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
    if (isAssigned) {
      onUnassign(expense.id);
    } else {
      onAssign(expense.id);
    }
  }, [isAssigned, onAssign, onUnassign, expense.id]);

  const textColor = isPaid ? "textMuted" : "textDefault";
  const isSetAside = expense.kind === "set-aside";

  return (
    <View style={groupedStyles.container}>
      <View style={groupedStyles.row}>
        {isAssigned ? (
          <AppCheckCircle
            checked={isPaid}
            onPress={handleTogglePaid}
            accessibilityLabel={t(
              isPaid ? "paychecks.markUnpaid" : isSetAside ? "paychecks.markSetAside" : "paychecks.markPaid",
              { payee: expense.payee }
            )}
          />
        ) : null}
        <View style={styles.info}>
          <Pressable
            style={styles.titleRow}
            onPress={handleOpenLink}
            disabled={!expense.link}
            accessibilityRole={expense.link ? "link" : undefined}
          >
            {isSetAside ? <AppSetAsideIcon /> : null}
            <AppText
              variant="body"
              color={textColor}
              numberOfLines={1}
              style={isPaid ? styles.titlePaid : styles.title}
            >
              {expense.payee}
            </AppText>
            {expense.link ? (
              <Ionicons name="open-outline" size={14} color={colors.textMuted} />
            ) : null}
          </Pressable>
          <Pressable
            style={styles.amount}
            onPress={handleEditAmount}
            disabled={!isAssigned}
            accessibilityRole={isAssigned ? "button" : undefined}
            accessibilityLabel={t("paychecks.changeAmount", { payee: expense.payee })}
          >
            <AppText variant="meta" color={isPaid ? "textMuted" : "textSecondary"}>
              {formatMoney(amount)}
            </AppText>
          </Pressable>
        </View>
        {isLinkedPreload ? (
          <AppText variant="caption">{t("payDate.linked")}</AppText>
        ) : (
          <Pressable
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
              size={26}
              color={isAssigned ? colors.textMuted : colors.primary}
            />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
  amount: {
    alignSelf: "flex-start",
  },
  title: {
    flexShrink: 1,
  },
  titlePaid: {
    flexShrink: 1,
    textDecorationLine: "line-through",
  },
});
