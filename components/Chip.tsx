import { CloseSquare, Star } from "@assets";
import { useThemeColor } from "@styles";
import React, { ComponentProps, createElement } from "react";
import { StyleSheet, View } from "react-native";

import { VariantText } from "./VariantText";

type VariantKey = keyof typeof variantStyles;

const icons = {
  closeSquare: CloseSquare,
  star: Star,
};

const iconSizeMap: {
  [key in VariantKey]: number;
} = {
  lg: 20,
  md: 16,
  sm: 12,
};

const textVariantMap: {
  [key in VariantKey]: ComponentProps<typeof VariantText>["variant"];
} = {
  lg: "bodyXLBold",
  md: "bodyLGSemiBold",
  sm: "bodyMDSemiBold",
};

interface Props {
  variant: VariantKey;
  text: string;
  iconLeft?: keyof typeof icons;
  iconRight?: keyof typeof icons;
  invert?: boolean;
}

export function Chip({ variant, text, invert, iconLeft, iconRight }: Props) {
  const variantStyle = variantStyles[variant];
  const highlight = useThemeColor("chipHighlight");
  const textColor = useThemeColor("chipText");

  const backgroundColor = invert ? "transparent" : highlight;
  const borderProps = invert ? { borderWidth: 1, borderColor: highlight } : {};

  const color = invert ? highlight : textColor;
  const variantText = textVariantMap[variant];

  const leftIcon = iconLeft ? icons[iconLeft] : null;
  const rightIcon = iconRight ? icons[iconRight] : null;
  const size = iconSizeMap[variant];

  return (
    <View
      style={[styles.base, variantStyle, { backgroundColor, ...borderProps }]}
    >
      {leftIcon &&
        createElement(leftIcon, { color, size, style: { marginRight: 8 } })}
      <VariantText style={{ color }} variant={variantText}>
        {text}
      </VariantText>
      {rightIcon &&
        createElement(rightIcon, { color, size, style: { marginLeft: 8 } })}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
    flexDirection: "row",
  },
});

const variantStyles = StyleSheet.create({
  lg: {
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  md: {
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  sm: {
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
});
