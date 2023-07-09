import "react-native-gesture-handler";

import { useThemeColor } from "@styles";
import { useSearchParams } from "expo-router";
import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import WebView from "react-native-webview";

export default function Webview() {
  const params = useSearchParams();
  const primary = useThemeColor("primary");

  const renderLoading = () => {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={primary} />
      </View>
    );
  };
  return (
    <WebView
      style={{ flex: 1 }}
      source={{ uri: params.uri }}
      startInLoadingState={true}
      renderLoading={renderLoading}
    />
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
});
