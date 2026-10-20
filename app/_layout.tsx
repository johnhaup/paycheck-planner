import { useCallback, useEffect, useMemo } from "react";
import { Appearance, Pressable } from "react-native";
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useColors, useIsDark } from "@/hooks/useColors";
import { useStackScreenOptions } from "@/hooks/useStackScreenOptions";
import { useThemeStore } from "@/stores/themeStore";
import { MEASUREMENTS } from "@/constants/measurements";

const TABS_OPTIONS = { headerShown: false };
const INCOME_FORM_OPTIONS = { title: "Income Source", presentation: "modal" as const };
const EXPENSE_FORM_OPTIONS = { title: "Expense", presentation: "modal" as const };
const PAY_DATE_DETAIL_OPTIONS = { title: "Pay Date", presentation: "card" as const };

export default function RootLayout() {
  const colors = useColors();
  const isDark = useIsDark();
  const router = useRouter();
  const screenOptions = useStackScreenOptions();
  const themeMode = useThemeStore((s) => s.themeMode);

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

  const settingsOptions = useMemo(
    () => ({
      title: "Settings",
      presentation: "modal" as const,
      headerRight: renderSettingsCloseButton,
    }),
    [renderSettingsCloseButton]
  );

  // Native chrome (tab bar, alerts, pickers) follows the OS-level scheme, so
  // mirror the in-app choice there.
  useEffect(() => {
    Appearance.setColorScheme(themeMode === "system" ? "unspecified" : themeMode);
  }, [themeMode]);

  return (
    <ThemeProvider value={navigationTheme}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack screenOptions={screenOptions}>
        <Stack.Screen name="(tabs)" options={TABS_OPTIONS} />
        <Stack.Screen name="income-form" options={INCOME_FORM_OPTIONS} />
        <Stack.Screen name="expense-form" options={EXPENSE_FORM_OPTIONS} />
        <Stack.Screen name="pay-date-detail" options={PAY_DATE_DETAIL_OPTIONS} />
        <Stack.Screen name="settings" options={settingsOptions} />
      </Stack>
    </ThemeProvider>
  );
}
