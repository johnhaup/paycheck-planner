import { palette } from "./palette";

export type ThemeColor =
  | keyof typeof lightThemeColors
  | keyof typeof darkThemeColors;

export const lightThemeColors = {
  buttonDisabled: palette.disabledButton,
  buttonDisabledText: palette.white,
  buttonPrimary: palette.primary500,
  buttonPrimaryText: palette.white,
  buttonSecondary: palette.primary100,
  buttonSecondaryText: palette.primary500,
  checkboxCheck: palette.white,
  checkboxHightLight: palette.primary500,
  chipHighlight: palette.primary500,
  chipText: palette.white,
  inputBlurredBackground: palette.greyscale50,
  inputFocusedBackground: palette.primary500_08,
  inputFocusedBorder: palette.primary500,
  inputPlaceholderText: palette.greyscale500,
  inputTextColor: palette.greyscale900,
  primary: palette.primary500,
  textDefault: palette.greyscale900,
  textInverse: palette.white,
  toggleThumb: palette.white,
  toggleTrackFalse: palette.greyscale200,
  toggleTrackTrue: palette.primary500,
};

export const darkThemeColors = {
  buttonDisabled: palette.disabledButton,
  buttonDisabledText: palette.white,
  buttonPrimary: palette.primary500,
  buttonPrimaryText: palette.white,
  buttonSecondary: palette.dark3,
  buttonSecondaryText: palette.white,
  checkboxCheck: palette.white,
  checkboxHightLight: palette.primary500,
  chipHighlight: palette.primary500,
  chipText: palette.white,
  inputBlurredBackground: palette.dark2,
  inputFocusedBackground: palette.primary500_08,
  inputFocusedBorder: palette.primary500,
  inputPlaceholderText: palette.greyscale500,
  inputTextColor: palette.white,
  primary: palette.primary500,
  textDefault: palette.white,
  textInverse: palette.greyscale900,
  toggleThumb: palette.white,
  toggleTrackFalse: palette.dark2,
  toggleTrackTrue: palette.primary500,
};
