const { withDangerousMod } = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

const STOREKIT_FILE = "PaycheckPlanner.storekit";

/**
 * Copies the StoreKit configuration file (the Pro product, for simulator
 * testing) into the generated ios/ folder and points the Xcode scheme's run
 * action at it, so a build launched from Xcode talks to the local StoreKit
 * test environment instead of the App Store. Release builds and devices are
 * unaffected: the file is only read when Xcode launches the app.
 */
module.exports = function withStoreKitConfiguration(config) {
  return withDangerousMod(config, [
    "ios",
    (config) => {
      const iosRoot = config.modRequest.platformProjectRoot;
      const projectName = config.modRequest.projectName;
      fs.copyFileSync(
        path.join(config.modRequest.projectRoot, STOREKIT_FILE),
        path.join(iosRoot, STOREKIT_FILE)
      );
      const schemePath = path.join(
        iosRoot,
        `${projectName}.xcodeproj`,
        "xcshareddata",
        "xcschemes",
        `${projectName}.xcscheme`
      );
      if (fs.existsSync(schemePath)) {
        const scheme = fs.readFileSync(schemePath, "utf8");
        if (!scheme.includes("StoreKitConfigurationFileReference")) {
          const reference = `      <StoreKitConfigurationFileReference\n         identifier = "../../${STOREKIT_FILE}">\n      </StoreKitConfigurationFileReference>\n`;
          fs.writeFileSync(
            schemePath,
            scheme.replace(/(<LaunchAction[^>]*>\n)/, `$1${reference}`)
          );
        }
      }
      return config;
    },
  ]);
};
