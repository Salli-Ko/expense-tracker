const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

let config = getDefaultConfig(__dirname);

// Exclude expo-sqlite WASM files from web bundle
config.resolver.assetExts = config.resolver.assetExts.filter(ext => ext !== 'wasm');
config = withNativeWind(config, { input: './src/global.css' });

module.exports = config;