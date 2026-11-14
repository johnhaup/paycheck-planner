import { I18nManager } from "react-native";
import { requireOptionalNativeModule } from "expo";

/**
 * Stack options for the back button's icon. With an RTL device language and an
 * LTR in-app one, iOS still mirrors the back chevron for the device language:
 * "› Back" at the left edge (HAU-325). It mirrors a custom icon the same way,
 * so only in that case the icon is our own chevron drawn pointing right, which
 * iOS turns into "‹". Every other case keeps the system chevron (the opposite
 * mismatch mirrors correctly on its own).
 */
export const BACK_ICON_OPTIONS =
  !I18nManager.isRTL && requireOptionalNativeModule<{ nativeRTL: boolean }>("LayoutDirection")?.nativeRTL
    ? { headerBackIcon: { type: "image" as const, source: require("../../assets/images/back-chevron-mirrored.png") } }
    : undefined;
