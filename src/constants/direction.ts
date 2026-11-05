import { I18nManager } from "react-native";

/** Icons do not mirror on their own: this chevron points the way the screen moves forward. */
export const FORWARD_CHEVRON = I18nManager.isRTL ? "chevron-back" : "chevron-forward";
