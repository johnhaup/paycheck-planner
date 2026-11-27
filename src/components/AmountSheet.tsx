import { useCallback, useMemo, useRef } from "react";
import {
  LayoutChangeEvent,
  Platform,
  ScrollView,
  type ScrollViewInstance,
  StyleSheet,
  type TextInputInstance,
  useWindowDimensions,
  View,
} from "react-native";
import { useKeyboardState } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useT } from "@/hooks/useLocale";
import { useAccessibilityTextSize } from "@/hooks/useAccessibilityTextSize";
import { useBottomPadding } from "@/hooks/useBottomPadding";
import { MEASUREMENTS } from "@/constants/measurements";
import { AppText } from "@/components/AppText";
import { AppWordWrapText } from "@/components/AppWordWrapText";
import { AppInput } from "@/components/AppInput";
import { AppButton } from "@/components/AppButton";

interface Props {
  title: string;
  subtitle: string;
  hint: string;
  amount: string;
  onChangeAmount: (amount: string) => void;
  onSave: () => void;
  /** Shown under Save when this paycheck has its own amount. */
  resetTitle?: string;
  onReset: () => void;
}

/**
 * The body of a fit-to-contents form sheet that edits one amount.
 *
 * The sheet cannot grow past the top of the screen, so at large text sizes its
 * content used to run under the number pad, Save included. The body is capped
 * to the space between the sheet's top and the keyboard: the buttons stay
 * pinned at the bottom of that space and the text above them scrolls.
 *
 * On iOS react-native-screens sizes a form sheet's scroll view to the whole
 * sheet, which drew this one behind the buttons. It finds the scroll view
 * among the direct subviews of the screen's content wrapper, or down the chain
 * of first subviews (RNSScreen.mm, tryFindDescendantScrollView). The body is
 * therefore never flattened into the wrapper, and an empty view sits ahead of
 * the ScrollView: neither search reaches it, so it keeps the frame the layout
 * gave it.
 */
export function AmountSheet({
  title,
  subtitle,
  hint,
  amount,
  onChangeAmount,
  onSave,
  resetTitle,
  onReset,
}: Props) {
  const colors = useColors();
  const t = useT();
  const largeText = useAccessibilityTextSize();
  const { height: windowHeight } = useWindowDimensions();
  const { top: topInset } = useSafeAreaInsets();
  const keyboardHeight = useKeyboardState((state) => state.height);
  // Android: the sheet runs under the navigation bar, unless the keyboard (which covers it) is up
  const bottomPadding = useBottomPadding();

  const scrollRef = useRef<ScrollViewInstance>(null);
  const inputRef = useRef<TextInputInstance>(null);

  // Select the amount on open so the first digit replaces it. selectTextOnFocus
  // does nothing for an input autofocused inside a form sheet on iOS 27 (HAU-904):
  // the caret lands after the old amount. Selecting a frame after focus works.
  const selectAmount = useCallback(() => {
    requestAnimationFrame(() => inputRef.current?.setSelection(0, amount.length));
  }, [amount]);
  const layout = useRef({ viewport: 0, content: 0, inputY: 0 });

  // When the text does not fit, start with the input at the top of what is
  // visible instead of the title. Scrolls nowhere when everything fits.
  const showInput = useCallback(() => {
    const { viewport, content, inputY } = layout.current;
    const y = Math.max(0, Math.min(inputY, content - viewport));
    scrollRef.current?.scrollTo({ y, animated: false });
  }, []);

  const handleScrollLayout = useCallback(
    (e: LayoutChangeEvent) => {
      layout.current.viewport = e.nativeEvent.layout.height;
      showInput();
    },
    [showInput]
  );

  const handleContentSizeChange = useCallback(
    (_width: number, height: number) => {
      layout.current.content = height;
      showInput();
    },
    [showInput]
  );

  const handleInputLayout = useCallback(
    (e: LayoutChangeEvent) => {
      layout.current.inputY = e.nativeEvent.layout.y;
      showInput();
    },
    [showInput]
  );

  const containerStyle = useMemo(
    () => [
      styles.container,
      {
        backgroundColor: colors.modalBackground,
        // Android lifts the sheet itself, so the window is not shortened by the keyboard there
        maxHeight:
          windowHeight - (isAndroid ? 0 : keyboardHeight) - topInset - MEASUREMENTS.spacing.lg,
      },
      // Android keeps the padding with the keyboard up: the sheet lifts itself by the keyboard minus the
      // navigation bar, so the padding is what slides behind the keyboard (react-native-screens)
      isAndroid || keyboardHeight === 0 ? bottomPadding : undefined,
    ],
    [colors, windowHeight, keyboardHeight, topInset, bottomPadding]
  );

  return (
    <View style={containerStyle} collapsable={false}>
      <View collapsable={false} />
      <ScrollView
        ref={scrollRef}
        alwaysBounceVertical={false}
        keyboardShouldPersistTaps="handled"
        onLayout={handleScrollLayout}
        onContentSizeChange={handleContentSizeChange}
      >
        <View style={styles.heading}>
          {largeText ? (
            <AppWordWrapText variant="title">{title}</AppWordWrapText>
          ) : (
            <AppText variant="title">{title}</AppText>
          )}
          <AppText variant="meta">{subtitle}</AppText>
        </View>
        <AppInput
          ref={inputRef}
          value={amount}
          onChangeText={onChangeAmount}
          keyboardType="decimal-pad"
          autoFocus
          onFocus={selectAmount}
          onLayout={handleInputLayout}
        />
        <AppText variant="caption" style={styles.hint}>
          {hint}
        </AppText>
      </ScrollView>
      <View style={styles.actions}>
        <AppButton title={t("common.save")} onPress={onSave} />
        {resetTitle ? (
          <AppButton title={resetTitle} variant="outline" onPress={onReset} />
        ) : null}
      </View>
    </View>
  );
}

const isAndroid = Platform.OS === "android";

const styles = StyleSheet.create({
  container: {
    padding: MEASUREMENTS.spacing.gutter,
    paddingTop: MEASUREMENTS.spacing.xxl,
  },
  heading: {
    gap: MEASUREMENTS.spacing.xs,
    marginBottom: MEASUREMENTS.spacing.lg,
  },
  hint: {
    marginTop: MEASUREMENTS.spacing.sm + 2,
  },
  actions: {
    gap: MEASUREMENTS.spacing.md,
    marginTop: MEASUREMENTS.spacing.xl,
  },
});
