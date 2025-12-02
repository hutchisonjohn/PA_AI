const { withAndroidManifest } = require('@expo/config-plugins');

/**
 * Expo config plugin to add network security configuration for Android
 * Note: This only applies when using prebuild. For Expo Go, use tunnel mode instead.
 */
const withNetworkSecurityConfig = (config) => {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;
    const { manifest } = androidManifest;

    if (!manifest.application) {
      manifest.application = [{}];
    }

    const application = manifest.application[0];
    
    // Add network security config (only applies with prebuild)
    application.$ = {
      ...application.$,
      'android:usesCleartextTraffic': 'false',
    };

    return config;
  });
};

module.exports = withNetworkSecurityConfig;
