const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add .wasm files to asset extensions
config.resolver.assetExts.push('wasm');

module.exports = config;