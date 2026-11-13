import { useCallback, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { Pressable } from "react-native-gesture-handler";
import { MEASUREMENTS } from "@/constants/measurements";
import { useAccessibilityTextSize } from "@/hooks/useAccessibilityTextSize";
import { useColors } from "@/hooks/useColors";
import { useGroupedRowStyles } from "@/hooks/useGroupedRowStyles";
import { useMoneyFormat } from "@/hooks/useMoneyFormat";
import { useT } from "@/hooks/useLocale";
import { AppText } from "@/components/AppText";
import { AppLetterTile } from "@/components/AppLetterTile";
import { AppSwipeActions, type SwipeAction } from "@/components/AppSwipeActions";
import { describePaySchedule } from "@/utils/payDates";
import type { IncomeSource } from "@/types";

/** A pay amount too long for the row's width shrinks this far instead of breaking mid-number */
const AMOUNT_MIN_FONT_SCALE = 0.5;

interface Props {
  source: IncomeSource;
  tintIndex: number;
  isFirst: boolean;
  isLast: boolean;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function IncomeSourceRow({ source, tintIndex, isFirst, isLast, onEdit, onDelete }: Props) {
  const colors = useColors();
  const groupedStyles = useGroupedRowStyles(isFirst, isLast);
  const { split } = useMoneyFormat();
  const t = useT();
  const stacked = useAccessibilityTextSize();
  const { whole, cents } = split(source.payAmount);

  const handlePress = useCallback(() => {
    onEdit(source.id);
  }, [onEdit, source.id]);

  const handleDelete = useCallback(() => {
    onDelete(source.id);
  }, [onDelete, source.id]);

  const deleteAction = useMemo<SwipeAction>(
    () => ({
      icon: "trash-outline",
      color: colors.destructive,
      accessibilityLabel: t("common.delete"),
      onPress: handleDelete,
    }),
    [colors, t, handleDelete]
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
        <AppLetterTile label={source.name} tintIndex={tintIndex} size={44} />
        <View style={stacked ? styles.textStacked : styles.text}>
          <AppText variant="rowTitle" numberOfLines={stacked ? undefined : 1}>{source.name}</AppText>
          <AppText variant="meta" numberOfLines={stacked ? undefined : 1}>{describePaySchedule(source)}</AppText>
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
          <AppText variant="caption">{t("income.perCheck")}</AppText>
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
    gap: MEASUREMENTS.spacing.xs,
  },
  amount: {
    alignItems: "flex-end",
    gap: MEASUREMENTS.spacing.xs,
  },
  amountStacked: {
    gap: MEASUREMENTS.spacing.xs,
  },
});
