const palette = {
  black: "#000000",
  ink: "#111418",
  slate950: "#14171C",
  slate900: "#1A1E24",
  // The paywall footer's fade starts from the modal background at zero alpha
  slate900Clear: "#1A1E2400",
  slate850: "#1F232A",
  slate800: "#262B33",
  slate750: "#2B3038",
  slate700: "#333A44",
  slate650: "#2E343D",
  slate600: "#434A55",
  slate550: "#6B7380",
  slate500: "#8A929E",
  slate300: "#A3ABB7",
  offWhite: "#F2F2F7",
  lightGray: "#E5E5EA",
  paleGray: "#EFEFF4",
  trackGray: "#E3E3E8",
  barGray: "#D6D6DC",
  switchGray: "#C7C7CC",
  systemGray: "#8E8E93",
  darkGray: "#6E6E73",
  mutedGray: "#636366",
  white: "#FFFFFF",
  whiteClear: "#FFFFFF00",
  scrim: "rgba(0,0,0,0.5)",

  green: "#26de81",
  greenDark: "#1fba6c",
  greenInk: "#12804A",
  red: "#FF3B30",
  amber: "#FF9500",
  // Pro badge: a gold gradient that no other control uses, so "PRO" never reads as an app action
  proGold: "#FFD66B",
  proAmber: "#F59E0B",
  proInk: "#3A2400",
} as const;

export type ThemeColors = Record<
  | "screenBackground"
  | "modalBackground"
  | "modalBackgroundClear"
  | "cardBackground"
  | "cardBackgroundElevated"
  | "rowPressed"
  | "inputBackground"
  | "segmentTrack"
  | "segmentSelected"
  | "divider"
  | "chartBar"
  | "textDefault"
  | "textSecondary"
  | "textMuted"
  | "primary"
  | "primaryDark"
  | "primaryText"
  | "onPrimary"
  | "destructive"
  | "warning"
  | "proGradientStart"
  | "proGradientEnd"
  | "onPro"
  | "border"
  | "buttonOutline"
  | "toggleTrackOff"
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
  modalBackgroundClear: palette.slate900Clear,
  cardBackground: palette.slate850,
  cardBackgroundElevated: palette.slate800,
  // A held row or card, a step above elevated rows like a UIKit cell highlight
  rowPressed: palette.slate700,
  inputBackground: palette.slate750,
  segmentTrack: palette.slate850,
  segmentSelected: palette.slate700,
  divider: palette.slate800,
  chartBar: palette.slate750,

  textDefault: palette.white,
  textSecondary: palette.slate300,
  textMuted: palette.slate500,

  primary: palette.green,
  primaryDark: palette.greenDark,
  // Green used as text; the bright fill green is too light to read on white
  primaryText: palette.green,
  onPrimary: palette.white,
  destructive: palette.red,
  warning: palette.amber,
  proGradientStart: palette.proGold,
  proGradientEnd: palette.proAmber,
  onPro: palette.proInk,

  border: palette.slate650,
  // An outline button's border: at least 3:1 against the screen and the modal, unlike `border`
  buttonOutline: palette.slate550,
  // An off switch's track: a step darker or lighter than both the elevated row and the modal
  toggleTrackOff: palette.slate600,
  overlay: palette.scrim,
  shadow: palette.black,

  tabBarBackground: palette.slate900,
  tabBarActive: palette.green,
  tabBarInactive: palette.slate500,
} as const;

export const LightPalette = {
  screenBackground: palette.offWhite,
  modalBackground: palette.white,
  modalBackgroundClear: palette.whiteClear,
  cardBackground: palette.white,
  cardBackgroundElevated: palette.lightGray,
  rowPressed: palette.barGray,
  inputBackground: palette.offWhite,
  segmentTrack: palette.trackGray,
  segmentSelected: palette.white,
  divider: palette.paleGray,
  chartBar: palette.barGray,

  textDefault: palette.ink,
  textSecondary: palette.darkGray,
  // At least 4.5:1 on the screen, the cards and the elevated month pill; #6E6E73 is only 4:1 on the pill (HAU-640)
  textMuted: palette.mutedGray,

  primary: palette.green,
  primaryDark: palette.greenDark,
  primaryText: palette.greenInk,
  onPrimary: palette.white,
  destructive: palette.red,
  warning: palette.amber,
  proGradientStart: palette.proGold,
  proGradientEnd: palette.proAmber,
  onPro: palette.proInk,

  border: palette.lightGray,
  // An outline button's border: about 3:1 against the screen and the modal, unlike `border`
  buttonOutline: palette.systemGray,
  // iOS's own off-track grey is too pale on the elevated row, so a step darker
  toggleTrackOff: palette.switchGray,
  overlay: palette.scrim,
  shadow: palette.black,

  tabBarBackground: palette.white,
  tabBarActive: palette.green,
  tabBarInactive: palette.darkGray,
} as const;

export type PaletteColor = keyof ThemeColors;

/** Background/foreground pairs for letter tiles, picked per income source. */
export const TILE_TINTS = {
  dark: [
    { background: "#1E3A2C", foreground: "#26de81" },
    { background: "#1E2E45", foreground: "#6FA8FF" },
    { background: "#3D2C1A", foreground: "#F5A524" },
    { background: "#352040", foreground: "#C38BFF" },
    { background: "#40202A", foreground: "#FF7A93" },
  ],
  light: [
    { background: "#DDF7E9", foreground: "#14804A" },
    { background: "#DFEBFF", foreground: "#1F5FCC" },
    { background: "#FDEFD9", foreground: "#A15C00" },
    { background: "#F0E3FC", foreground: "#7A3FC0" },
    { background: "#FCE1E7", foreground: "#B3264A" },
  ],
  neutral: {
    dark: { background: "#2B3038", foreground: "#C3CAD4" },
    light: { background: "#ECECF1", foreground: "#5A5A60" },
  },
} as const;
