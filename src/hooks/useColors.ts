import { useColorScheme } from "react-native";
import { useThemeStore } from "@/stores/themeStore";
import { DarkPalette, LightPalette, ThemeColors } from "@/constants/palette";

export function useColors(): ThemeColors {
  const themeMode = useThemeStore((s) => s.themeMode);
  const systemScheme = useColorScheme();

  if (themeMode === "system") {
    return systemScheme === "light" ? LightPalette : DarkPalette;
  }

  return themeMode === "light" ? LightPalette : DarkPalette;
}

export function useIsDark(): boolean {
  const themeMode = useThemeStore((s) => s.themeMode);
  const systemScheme = useColorScheme();

  if (themeMode === "system") {
    return systemScheme !== "light";
  }

  return themeMode === "dark";
}
