import "react-native-gesture-handler";

import { VariantText, CheckBox, Chip, Toggle } from "components";
import { useFonts } from "expo-font";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import { ScrollView } from "react-native";
import { Spacer } from "react-native-spacer-view";
import { Input } from "../../components/Input";
import { TextButton } from "../../components/TextButton";

export default function App() {
  const [fontsLoaded] = useFonts({
    "Urbanist-Bold": require("../assets/fonts/Urbanist-Bold.ttf"),
    "Urbanist-Medium": require("../assets/fonts/Urbanist-Medium.ttf"),
    "Urbanist-Regular": require("../assets/fonts/Urbanist-Regular.ttf"),
    "Urbanist-SemiBold": require("../assets/fonts/Urbanist-SemiBold.ttf"),
  });

  const [checked, setChecked] = useState(false);
  const [toggled, setToggled] = useState(false);

  const onCheckBoxTap = () => {
    setChecked((prev) => !prev);
  };

  const onToggleTap = () => {
    setToggled((prev) => !prev);
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ScrollView>
      <StatusBar style="auto" />
      <Spacer safeTop height={16} />
      <Input />
      <Spacer height={8} />
      <TextButton text="Text Button" onPress={() => {}} />
      <Spacer height={8} />
      <TextButton text="Text Button" onPress={() => {}} disabled />
      <Spacer height={8} />
      <TextButton
        text="Text Button"
        onPress={() => {}}
        iconLeft="prevArrow"
        iconRight="nextArrow"
        variant="secondary"
      />
      <Spacer height={8} />
      <Toggle onToggleTap={onToggleTap} isEnabled={toggled} />
      <Spacer height={8} />
      <VariantText variant="heading1">Heading1</VariantText>
      <VariantText variant="heading2">Heading2</VariantText>
      <VariantText variant="heading3">Heading3</VariantText>
      <VariantText variant="heading4">Heading4</VariantText>
      <VariantText variant="heading5">Heading5</VariantText>
      <VariantText variant="heading6">Heading6</VariantText>
      <VariantText variant="bodyXLRegular">BodyXLRegular</VariantText>
      <VariantText variant="bodyXLBold">BodyXLBold</VariantText>
      <VariantText variant="bodyXLSemiBold">BodyXLSemiBold</VariantText>
      <VariantText variant="bodyXLMedium">BodyXLMedium</VariantText>
      <VariantText variant="bodyLGRegular">BodyLGRegular</VariantText>
      <VariantText variant="bodyLGBold">BodyLGBold</VariantText>
      <VariantText variant="bodyLGSemiBold">BodyLGSemiBold</VariantText>
      <VariantText variant="bodyLGMedium">bodyLGMedium</VariantText>
      <VariantText variant="bodyMDRegular">BodyMDRegular</VariantText>
      <VariantText variant="bodyMDBold">BodyMDBold</VariantText>
      <VariantText variant="bodyMDSemiBold">BodyMDSemiBold</VariantText>
      <VariantText variant="bodyMDMedium">BodyMDMedium</VariantText>
      <VariantText variant="bodySMRegular">BodySMRegular</VariantText>
      <VariantText variant="bodySMBold">BodySMBold</VariantText>
      <VariantText variant="bodySMSemiBold">BodySMSemiBold</VariantText>
      <VariantText variant="bodySMMedium">bodySMMedium</VariantText>
      <VariantText variant="bodyXSRegular">BodyXSRegular</VariantText>
      <VariantText variant="bodyXSBold">BodyXSBold</VariantText>
      <VariantText variant="bodyXSSemiBold">BodyXSSemiBold</VariantText>
      <VariantText variant="bodyXSMedium">BodyXSMedium</VariantText>
      <Spacer height={8} />
      <Chip variant="lg" text="Large" />
      <Spacer height={8} />
      <Chip variant="md" text="Medium" />
      <Spacer height={8} />
      <Chip variant="sm" text="Small" iconRight="closeSquare" />
      <Spacer height={8} />
      <Chip variant="lg" text="Large" invert iconLeft="star" />
      <Spacer height={8} />
      <Chip variant="md" text="Medium" invert />
      <Spacer height={8} />
      <Chip variant="sm" text="Small" invert />
      <Spacer height={8} />
      <CheckBox onTap={onCheckBoxTap} checked={checked} />
      <Spacer height={16} safeBottom />
    </ScrollView>
  );
}
