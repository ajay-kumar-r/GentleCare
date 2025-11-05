const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);

// Ensure Metro resolves 'use-latest-callback' to our local shim so
// the bundler always gets a single, consistent implementation.
config.resolver = config.resolver || {};
config.resolver.extraNodeModules = Object.assign({}, config.resolver.extraNodeModules, {
  'use-latest-callback': path.resolve(projectRoot, 'shims', 'use-latest-callback'),
});

// Make sure the watch folders include the shims folder (helps in monorepos)
config.watchFolders = config.watchFolders || [];
config.watchFolders.push(path.resolve(projectRoot, 'shims'));

module.exports = config;
