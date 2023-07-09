import { Entypo } from "@expo/vector-icons";
import React from "react";
import { LayoutChangeEvent, StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { VariantText } from "./VariantText";

export function Accordion({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const isOpen = useSharedValue(false);
  const animation = useSharedValue(0);
  const contentHeight = useSharedValue(0);
  const animatedContentStyle = useAnimatedStyle(() => ({
    height: interpolate(animation.value, [0, 1], [1, contentHeight.value]),
    opacity: interpolate(animation.value, [0, 0.8], [0, 1]),
  }));
  const animatedChevronStyle = useAnimatedStyle(() => {
    const rotate = interpolate(animation.value, [0, 1], [0, 180]);
    return {
      transform: [{ rotate: `${rotate}deg` }],
    };
  });
  const onLayout = ({ nativeEvent }: LayoutChangeEvent) => {
    contentHeight.value = nativeEvent.layout.height;
  };
  const tapGesture = Gesture.Tap()
    .maxDuration(250)
    .onStart(() => {
      if (isOpen.value) {
        animation.value = withTiming(0);
      } else {
        animation.value = withTiming(1);
      }
      isOpen.value = !isOpen.value;
    });
  return (
    <View>
      <GestureDetector gesture={tapGesture}>
        <Animated.View style={styles.header}>
          <VariantText variant="bodyLGSemiBold">{label}</VariantText>
          <Animated.View style={animatedChevronStyle}>
            <Entypo name="chevron-up" size={16} color="black" />
          </Animated.View>
        </Animated.View>
      </GestureDetector>
      <Animated.View style={[styles.animatedContainer, animatedContentStyle]}>
        <View onLayout={onLayout} style={styles.contentContainer}>
          {children}
        </View>
      </Animated.View>
    </View>
  );
}
const styles = StyleSheet.create({
  header: {
    paddingRight: 8,
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  animatedContainer: {
    overflow: "hidden",
  },
  contentContainer: {
    position: "absolute",
  },
});
