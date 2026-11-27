import { useCallback, useMemo } from "react";
import { Pressable, StyleSheet, useWindowDimensions } from "react-native";
import { useStore } from "@/store";
import { useT } from "@/hooks/useLocale";
import { usePaycheckBills } from "@/hooks/usePaycheckBills";
import { MEASUREMENTS } from "@/constants/measurements";
import { dimOnPress } from "@/constants/press";
import { AppText } from "@/components/AppText";
import { withUndo } from "@/utils/undo";

// "Mark all paid" is 33 characters in Malayalam and took two-thirds of the
// navigation bar, leaving no room for the title. The button gets at most this
// share of the bar; a longer translation shrinks to fit, then truncates.
const HEADER_BUTTON_MAX_WIDTH_RATIO = 0.4;
const HEADER_BUTTON_MIN_FONT_SCALE = 0.7;
// The navigation bar's button pill has a fixed height and shares the bar with
// Back and the title, neither of which scales, so its text does not either
const HEADER_MAX_FONT_MULTIPLIER = 1;

interface Props {
  payDate: string;
  sourceId: string;
  /** In the Pay date summary beside the Paychecks list, where it shrinks with the row, instead of the navigation bar */
  embedded?: boolean;
}

/** `headerRight` for the Pay date screen's navigation bar */
export function markAllPaidHeaderRight(payDate: string, sourceId: string) {
  return function PayDateHeaderRight() {
    return <MarkAllPaidButton payDate={payDate} sourceId={sourceId} />;
  };
}

/** Marks every unpaid bill on one paycheck paid, with Undo. Renders nothing when none is unpaid. */
export function MarkAllPaidButton({ payDate, sourceId, embedded }: Props) {
  const t = useT();
  const markPaid = useStore((s) => s.markPaid);
  const { unpaidExpenseIds } = usePaycheckBills(payDate, sourceId);
  const { width: windowWidth } = useWindowDimensions();

  const handlePress = useCallback(() => {
    withUndo(t("toasts.markedAllPaid"), () => markPaid(unpaidExpenseIds, payDate, sourceId));
  }, [unpaidExpenseIds, markPaid, payDate, sourceId, t]);

  const textStyle = useMemo(
    () => (embedded ? styles.embeddedButtonText : { maxWidth: windowWidth * HEADER_BUTTON_MAX_WIDTH_RATIO }),
    [embedded, windowWidth]
  );

  if (unpaidExpenseIds.length === 0) return null;

  return (
    <Pressable
      style={embedded ? EMBEDDED_BUTTON_STYLE : HEADER_BUTTON_STYLE}
      onPress={handlePress}
      hitSlop={MEASUREMENTS.hitSlop}
      accessibilityRole="button"
    >
      <AppText
        variant="bodyStrong"
        color="primaryText"
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={HEADER_BUTTON_MIN_FONT_SCALE}
        maxFontSizeMultiplier={HEADER_MAX_FONT_MULTIPLIER}
        style={textStyle}
      >
        {t("payDate.markAllPaid")}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // iOS wraps a custom bar button in a glass pill hugging its content; this gives the text the
  // same side padding inside it as UIKit's own Back button.
  headerButton: {
    paddingHorizontal: MEASUREMENTS.spacing.base,
  },
  embeddedButton: {
    flexShrink: 1,
  },
  embeddedButtonText: {
    flexShrink: 1,
  },
});

const HEADER_BUTTON_STYLE = dimOnPress(styles.headerButton);
const EMBEDDED_BUTTON_STYLE = dimOnPress(styles.embeddedButton);
