import { useCallback, useEffect, useMemo } from "react";
import { Appearance, LogBox, Pressable, StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, useRouter } from "expo-router";
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

const TABS_OPTIONS = { headerShown: false };

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
      titleStyle: { color: colors.textDefault },
      descriptionStyle: { color: colors.textSecondary },
      actionButtonStyle: { backgroundColor: colors.primary },
      actionButtonTextStyle: { color: colors.onPrimary },
    }),
    [colors]
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
        <Toaster theme={isDark ? "dark" : "light"} toastOptions={toastOptions} />
      </ThemeProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
