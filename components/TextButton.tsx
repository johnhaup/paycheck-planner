import React, { createElement } from "react";
import { Pressable, StyleSheet } from "react-native";
import { ThemeColor, useThemeColor } from "styles";
import { NextArrow } from "../assets/svgs/NextArrow";
import { PreviousArrow } from "../assets/svgs/PreviousArrow";
import { BBText } from "./BBText";

type VariantKey = "primary" | "secondary";

const colorMap: {
  [key in VariantKey | "disabled"]: {
    backgroundColorKey: ThemeColor;
    textColorKey: ThemeColor;
  };
} = {
  primary: {
    backgroundColorKey: "buttonPrimary",
    textColorKey: "buttonPrimaryText",
  },
  secondary: {
    backgroundColorKey: "buttonSecondary",
    textColorKey: "buttonSecondaryText",
  },
  disabled: {
    backgroundColorKey: "buttonDisabled",
    textColorKey: "buttonDisabledText",
  },
};

const icons = {
  prevArrow: PreviousArrow,
  nextArrow: NextArrow,
};

interface Props {
  variant?: VariantKey;
  text: string;
  onPress: () => void;
  iconLeft?: keyof typeof icons;
  iconRight?: keyof typeof icons;
  disabled?: boolean;
}

export function TextButton({
  variant = "primary",
  text,
  disabled,
  iconLeft,
  iconRight,
  onPress,
}: Props) {
  const variantKey = disabled ? "disabled" : variant;
  const { backgroundColorKey, textColorKey } = colorMap[variantKey];
  const backgroundColor = useThemeColor(backgroundColorKey);
  const color = useThemeColor(textColorKey);

  const leftIcon = iconLeft ? icons[iconLeft] : null;
  const rightIcon = iconRight ? icons[iconRight] : null;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => {
        return [
          styles.base,
          {
            backgroundColor,
            opacity: pressed ? 0.8 : 1,
            transform: [{ scale: pressed ? 0.998 : 1 }],
          },
        ];
      }}
    >
      {leftIcon &&
        createElement(leftIcon, { color, size: 20, style: { marginRight: 8 } })}
      <BBText style={{ color }} variant="bodyLGBold">
        {text}
      </BBText>
      {rightIcon &&
        createElement(rightIcon, { color, size: 20, style: { marginLeft: 8 } })}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    paddingVertical: 18,
    paddingHorizontal: 16,
  },
});
