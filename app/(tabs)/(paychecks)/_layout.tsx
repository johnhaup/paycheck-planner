import { useCallback, useMemo } from "react";
import { Pressable, StyleSheet } from "react-native";
import { Stack, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useColors } from "@/hooks/useColors";
import { useColumns } from "@/hooks/useColumns";
import { useStackScreenOptions } from "@/hooks/useStackScreenOptions";
import { useT } from "@/hooks/useLocale";
import { MEASUREMENTS } from "@/constants/measurements";
import { DIM_ON_PRESS } from "@/constants/press";
import { AppText } from "@/components/AppText";

export default function PaychecksLayout() {
  const colors = useColors();
  const router = useRouter();
  // With no top inset (iPhone Duo folded, and unfolded on its side) iOS hides the whole bar as the
  // list scrolls and brings it back with the large title expanded after a fold, over the pinned
  // month pills. The standard bar there keeps the height the pills pin under (HAU-568).
  // On a regular width (Duo unfolded) the picked paycheck sits beside the list under the same bar,
  // and a title that collapses with one of the two would not belong to the other.
  // There the tabs sit in iOS's sidebar, and closing it drops the bar's plain title for good; a title
  // view stays (HAU-706).
  const { top } = useSafeAreaInsets();
  const wide = useColumns() !== undefined;
  const screenOptions = useStackScreenOptions(top > 0 && !wide);
  const t = useT();

  const handleOpenSettings = useCallback(() => {
    router.push("/settings");
  }, [router]);

  const renderSettingsButton = useCallback(
    () => (
      <Pressable
        style={DIM_ON_PRESS}
        onPress={handleOpenSettings}
        hitSlop={MEASUREMENTS.hitSlop}
        accessibilityRole="button"
        accessibilityLabel={t("screens.settings")}
      >
        <Ionicons name="settings-outline" size={22} color={colors.textDefault} />
      </Pressable>
    ),
    [handleOpenSettings, colors, t]
  );

  const renderTitle = useCallback(
    () => (
      <AppText variant="bodyStrong" style={styles.title} accessibilityRole="header" numberOfLines={1} maxFontSizeMultiplier={1}>
        {t("tabs.paychecks")}
      </AppText>
    ),
    [t]
  );

  const indexOptions = useMemo(
    () => ({
      title: t("tabs.paychecks"),
      headerRight: renderSettingsButton,
      ...(wide ? { headerTitle: renderTitle } : {}),
    }),
    [renderSettingsButton, renderTitle, wide, t]
  );

  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen name="index" options={indexOptions} />
    </Stack>
  );
}

// The size of iOS's own navigation bar title
const styles = StyleSheet.create({
  title: { fontSize: MEASUREMENTS.font.lg },
});
