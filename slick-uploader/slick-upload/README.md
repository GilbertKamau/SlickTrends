# SlickTrends — Automated Product Uploader

Uploads all 28 products to slicktrendske.com/admin/stock automatically,
filling every form field and attaching the correct product photo.

---

## Setup (one-time)

```bash
# 1. Install dependencies
npm install

# 2. Install Playwright's browser
npx playwright install chromium

# 3. Copy your photos folder into this directory
#    The folder must be named "photos" and contain all 28 JPEG files

# 4. Set your admin credentials (don't hardcode in the script)
export SLICK_EMAIL="your-admin@email.com"
export SLICK_PASSWORD="your-password"
```

---

## Run

```bash
# Upload all 28 products (browser window opens so you can watch)
npm run upload

# Test first — fills the form for product #1 but does NOT submit
npm run dry-run

# Resume from a specific product if a run was interrupted
node upload-products.js --start 10
```

---

## How it works

1. Logs into your admin panel at /login
2. Navigates to /admin/stock for each product
3. Fills: Name, Description, Category, Size, Condition, Price,
         Original Price, Stock Qty, Brand, Color
4. Attaches the matching JPEG from the photos/ folder
5. Checks or unchecks the "Featured product" checkbox
6. Clicks submit and waits for a success indicator
7. Logs progress to upload-log.json so interrupted runs can resume

---

## Files

```
slick-upload/
├── upload-products.js   ← main script
├── products.json        ← all 28 product definitions + image filenames
├── package.json
├── README.md
├── photos/              ← copy your photos folder here
│   ├── WhatsApp Image 2026-05-03 at 6.51.03 PM.jpeg
│   └── ... (all 28 files)
└── upload-log.json      ← auto-created, tracks progress
```

---

## Troubleshooting

**Selectors don't match / wrong fields filled**
Set `headless: false` in CONFIG (already the default) and watch the
browser fill the form. If a field is missed, inspect its HTML and update
the matching locator in `uploadProduct()`.

**Login fails**
Check that /login is the correct URL. If your app uses a different path
(e.g. /admin/login), update `CONFIG.baseUrl` in the script.

**Images not attaching**
Make sure the photos folder path matches CONFIG.photosDir and that all
28 filenames in products.json exactly match the files on disk (including
spaces and parentheses in the filenames).

**Picking up from a failed run**
The script writes upload-log.json after every successful submission.
Run `node upload-products.js --start N` where N is the index of the
first product that wasn't uploaded, or just run `npm run upload` again —
it skips products already listed in upload-log.json.
