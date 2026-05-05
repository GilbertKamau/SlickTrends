/**
 * SlickTrends — Automated Product Uploader
 * 
 * Reads products.json, navigates to /admin/stock for each product,
 * fills every form field, attaches the matching photo, and submits.
 *
 * Usage:
 *   node upload-products.js
 *   node upload-products.js --start 5        (resume from product index 5)
 *   node upload-products.js --dry-run        (fill form but don't submit)
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

// ─── CONFIG ─────────────────────────────────────────────────────────────────
const CONFIG = {
  baseUrl:    'https://slicktrendske.com',
  adminEmail: process.env.SLICK_EMAIL    || 'YOUR_ADMIN_EMAIL',
  adminPass:  process.env.SLICK_PASSWORD || 'YOUR_ADMIN_PASSWORD',
  photosDir:  path.resolve(__dirname, 'photos'),   // folder with the jpeg files
  productsFile: path.resolve(__dirname, 'products.json'),
  delayBetweenProducts: 2000,  // ms between submissions — be polite to your server
  headless: false,             // set true to run silently in the background
  logFile: path.resolve(__dirname, 'upload-log.json'),
};

// ─── HELPERS ────────────────────────────────────────────────────────────────
function log(msg) {
  const ts = new Date().toISOString();
  console.log(`[${ts}] ${msg}`);
}

function loadLog() {
  if (fs.existsSync(CONFIG.logFile)) {
    return JSON.parse(fs.readFileSync(CONFIG.logFile, 'utf8'));
  }
  return { completed: [], failed: [] };
}

function saveLog(data) {
  fs.writeFileSync(CONFIG.logFile, JSON.stringify(data, null, 2));
}

async function selectDropdown(page, label, value) {
  // Works for both <select> elements and custom dropdown components
  const field = page.locator(`label:has-text("${label}")`).locator('..').locator('select');
  if (await field.count() > 0) {
    await field.selectOption({ label: value });
    return;
  }
  // Fallback: look for select near the label text directly
  const sel = page.locator(`select`).filter({ hasText: '' }).nth(0);
  const selByValue = page.locator(`select option[value="${value}"]`).locator('..');
  if (await selByValue.count() > 0) {
    await selByValue.selectOption(value);
  }
}

// ─── LOGIN ───────────────────────────────────────────────────────────────────
async function login(page) {
  log('Logging in...');
  await page.goto(`${CONFIG.baseUrl}/login`);
  await page.waitForLoadState('networkidle');

  // Try common login form selectors
  const emailInput = page.locator('input[type="email"], input[name="email"]').first();
  const passInput  = page.locator('input[type="password"]').first();
  const submitBtn  = page.locator('button[type="submit"], input[type="submit"]').first();

  await emailInput.fill(CONFIG.adminEmail);
  await passInput.fill(CONFIG.adminPass);
  await submitBtn.click();

  // Wait for redirect to dashboard
  await page.waitForURL(`**/admin/**`, { timeout: 15000 });
  log('Logged in successfully.');
}

// ─── UPLOAD ONE PRODUCT ──────────────────────────────────────────────────────
async function uploadProduct(page, product, dryRun = false) {
  log(`Uploading: "${product.name}"`);

  await page.goto(`${CONFIG.baseUrl}/admin/stock`);
  await page.waitForLoadState('networkidle');

  // ── Product Name ──
  const nameInput = page.locator('input[placeholder*="Cozy Winter Robe"], input[placeholder*="product name" i]').first();
  await nameInput.fill(product.name);

  // ── Description ──
  const descInput = page.locator('textarea').first();
  await descInput.fill(product.description);

  // ── Category dropdown ──
  const categorySelect = page.locator('select').nth(0);
  await categorySelect.selectOption({ label: product.category });

  // ── Size dropdown ──
  const sizeSelect = page.locator('select').nth(1);
  await sizeSelect.selectOption({ label: product.size });

  // ── Condition dropdown ──
  const condSelect = page.locator('select').nth(2);
  await condSelect.selectOption({ label: product.condition });

  // ── Price ──
  const priceInput = page.locator('input[placeholder="1500"]').first();
  await priceInput.fill(String(product.price));

  // ── Original Price ──
  const origPriceInput = page.locator('input[placeholder="3000"]').first();
  await origPriceInput.fill(String(product.originalPrice));

  // ── Stock Quantity ──
  const qtyInput = page.locator('input[placeholder="10"]').first();
  await qtyInput.fill(String(product.stockQuantity));

  // ── Brand ──
  const brandInput = page.locator('input[placeholder*="Nike" i]').first();
  await brandInput.fill(product.brand);

  // ── Color ──
  const colorInput = page.locator('input[placeholder*="Navy Blue" i]').first();
  await colorInput.fill(product.color);

  // ── Images ──
  const imageFiles = product.images
    .map(filename => path.join(CONFIG.photosDir, filename))
    .filter(p => {
      if (!fs.existsSync(p)) {
        log(`  ⚠ Image not found: ${p}`);
        return false;
      }
      return true;
    });

  if (imageFiles.length > 0) {
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(imageFiles);
    log(`  Attached ${imageFiles.length} image(s).`);
  }

  // ── Featured checkbox ──
  const featuredCheckbox = page.locator('input[type="checkbox"]').first();
  const isChecked = await featuredCheckbox.isChecked();
  if (product.featured && !isChecked) {
    await featuredCheckbox.check();
  } else if (!product.featured && isChecked) {
    await featuredCheckbox.uncheck();
  }

  if (dryRun) {
    log(`  DRY RUN — form filled, not submitting.`);
    await page.screenshot({ path: path.join(__dirname, `dry-run-${Date.now()}.png`) });
    return;
  }

  // ── Submit ──
  const submitBtn = page.locator('button[type="submit"], button:has-text("Add Product"), button:has-text("Save")').first();
  await submitBtn.click();

  // Wait for success indication (toast, redirect, or success message)
  try {
    await page.waitForSelector(
      '.toast-success, [class*="success"], [class*="Success"], [data-status="success"]',
      { timeout: 10000 }
    );
    log(`  ✓ "${product.name}" uploaded successfully.`);
  } catch {
    // Fallback: check if URL changed (redirect after save)
    const url = page.url();
    if (!url.includes('/stock')) {
      log(`  ✓ "${product.name}" uploaded (redirected to ${url}).`);
    } else {
      log(`  ⚠ Submission may have failed — check the screenshot.`);
      await page.screenshot({ path: path.join(__dirname, `error-${Date.now()}.png`) });
      throw new Error(`Submission uncertain for "${product.name}"`);
    }
  }
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);
  const startIndex = parseInt(args[args.indexOf('--start') + 1] || '0', 10);
  const dryRun = args.includes('--dry-run');

  const products = JSON.parse(fs.readFileSync(CONFIG.productsFile, 'utf8'));
  const uploadLog = loadLog();

  log(`Starting upload of ${products.length} products (from index ${startIndex})${dryRun ? ' [DRY RUN]' : ''}`);

  const browser = await chromium.launch({ headless: CONFIG.headless });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page    = await context.newPage();

  try {
    await login(page);

    for (let i = startIndex; i < products.length; i++) {
      const product = products[i];

      if (uploadLog.completed.includes(product.name)) {
        log(`Skipping "${product.name}" — already uploaded.`);
        continue;
      }

      try {
        await uploadProduct(page, product, dryRun);
        if (!dryRun) {
          uploadLog.completed.push(product.name);
          saveLog(uploadLog);
        }
      } catch (err) {
        log(`  ✗ Failed: ${err.message}`);
        uploadLog.failed.push({ name: product.name, error: err.message, index: i });
        saveLog(uploadLog);
        // Continue to next product instead of crashing the whole run
        continue;
      }

      // Small delay between products to avoid hammering the server
      if (i < products.length - 1) {
        await page.waitForTimeout(CONFIG.delayBetweenProducts);
      }
    }

    log('');
    log(`=== Upload complete ===`);
    log(`Completed : ${uploadLog.completed.length}`);
    log(`Failed    : ${uploadLog.failed.length}`);
    if (uploadLog.failed.length > 0) {
      log(`Failed products:`);
      uploadLog.failed.forEach(f => log(`  - [${f.index}] ${f.name}: ${f.error}`));
    }

  } finally {
    await browser.close();
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
