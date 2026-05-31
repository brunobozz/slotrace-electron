const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(__dirname, '..', 'package.json');

try {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const currentVersion = packageJson.version || '0.0.0';
  
  const parts = currentVersion.split('.');
  if (parts.length === 3) {
    const patchNum = parseInt(parts[2], 10);
    if (!isNaN(patchNum)) {
      parts[2] = (patchNum + 1).toString();
      packageJson.version = parts.join('.');
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf8');
      console.log(`[Version Auto-Increment] Bumped version from v${currentVersion} to v${packageJson.version}`);
    } else {
      console.error('[Version Auto-Increment] Patch version segment is not a number.');
    }
  } else {
    console.error('[Version Auto-Increment] Invalid version format in package.json.');
  }
} catch (err) {
  console.error('[Version Auto-Increment] Failed to auto-increment version:', err);
}
