#!/usr/bin/env node
// Export all HTML mockups to PNG using Playwright
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const HTML_DIR = __dirname;
const PNG_DIR = path.join(__dirname, 'png');

async function main() {
  // Create output dir
  if (!fs.existsSync(PNG_DIR)) fs.mkdirSync(PNG_DIR, { recursive: true });

  const htmlFiles = fs.readdirSync(HTML_DIR)
    .filter(f => f.endsWith('.html') && f !== 'export-png.js')
    .sort();

  console.log(`Found ${htmlFiles.length} HTML files. Exporting to PNG...`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });

  for (const file of htmlFiles) {
    const page = await context.newPage();
    const filePath = path.join(HTML_DIR, file);
    const pngName = file.replace('.html', '.png');
    const pngPath = path.join(PNG_DIR, pngName);

    try {
      await page.goto(`file://${filePath}`, { waitUntil: 'networkidle', timeout: 10000 });
      await page.waitForTimeout(500); // Let fonts/render settle
      await page.screenshot({ path: pngPath, fullPage: true });
      console.log(`  ✅ ${pngName}`);
    } catch (e) {
      console.log(`  ⚠️  ${file}: ${e.message}`);
    } finally {
      await page.close();
    }
  }

  await browser.close();
  console.log(`\nDone! ${htmlFiles.length} PNGs exported to ${PNG_DIR}`);
}

main().catch(console.error);
