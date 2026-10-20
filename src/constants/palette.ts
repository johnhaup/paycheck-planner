const palette = {
  black: "#000000",
  softBlack: "#0F0F0F",
  charcoal: "#1A1A1A",
  gunmetal: "#252525",
  steel: "#333333",
  slate: "#666666",
  silver: "#999999",
  lightSilver: "#CCCCCC",
  offWhite: "#F2F2F7",
  lightGray: "#E5E5EA",
  midGray: "#C7C7CC",
  darkGray: "#8E8E93",
  white: "#FFFFFF",
  scrim: "rgba(0,0,0,0.4)",

  green: "#26de81",
  greenDark: "#1fba6c",
  red: "#FF3B30",
  amber: "#FF9500",
} as const;

export type ThemeColors = Record<
  | "screenBackground"
  | "cardBackground"
  | "cardBackgroundElevated"
  | "textDefault"
  | "textSecondary"
  | "textMuted"
  | "primary"
  | "primaryDark"
  | "onPrimary"
  | "destructive"
  | "warning"
  | "border"
  | "overlay"
  | "tabBarBackground"
  | "tabBarActive"
  | "tabBarInactive",
  string
>;

export const DarkPalette = {
  screenBackground: palette.softBlack,
  cardBackground: palette.charcoal,
  cardBackgroundElevated: palette.gunmetal,

  textDefault: palette.white,
  textSecondary: palette.silver,
  textMuted: palette.slate,

  primary: palette.green,
  primaryDark: palette.greenDark,
  onPrimary: palette.white,
  destructive: palette.red,
  warning: palette.amber,

  border: palette.steel,
  overlay: palette.scrim,

  tabBarBackground: palette.charcoal,
  tabBarActive: palette.green,
  tabBarInactive: palette.slate,
} as const;

export const LightPalette = {
  screenBackground: palette.offWhite,
  cardBackground: palette.white,
  cardBackgroundElevated: palette.lightGray,

  textDefault: palette.softBlack,
  textSecondary: palette.darkGray,
  textMuted: palette.midGray,

  primary: palette.green,
  primaryDark: palette.greenDark,
  onPrimary: palette.white,
  destructive: palette.red,
  warning: palette.amber,

  border: palette.lightGray,
  overlay: palette.scrim,

  tabBarBackground: palette.white,
  tabBarActive: palette.green,
  tabBarInactive: palette.darkGray,
} as const;

export type PaletteColor = keyof ThemeColors;
