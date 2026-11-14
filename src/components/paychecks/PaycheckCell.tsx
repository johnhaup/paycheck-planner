import { createContext, use, useCallback } from "react";
import type { ReactNode } from "react";
import { View, type LayoutChangeEvent, type StyleProp, type ViewProps, type ViewStyle } from "react-native";
import type { SharedValue } from "react-native-reanimated";
import type { PaycheckRow } from "@/components/paychecks/types";

/** Where the list's rows sit in its content, for the code that follows the scroll position. */
export interface PaycheckCellLayouts {
  /** Top of each month's first row, by month index */
  monthTops: SharedValue<number[]>;
  /** Bottom of the last row */
  lastBottom: SharedValue<number>;
}

/** What a list hands its `CellRendererComponent` */
interface Props {
  item: PaycheckRow;
  children: ReactNode;
  style: StyleProp<ViewStyle>;
  onLayout?: (event: LayoutChangeEvent) => void;
  onFocusCapture?: ViewProps["onFocusCapture"];
}

export const PaycheckCellLayoutsContext = createContext<PaycheckCellLayouts | undefined>(undefined);

/**
 * The Paychecks list's `CellRendererComponent`: React Native's own cell, which also
 * records where each month starts. A row's own `onLayout` cannot, its position is
 * relative to the cell; the cell's is relative to the list's content.
 */
export function PaycheckCell({ item, onLayout, onFocusCapture, style, children }: Props) {
  const layouts = use(PaycheckCellLayoutsContext);
  const { monthIndex, monthStart, last } = item;

  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      onLayout?.(event);
      if (!layouts) return;
      const { y, height } = event.nativeEvent.layout;
      if (monthStart) {
        layouts.monthTops.modify((tops) => {
          "worklet";
          tops[monthIndex] = y;
          return tops;
        });
      }
      if (last) {
        layouts.lastBottom.set(y + height);
      }
    },
    [onLayout, layouts, monthIndex, monthStart, last]
  );

  return (
    <View style={style} onFocusCapture={onFocusCapture} onLayout={handleLayout}>
      {children}
    </View>
  );
}
