import { useCallback, useMemo, useRef } from "react";
import {
  LayoutChangeEvent,
  ScrollView,
  type ScrollViewInstance,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { useKeyboardState } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useT } from "@/hooks/useLocale";
import { MEASUREMENTS } from "@/constants/measurements";
import { AppText } from "@/components/AppText";
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
 * On iOS react-native-screens looks down a form sheet's chain of first
 * subviews for a scroll view and stretches the one it finds over the whole
 * sheet (RNSScreen.mm, applyFrameCorrectionForDescendantScrollView), which
 * drew this one behind the buttons. The empty view ahead of the ScrollView
 * ends that search, so the scroll view keeps the frame the layout gave it.
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
  const { height: windowHeight } = useWindowDimensions();
  const { top: topInset } = useSafeAreaInsets();
  const keyboardHeight = useKeyboardState((state) => state.height);

  const scrollRef = useRef<ScrollViewInstance>(null);
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
        maxHeight: windowHeight - keyboardHeight - topInset - MEASUREMENTS.spacing.lg,
      },
    ],
    [colors, windowHeight, keyboardHeight, topInset]
  );

  return (
    <View style={containerStyle}>
      <View collapsable={false} />
      <ScrollView
        ref={scrollRef}
        alwaysBounceVertical={false}
        keyboardShouldPersistTaps="handled"
        onLayout={handleScrollLayout}
        onContentSizeChange={handleContentSizeChange}
      >
        <View style={styles.heading}>
          <AppText variant="title">{title}</AppText>
          <AppText variant="meta">{subtitle}</AppText>
        </View>
        <AppInput
          value={amount}
          onChangeText={onChangeAmount}
          keyboardType="decimal-pad"
          autoFocus
          selectTextOnFocus
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
