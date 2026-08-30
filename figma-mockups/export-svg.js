#!/usr/bin/env node
// Export all HTML mockups to SVG using Playwright + foreignObject
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const HTML_DIR = __dirname;
const SVG_DIR = path.join(__dirname, 'svg-export');

async function main() {
  // Create output dir
  if (!fs.existsSync(SVG_DIR)) fs.mkdirSync(SVG_DIR, { recursive: true });

  const htmlFiles = fs.readdirSync(HTML_DIR)
    .filter(f => f.endsWith('.html'))
    .sort();

  console.log(`Found ${htmlFiles.length} HTML files. Exporting to SVG...`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  let exported = 0;
  let failed = 0;

  for (const file of htmlFiles) {
    const page = await context.newPage();
    const filePath = path.join(HTML_DIR, file);
    const svgName = file.replace('.html', '.svg');
    const svgPath = path.join(SVG_DIR, svgName);

    try {
      await page.goto(`file://${filePath}`, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(800); // Let fonts/render settle

      // Get page dimensions
      const dimensions = await page.evaluate(() => {
        return {
          width: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
          height: Math.max(document.documentElement.scrollHeight, document.body.scrollHeight),
        };
      });

      // Get the full HTML content
      const htmlContent = await page.content();

      // Build SVG with foreignObject
      const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" 
     xmlns:xlink="http://www.w3.org/1999/xlink"
     viewBox="0 0 ${dimensions.width} ${dimensions.height}" 
     width="${dimensions.width}" 
     height="${dimensions.height}">
  <foreignObject width="100%" height="100%">
    <div xmlns="http://www.w3.org/1999/xhtml">
${htmlContent}
    </div>
  </foreignObject>
</svg>`;

      fs.writeFileSync(svgPath, svgContent, 'utf-8');
      console.log(`  ✅ ${svgName} (${dimensions.width}x${dimensions.height})`);
      exported++;
    } catch (e) {
      console.log(`  ⚠️  ${file}: ${e.message}`);
      failed++;
    } finally {
      await page.close();
    }
  }

  await browser.close();
  console.log(`\nDone! Exported: ${exported}, Failed: ${failed}`);
  console.log(`SVGs saved to: ${SVG_DIR}`);
}

main().catch(console.error);
