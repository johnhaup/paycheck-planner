import { useCallback, useMemo } from "react";
import { useRouter } from "expo-router";
import { useStore } from "@/store";
import { useThemeStore } from "@/stores/themeStore";
import { PaycheckCard } from "@/components/paychecks/PaycheckCard";
import { openPaymentLink } from "@/utils/links";
import { useProGate } from "@/hooks/useProGate";
import type { PaycheckItem } from "@/components/paychecks/types";

interface Selection {
  payDate: string;
  sourceId: string;
}

/**
 * A FlatList `renderItem` for interactive paycheck cards. With `selection` (a regular-width screen)
 * a tap on a card picks its paycheck through `onSelect` instead of opening the pay date screen.
 */
export function usePaycheckCardRenderer(selection?: Selection, onSelect?: (payDate: string, sourceId: string) => void) {
  const router = useRouter();
  const assignExpense = useStore((s) => s.assignExpense);
  const togglePaid = useStore((s) => s.togglePaid);
  const autoMarkPaid = useThemeStore((s) => s.autoMarkPaidOnLinkTap);
  const { gate } = useProGate();

  const handleTogglePaid = useCallback(
    (assignmentId: string, expenseId: string, payDate: string, sourceId: string) => {
      const id = assignmentId || assignExpense(expenseId, payDate, sourceId);
      togglePaid(id);
    },
    [assignExpense, togglePaid]
  );

  const handleLinkTap = useCallback(
    (link: string, assignmentId: string, expenseId: string, payDate: string, sourceId: string) => {
      openPaymentLink(link);
      if (autoMarkPaid) {
        const id = assignmentId || assignExpense(expenseId, payDate, sourceId);
        const assignment = useStore.getState().assignments.find((a) => a.id === id);
        if (!assignment?.paid) {
          togglePaid(id);
        }
      }
    },
    [autoMarkPaid, assignExpense, togglePaid]
  );

  const handlePressPaycheck = useCallback(
    (payDate: string, sourceId: string) => {
      if (onSelect) {
        onSelect(payDate, sourceId);
      } else {
        router.push({ pathname: "/pay-date-detail", params: { payDate, sourceId } });
      }
    },
    [router, onSelect]
  );

  // Changing one paycheck's bill or pay amount is Pro; amounts already changed still show
  const handleEditAmount = useMemo(
    () =>
      gate((expenseId: string, payDate: string, sourceId: string) => {
        router.push({ pathname: "/expense-amount", params: { expenseId, payDate, sourceId } });
      }),
    [gate, router]
  );

  const handleEditPayAmount = useMemo(
    () =>
      gate((payDate: string, sourceId: string) => {
        router.push({ pathname: "/paycheck-amount", params: { payDate, sourceId } });
      }),
    [gate, router]
  );

  const handleMoveBill = useCallback(
    (payDate: string, sourceId: string) => {
      router.push({ pathname: "/move-bill", params: { payDate, sourceId } });
    },
    [router]
  );

  const handleMoveExpense = useCallback(
    (expenseId: string, payDate: string, sourceId: string) => {
      router.push({ pathname: "/move-bill", params: { payDate, sourceId, expenseId } });
    },
    [router]
  );

  return useCallback(
    ({ item }: { item: PaycheckItem }) => (
      <PaycheckCard
        item={item}
        selected={selection && item.payDate === selection.payDate && item.sourceId === selection.sourceId}
        onPress={handlePressPaycheck}
        onTogglePaid={handleTogglePaid}
        onLinkTap={handleLinkTap}
        onEditAmount={handleEditAmount}
        onEditPayAmount={handleEditPayAmount}
        onMoveBill={handleMoveBill}
        onMoveExpense={handleMoveExpense}
      />
    ),
    [
      selection,
      handlePressPaycheck,
      handleTogglePaid,
      handleLinkTap,
      handleEditAmount,
      handleEditPayAmount,
      handleMoveBill,
      handleMoveExpense,
    ]
  );
}
