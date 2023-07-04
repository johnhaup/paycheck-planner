import React from "react";
import { Switch } from "react-native";
import { useThemeColor } from "../styles";

export function Toggle({ isEnabled, onToggleTap }) {
  const thumbColor = useThemeColor("toggleThumb");
  const trackColorFalse = useThemeColor("toggleTrackFalse");
  const trackColorTrue = useThemeColor("toggleTrackTrue");

  return (
    <Switch
      trackColor={{ false: trackColorFalse, true: trackColorTrue }}
      thumbColor={thumbColor}
      onValueChange={onToggleTap}
      value={isEnabled}
    />
  );
}
