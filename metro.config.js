const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Exclude expo-sqlite WASM files from web bundle
config.resolver.assetExts = config.resolver.assetExts.filter(ext => ext !== 'wasm');

module.exports = withNativeWind(config, { input: "./global.css" });