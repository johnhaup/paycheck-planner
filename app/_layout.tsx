import { useCallback, useEffect, useMemo } from "react";
import { Appearance, Pressable, StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useColors, useIsDark } from "@/hooks/useColors";
import { useStackScreenOptions } from "@/hooks/useStackScreenOptions";
import { useT } from "@/hooks/useLocale";
import { usePaydayReminders } from "@/hooks/usePaydayReminders";
import { useThemeStore } from "@/stores/themeStore";
import { MEASUREMENTS } from "@/constants/measurements";

const TABS_OPTIONS = { headerShown: false };

export default function RootLayout() {
  const colors = useColors();
  const isDark = useIsDark();
  const router = useRouter();
  const screenOptions = useStackScreenOptions();
  const t = useT();
  const themeMode = useThemeStore((s) => s.themeMode);
  usePaydayReminders();

  const handleCloseSettings = useCallback(() => {
    router.back();
  }, [router]);

  const renderSettingsCloseButton = useCallback(
    () => (
      <Pressable onPress={handleCloseSettings} hitSlop={MEASUREMENTS.hitSlop}>
        <Ionicons name="close" size={24} color={colors.textDefault} />
      </Pressable>
    ),
    [handleCloseSettings, colors]
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
    () => ({ ...modalOptions, title: t("screens.settings"), headerRight: renderSettingsCloseButton }),
    [modalOptions, renderSettingsCloseButton, t]
  );

  // Native chrome (tab bar, alerts, pickers) follows the OS-level scheme, so
  // mirror the in-app choice there.
  useEffect(() => {
    Appearance.setColorScheme(themeMode === "system" ? "unspecified" : themeMode);
  }, [themeMode]);

  return (
    <GestureHandlerRootView style={styles.root}>
      <ThemeProvider value={navigationTheme}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <Stack screenOptions={screenOptions}>
          <Stack.Screen name="(tabs)" options={TABS_OPTIONS} />
          <Stack.Screen name="income-form" options={incomeFormOptions} />
          <Stack.Screen name="expense-form" options={expenseFormOptions} />
          <Stack.Screen name="pay-date-detail" options={payDateDetailOptions} />
          <Stack.Screen name="settings" options={settingsOptions} />
          <Stack.Screen name="language" options={languageOptions} />
          <Stack.Screen name="currency" options={currencyOptions} />
          <Stack.Screen name="expense-amount" options={sheetOptions} />
          <Stack.Screen name="paycheck-amount" options={sheetOptions} />
          <Stack.Screen name="move-bill" options={sheetOptions} />
          <Stack.Screen name="date-picker" options={sheetOptions} />
        </Stack>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
