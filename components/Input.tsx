import { useThemeColor } from "@styles";
import React, { useCallback, useState } from "react";
import { StyleSheet, TextInput, TextInputProps } from "react-native";
import { Spacer } from "react-native-spacer-view";

import { VariantText } from "./VariantText";

interface Props extends TextInputProps {
  label: string;
}

export function Input({ label, ...rest }: Props) {
  const [isFocused, setIsFocused] = useState(false);

  const blurredBackground = useThemeColor("inputBlurredBackground");
  const focusedBackground = useThemeColor("inputFocusedBackground");
  const focusedBorder = useThemeColor("inputFocusedBorder");
  const placeHolderColor = useThemeColor("inputPlaceholderText");
  const color = useThemeColor("inputTextColor");

  const backgroundColor = isFocused ? focusedBackground : blurredBackground;
  const borderColor = isFocused ? focusedBorder : backgroundColor;

  const onBlur = useCallback(() => {
    setIsFocused(false);
  }, []);

  const onFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  return (
    <>
      <VariantText variant="bodyMDSemiBold">{label}</VariantText>
      <Spacer height={4} />
      <TextInput
        style={[styles.base, { color, backgroundColor, borderColor }]}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholderTextColor={placeHolderColor}
        autoCapitalize="none"
        autoCorrect={false}
        {...rest}
      />
    </>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    fontFamily: "Urbanist-Regular",
    fontSize: 14,
    letterSpacing: 0.002,
    borderWidth: 1,
  },
});
