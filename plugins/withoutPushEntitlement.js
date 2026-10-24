const { withEntitlementsPlist } = require("expo/config-plugins");

/**
 * expo-notifications adds the aps-environment (push) entitlement, but this app
 * only schedules local notifications. Dropping it keeps the App Store profile,
 * which has no Push Notifications capability, valid. Listed before
 * expo-notifications in app.json so it runs after that plugin's mod.
 */
module.exports = function withoutPushEntitlement(config) {
  return withEntitlementsPlist(config, (entitlementsConfig) => {
    delete entitlementsConfig.modResults["aps-environment"];
    return entitlementsConfig;
  });
};
