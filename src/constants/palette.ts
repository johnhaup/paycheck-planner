const palette = {
  black: "#000000",
  ink: "#111418",
  slate950: "#14171C",
  slate900: "#1A1E24",
  slate850: "#1F232A",
  slate800: "#262B33",
  slate750: "#2B3038",
  slate700: "#383E48",
  slate500: "#6E7682",
  slate300: "#A3ABB7",
  offWhite: "#F2F2F7",
  lightGray: "#E5E5EA",
  gray: "#9A9AA0",
  darkGray: "#6E6E73",
  white: "#FFFFFF",
  scrim: "rgba(0,0,0,0.5)",

  green: "#26de81",
  greenDark: "#1fba6c",
  red: "#FF3B30",
  amber: "#FF9500",
} as const;

export type ThemeColors = Record<
  | "screenBackground"
  | "modalBackground"
  | "cardBackground"
  | "cardBackgroundElevated"
  | "inputBackground"
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
  | "shadow"
  | "tabBarBackground"
  | "tabBarActive"
  | "tabBarInactive",
  string
>;

export const DarkPalette = {
  screenBackground: palette.slate950,
  // Modals sit a step above the screen so the sheet edge is visible
  modalBackground: palette.slate900,
  cardBackground: palette.slate850,
  cardBackgroundElevated: palette.slate800,
  inputBackground: palette.slate750,

  textDefault: palette.white,
  textSecondary: palette.slate300,
  textMuted: palette.slate500,

  primary: palette.green,
  primaryDark: palette.greenDark,
  onPrimary: palette.white,
  destructive: palette.red,
  warning: palette.amber,

  border: palette.slate700,
  overlay: palette.scrim,
  shadow: palette.black,

  tabBarBackground: palette.slate900,
  tabBarActive: palette.green,
  tabBarInactive: palette.slate500,
} as const;

export const LightPalette = {
  screenBackground: palette.offWhite,
  modalBackground: palette.white,
  cardBackground: palette.white,
  cardBackgroundElevated: palette.lightGray,
  inputBackground: palette.offWhite,

  textDefault: palette.ink,
  textSecondary: palette.darkGray,
  textMuted: palette.gray,

  primary: palette.green,
  primaryDark: palette.greenDark,
  onPrimary: palette.white,
  destructive: palette.red,
  warning: palette.amber,

  border: palette.lightGray,
  overlay: palette.scrim,
  shadow: palette.black,

  tabBarBackground: palette.white,
  tabBarActive: palette.green,
  tabBarInactive: palette.darkGray,
} as const;

export type PaletteColor = keyof ThemeColors;
