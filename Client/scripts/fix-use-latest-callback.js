const fs = require('fs');
const path = require('path');

const pkgDir = path.resolve(__dirname, '..');
const moduleDir = path.join(pkgDir, 'node_modules', 'use-latest-callback');
const indexPath = path.join(moduleDir, 'index.js');

// If module doesn't exist, nothing to do
if (!fs.existsSync(moduleDir)) {
  console.log('use-latest-callback not installed; skipping fix');
  process.exit(0);
}

// Create shim index.js that normalizes both CommonJS and ESM consumers
const content = `// Auto-generated shim to normalize exports for use-latest-callback
// Ensures both default and module.exports are available for different consumers
try {
  const pkgMain = require('./lib/src/index.js');
  // If the module exported a default property, use it, otherwise treat pkgMain as the function
  const fn = pkgMain && pkgMain.default ? pkgMain.default : pkgMain;
  module.exports = fn;
  module.exports.default = fn;
  // Some compiled modules check for _esModule (single underscore) instead
  // of the standard __esModule flag. Set both to be defensive.
  Object.defineProperty(module.exports, '__esModule', { value: true });
  Object.defineProperty(module.exports, '_esModule', { value: true });
} catch (e) {
  console.error('Failed to load use-latest-callback:', e);
}
`;

try {
  fs.writeFileSync(indexPath, content, 'utf8');
  console.log('Wrote shim to', indexPath);
} catch (err) {
  console.error('Error writing shim:', err);
  process.exit(1);
}
