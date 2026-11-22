const { withAndroidManifest } = require("expo/config-plugins");

const FEATURE = "android.hardware.screen.portrait";

/**
 * The app is locked to portrait (`orientation` in app.json), which makes Google
 * Play infer a required `android.hardware.screen.portrait` feature and hide the
 * app from devices without one (tablets, Chromebooks, Android XR). Declaring the
 * feature optional keeps the lock and the reach.
 */
module.exports = function withOptionalPortrait(config) {
  return withAndroidManifest(config, (manifestConfig) => {
    const manifest = manifestConfig.modResults.manifest;
    const features = (manifest["uses-feature"] ??= []);
    const existing = features.find((f) => f.$["android:name"] === FEATURE);
    if (existing) existing.$["android:required"] = "false";
    else features.push({ $: { "android:name": FEATURE, "android:required": "false" } });
    return manifestConfig;
  });
};
