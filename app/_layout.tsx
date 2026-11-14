import { useCallback, useEffect, useMemo } from "react";
import { Appearance, I18nManager, LogBox, Platform, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, useRouter } from "expo-router";
import { requireOptionalNativeModule } from "expo";
import { StatusBar } from "expo-status-bar";
import { Toaster } from "sonner-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useColors, useIsDark } from "@/hooks/useColors";
import { useStackScreenOptions } from "@/hooks/useStackScreenOptions";
import { useT } from "@/hooks/useLocale";
import { usePaydayReminders } from "@/hooks/usePaydayReminders";
import { useThemeStore } from "@/stores/themeStore";
import { useProEntitlement } from "@/services/pro";
import { MEASUREMENTS } from "@/constants/measurements";

// sonner-native 0.27.0 passes dependency arrays to useDerivedValue/useAnimatedStyle,
// which Reanimated 4 warns about on native. The warning fires with the first toast
// and raises the LogBox banner over the tab bar in dev builds (HAU-60). LogBox is a
// no-op in release builds, so this only affects dev.
LogBox.ignoreLogs(["Dependencies should only be used on the web and are always ignored on native"]);

// UIKit takes its direction from the device language, React Native from the
// in-app one. modules/layout-direction makes the native headers follow React
// Native when the two disagree (HAU-171). iOS only.
void requireOptionalNativeModule<{ setRTL: (rtl: boolean) => Promise<void> }>("LayoutDirection")?.setRTL(
  I18nManager.isRTL
);

const TABS_OPTIONS = { headerShown: false };
const ANDROID_TOOLBAR_HEIGHT = 56;

export default function RootLayout() {
  const colors = useColors();
  const isDark = useIsDark();
  const router = useRouter();
  const screenOptions = useStackScreenOptions();
  const t = useT();
  const themeMode = useThemeStore((s) => s.themeMode);
  usePaydayReminders();
  useProEntitlement();

  const handleCloseModal = useCallback(() => {
    router.back();
  }, [router]);

  const renderCloseButton = useCallback(
    () => (
      <Pressable
        onPress={handleCloseModal}
        hitSlop={MEASUREMENTS.hitSlop}
        accessibilityRole="button"
        accessibilityLabel={t("common.close")}
      >
        <Ionicons name="close" size={24} color={colors.textDefault} />
      </Pressable>
    ),
    [handleCloseModal, colors, t]
  );

  const navigationTheme = useMemo(() => {
    const base = isDark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: colors.primary,
        background: colors.screenBackground,
        card: colors.cardBackground,
        text: colors.textDefault,
        border: colors.border,
      },
    };
  }, [isDark, colors]);

  const modalOptions = useMemo(
    () => ({
      presentation: "modal" as const,
      headerStyle: { backgroundColor: colors.modalBackground },
      contentStyle: { backgroundColor: colors.modalBackground },
    }),
    [colors]
  );

  const incomeFormOptions = useMemo(
    () => ({ ...modalOptions, title: t("screens.incomeSource") }),
    [modalOptions, t]
  );

  const expenseFormOptions = useMemo(
    () => ({ ...modalOptions, title: t("screens.expense") }),
    [modalOptions, t]
  );

  const payDateDetailOptions = useMemo(
    () => ({ title: t("screens.payDate"), presentation: "card" as const }),
    [t]
  );

  const historyOptions = useMemo(() => ({ title: t("screens.history") }), [t]);

  const languageOptions = useMemo(
    () => ({ ...modalOptions, title: t("screens.language") }),
    [modalOptions, t]
  );

  const currencyOptions = useMemo(
    () => ({ ...modalOptions, title: t("screens.currency") }),
    [modalOptions, t]
  );

  const sheetOptions = useMemo(
    () => ({
      presentation: "formSheet" as const,
      headerShown: false,
      sheetAllowedDetents: "fitToContents" as const,
      sheetGrabberVisible: true,
      contentStyle: { backgroundColor: colors.modalBackground },
    }),
    [colors]
  );

  const settingsOptions = useMemo(
    () => ({ ...modalOptions, title: t("screens.settings"), headerRight: renderCloseButton }),
    [modalOptions, renderCloseButton, t]
  );

  const paywallOptions = useMemo(
    () => ({ ...modalOptions, title: t("screens.pro"), headerRight: renderCloseButton }),
    [modalOptions, renderCloseButton, t]
  );

  const toastOptions = useMemo(
    () => ({
      style: { backgroundColor: colors.cardBackgroundElevated, borderColor: colors.border },
      titleStyle: { ...styles.toastText, color: colors.textDefault },
      descriptionStyle: { ...styles.toastText, color: colors.textSecondary },
      actionButtonStyle: { backgroundColor: colors.primary },
      actionButtonTextStyle: { color: colors.onPrimary },
    }),
    [colors]
  );

  // Android only. The toasts are drawn in the app's own window there (iOS puts
  // them in an overlay window), so they start under the 56dp toolbar instead
  // of covering its buttons for four seconds. sonner-native's positioner is a
  // zero-height box with the toasts overflowing it, which Android accessibility
  // reports as not visible, children included (TalkBack and Maestro could not
  // reach Undo): stretching it to the bottom gives it a size, and it passes
  // touches through.
  const { top: topInset } = useSafeAreaInsets();
  const toasterProps = useMemo(
    () =>
      Platform.OS === "android"
        ? { offset: topInset + ANDROID_TOOLBAR_HEIGHT + 8, positionerStyle: styles.androidToasts }
        : undefined,
    [topInset]
  );

  // Native chrome (tab bar, alerts, pickers) follows the OS-level scheme, so
  // mirror the in-app choice there.
  useEffect(() => {
    Appearance.setColorScheme(themeMode === "system" ? "unspecified" : themeMode);
  }, [themeMode]);

  return (
    <GestureHandlerRootView style={styles.root}>
      <KeyboardProvider>
      <ThemeProvider value={navigationTheme}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <Stack screenOptions={screenOptions}>
          <Stack.Screen name="(tabs)" options={TABS_OPTIONS} />
          <Stack.Screen name="income-form" options={incomeFormOptions} />
          <Stack.Screen name="expense-form" options={expenseFormOptions} />
          <Stack.Screen name="pay-date-detail" options={payDateDetailOptions} />
          <Stack.Screen name="history" options={historyOptions} />
          <Stack.Screen name="settings" options={settingsOptions} />
          <Stack.Screen name="paywall" options={paywallOptions} />
          <Stack.Screen name="language" options={languageOptions} />
          <Stack.Screen name="currency" options={currencyOptions} />
          <Stack.Screen name="expense-amount" options={sheetOptions} />
          <Stack.Screen name="paycheck-amount" options={sheetOptions} />
          <Stack.Screen name="move-bill" options={sheetOptions} />
          <Stack.Screen name="date-picker" options={sheetOptions} />
        </Stack>
        <Toaster theme={isDark ? "dark" : "light"} toastOptions={toastOptions} {...toasterProps} />
      </ThemeProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  androidToasts: {
    bottom: 0,
  },
  // sonner-native draws its own Text, so it needs AppText's alignment too
  toastText: {
    textAlign: "start",
  },
});
