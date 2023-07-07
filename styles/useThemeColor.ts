import { useColorScheme } from "react-native";

import { darkThemeColors, lightThemeColors, ThemeColor } from "./colors";

export function useThemeColor(key: ThemeColor) {
  const colorScheme = useColorScheme();

  const themeColors =
    colorScheme === "dark" ? darkThemeColors : lightThemeColors;

  return themeColors[key];
}
