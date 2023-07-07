import { Check } from "@assets";
import { useThemeColor } from "@styles";
import React from "react";
import { Pressable, StyleSheet } from "react-native";

interface Props {
  onTap: () => void;
  checked: boolean;
}

export function CheckBox({ onTap, checked }: Props) {
  const hightlight = useThemeColor("checkboxHightLight");
  const checkColor = useThemeColor("checkboxCheck");
  const backgroundColor = checked ? hightlight : "transparent";

  return (
    <Pressable
      onPress={onTap}
      style={({ pressed }) => {
        return [
          styles.container,
          {
            borderColor: hightlight,
            backgroundColor,
            opacity: pressed ? 0.8 : 1,
            transform: [{ scale: pressed ? 0.998 : 1 }],
          },
        ];
      }}
    >
      {checked && <Check color={checkColor} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    height: 24,
    width: 24,
    borderRadius: 8,
  },
});
