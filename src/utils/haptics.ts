import * as Haptics from "expo-haptics";

function ignore() {}

/** Light tick for picking among options: chart bars, chips, segments. */
export function hapticSelection() {
  Haptics.selectionAsync().catch(ignore);
}

/** Soft thud for a tap that does something: FAB, check circles, toggles. */
export function hapticTap() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(ignore);
}

export function hapticSuccess() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(ignore);
}
