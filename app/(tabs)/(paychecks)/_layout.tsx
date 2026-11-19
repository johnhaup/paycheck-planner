import { useCallback, useMemo } from "react";
import { Pressable } from "react-native";
import { Stack, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useColors } from "@/hooks/useColors";
import { useStackScreenOptions } from "@/hooks/useStackScreenOptions";
import { useT } from "@/hooks/useLocale";
import { MEASUREMENTS } from "@/constants/measurements";
import { DIM_ON_PRESS } from "@/constants/press";

export default function PaychecksLayout() {
  const colors = useColors();
  const router = useRouter();
  // With no top inset (iPhone Duo folded, and unfolded on its side) iOS hides the whole bar as the
  // list scrolls and brings it back with the large title expanded after a fold, over the pinned
  // month pills. The standard bar there keeps the height the pills pin under (HAU-568).
  const { top } = useSafeAreaInsets();
  const screenOptions = useStackScreenOptions(top > 0);
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

  const indexOptions = useMemo(
    () => ({ title: t("tabs.paychecks"), headerRight: renderSettingsButton }),
    [renderSettingsButton, t]
  );

  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen name="index" options={indexOptions} />
    </Stack>
  );
}
