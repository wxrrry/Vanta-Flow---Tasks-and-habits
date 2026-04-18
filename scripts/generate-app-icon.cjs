/**
 * Растеризует public/icons/icon.svg → electron/app-icon.png (512×512).
 * Windows и electron-builder не используют SVG как иконку .exe — нужен PNG/ICO.
 */
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const root = path.join(__dirname, '..');
const svgPath = path.join(root, 'public', 'icons', 'icon.svg');
const outPath = path.join(root, 'electron', 'app-icon.png');

async function main() {
  if (!fs.existsSync(svgPath)) {
    console.error('Missing:', svgPath);
    process.exit(1);
  }
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  await sharp(svgPath).resize(512, 512).png().toFile(outPath);
  console.log('Wrote', outPath);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
