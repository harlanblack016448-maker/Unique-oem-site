const fs = require('fs');
const path = require('path');

// Ensure assets directory exists
const assetsDir = path.join(__dirname, '..', 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Copy the Speed Insights module to assets
const sourceFile = path.join(__dirname, '..', 'node_modules', '@vercel', 'speed-insights', 'dist', 'index.mjs');
const destFile = path.join(assetsDir, 'speed-insights.js');

try {
  const content = fs.readFileSync(sourceFile, 'utf8');
  fs.writeFileSync(destFile, content);
  console.log('✓ Copied Speed Insights module to assets/speed-insights.js');
} catch (error) {
  console.error('Error copying Speed Insights:', error.message);
  process.exit(1);
}
