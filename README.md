# StoreFlow POS

A static, mobile-first point of sale and inventory application. All business records stay in IndexedDB on the shopkeeper’s device. No account, database service, server, API key, npm install, or build step is required.

## Put it on GitHub Pages

1. Extract **StoreFlow-POS-GitHub-Pages.zip** on your computer. GitHub does not extract ZIP files.
2. Create a GitHub repository, or open the repository where you want the app.
3. Choose **Add file → Upload files**. Upload **all the extracted files and the complete `assets` folder**. `index.html` must be at the root of the folder you publish, not inside an extra enclosing ZIP folder.
4. Commit the files.
5. Open **Settings → Pages**. Under **Build and deployment**, choose **Deploy from a branch**, select **main** and **/(root)**, and save.
6. Wait for GitHub to show your published URL. Open that HTTPS URL in a normal browser window.
7. Enter your shop name and currency, add your first product, and start selling. Or select **Explore demo** to try an isolated sample shop.

You can publish at `https://username.github.io/repository-name/` or your own HTTPS domain. Every asset path is relative. Navigation uses hash routes, so no rewrite rules are needed.

Opening `index.html` by double-clicking is not a supported deployment method. Browser security prevents modules, camera access and service workers from operating consistently on `file://` URLs.

## Everyday use

### Products and stock

- **Products → Add product:** add a name, barcode or SKU, category, purchase price, selling price, opening stock, unit and optional image/expiry date.
- Existing barcodes and SKUs cannot be assigned to another product. Leading zeroes are preserved.
- **Generate internal code** creates a unique CODE-128-compatible value for products without a manufacturer barcode.
- **Stock in:** search or scan a product, enter received quantity and optionally change its purchase price.
- **Inventory → Adjust stock:** enter a signed quantity and a reason. Use a negative quantity for damage, loss or samples.
- Product edits do not silently change stock. Every stock change has a ledger entry.
- Deleting a product removes it from the active catalog and removes its stored image, but preserves an archived record for invoices and returns. Its original barcode remains reserved. Clear Inventory sets catalog stock to zero and archives the records.

### Sell

1. Open **Point of sale**.
2. Tap products, enter a barcode in search and press Enter, or tap **Scan items**.
3. Select a customer if needed. Set any discount, tax or charges.
4. Tap **Checkout**, choose payment method and enter cash received.
5. Confirm payment after you have actually received it. Stock is deducted only when the completed sale is saved.
6. Print the receipt or use your browser’s **Save as PDF** option.

**Hold bill** saves an unfinished cart. Held bills do not reserve stock. Resuming a bill uses current product prices and stock availability.

Cash, card, bank transfer and other payments are recorded, not processed by a payment gateway.

### Live camera scanner

- Uses the locally bundled ZXing browser library to continuously decode live video. No photos or file uploads are required.
- Supports EAN-13, EAN-8, UPC-A, UPC-E, CODE-128, CODE-39, ITF and QR codes, subject to image clarity and device camera quality.
- Rear camera is preferred. The camera selector switches cameras. Torch is enabled only when the browser/camera reports support.
- Move a code out of view for roughly one second before scanning the same item again. Keeping it continuously in view does not repeatedly add quantities.
- POS scans add known active products to the bill. An unknown code offers **Add product**, with its value prefilled.
- Stock scans open the receiving form. **Products/Inventory → Lookup** opens product details and recent stock/sales history.
- Scanning a QR code treats the decoded text as a product identifier; it never opens or executes its content.
- Manual entry remains available when a camera is unavailable. USB/Bluetooth scanners that act like a keyboard work in the POS search box with an Enter suffix.

Use the published **HTTPS** site, allow camera access, and use a current browser. Phone camera, focus and torch behavior should be tested on your actual device before using the app at a busy counter. Audio/vibration are optional and browser-dependent. Leaving the page or closing the scanner stops the camera.

### Returns

Open a sale, choose **Return products**, enter quantities and a reason, then confirm. The app prevents returning more than the quantity sold, restores stock, records a stock movement and calculates the refund. It allocates the original discount, tax and charges across items so all partial refunds add up to the exact original total. Pay the refund outside the app. If the item is damaged, follow with a stock adjustment.

### Receipts and labels

- Receipts keep the shop details and purchase costs from the time of sale.
- **Print / PDF** opens the browser print dialog. Select a printer or **Save as PDF**.
- **58mm / 80mm** use narrow receipt layouts. Select matching paper in the printer driver, use 100% scale and disable browser headers/footers. Printer drivers and phone printing support vary; the app cannot connect directly to a Bluetooth thermal printer.
- Labels are CODE-128 with optional name, price and shop name. Print 1–200 copies. A4 label printing uses a flexible grid of 60mm labels; align the printer settings with your actual label stock. Long codes may need larger labels.

## Backups and transfer between devices

In **Settings → Backups & data**, choose **Export complete backup** regularly. Save the JSON file somewhere outside the browser, such as your computer or personal drive.

A backup includes products and images, categories, brands, customers, invoices and sale items, payments, returns, stock ledger, settings, invoice counters, active bill and held bills. Restore validates data before replacing the current workspace in one transaction. Imports are limited to 100 MB; CSV imports to 10 MB / 10,000 products.

To move to another device, export a backup on the old device, open the same app on the new device, then **Import complete backup**. Import replaces the destination workspace; it does not merge databases. Independently operated devices do not share stock or synchronize invoices. Use one device/browser as the authoritative shop record.

Demo data lives in a separate database. **Exit demo** returns to your real shop. Demo changes do not affect real data. Reset and restore act on the currently selected workspace.

Clearing browser data, uninstalling a browser, using private browsing or losing the device may delete your records. **Keep storage on device** requests persistent browser storage where supported; it is not a substitute for backups. Changing your domain or repository path also creates a different storage location. Export before moving the website.

There is no login or secure multi-user authorization. Anyone with access to the same unlocked browser profile can use its local shop. Website source files are public when your GitHub repository is public; business records are not uploaded to that repository by the app.

## CSV

Download the template from the import dialog or Settings. Required columns: **Name, Purchase Price, Selling Price, Stock**. Optional: **Barcode, SKU, Category, Brand, Minimum Stock, Unit**.

An import previews every row and flags duplicate barcodes/SKUs, invalid amounts and missing fields. Resolve all errors before importing; products are added only, never silently overwritten. Product imports do not import images or transaction history. Use JSON backups for a complete transfer.

Exports are available for products/inventory, sales, customers and stock movements. Text that could be interpreted as a spreadsheet formula is prefixed with an apostrophe. A sales export shows the original sale, refunded amount and net amount; the complete JSON also includes detailed return records.

## Calculations

- Monetary values use integer minor units with two decimal places. Currencies with a different number of minor-unit decimals are not specially modeled.
- Quantities support three decimal places. Enter units consistently for each product.
- Discount is fixed amount or percentage; tax applies after discount; additional charges are added after tax.
- Profit is net selling amount after discount plus charges, minus purchase cost saved at sale time. Tax is excluded. This is an estimate before rent, salaries and other business expenses.
- Stock-in replaces the purchase price used for future sales. This is not FIFO or weighted-average inventory accounting.
- Reports subtract refunds on the date they were returned. Today follows the device’s local timezone. Check your device’s date and timezone.
- Returns cannot exceed sold quantities. Completed-cart IDs cannot be replayed, and transactions serialize concurrent stock deductions.
- Invoice counters are unique within this local database and preserved in backups. Separate devices can create overlapping human-readable invoice numbers; there is no global server allocator.
- **Clear sales history** keeps current stock but replaces its ledger with a new baseline. **Reset application** removes all records and invoice numbering in the current workspace. Export a backup before either action.

## Offline and installation

The service worker caches the complete app shell, fonts, scanner and barcode libraries after the first successful online load. Reopen after the initial load to confirm that offline access is ready. Inventory, checkout, receipts and reports then operate locally. No runtime CDN, API or remote font is required.

On supported Android/desktop browsers, use **Install app** or the browser menu. On iPhone, use Safari’s **Share → Add to Home Screen**. Camera and printing capabilities still depend on the browser and OS.

To release a code update, change the version in `service-worker.js` (and `VERSION` in `assets/js/db.js`), upload the changed files, close all old app tabs/windows, then reopen online. The new worker activates after the old one has no open clients; it does not clear business data. Database upgrades should use a new IndexedDB schema version with a migration; do not rename the database for ordinary app updates.

## Desktop shortcuts

- **F2:** focus product search on the cashier.
- **F4:** open the scanner on the cashier.
- **F8:** open checkout on the cashier.
- **Escape:** close the top dialog.
- **/** outside a text field: open global search.

## Project files

- `index.html`: application shell.
- `assets/css/app.css`: desktop/mobile layouts, themes, receipts and labels.
- `assets/js/app.js`: views and workflows.
- `assets/js/db.js`: IndexedDB schema, atomic checkout, stock and refund logic.
- `assets/js/scanner.js`: live camera scanning and feedback.
- `assets/js/transfer.js`: CSV import/export and validated JSON restore.
- `assets/js/demo.js`: isolated demo records.
- `assets/js/ui.js`: UI utilities, icons, image compression and downloads.
- `assets/vendor/`: locally bundled scanner and barcode libraries with license files.
- `manifest.json`, `service-worker.js`, `assets/icons/`: installability and offline app shell.
- `.nojekyll`: allows GitHub Pages to serve the static project directly.

To change branding, edit the name/logo in `app.js` and `index.html`, plus the manifest and app icons. Shop-specific branding is editable in Settings.

## Verification performed

Automated IndexedDB checks covered product persistence, duplicate barcodes, discounted/taxed totals, underpayment rollback, duplicate-checkout rejection, concurrent last-item sales, historical purchase costs, over-return rejection, exact cumulative partial refunds, cent allocation, unique invoice numbers, quoted CSV/leading zeroes, CSV duplicates/formula escaping, complete backup/restore and demo ledger reconciliation.

Browser checks covered the dashboard, cashier, cash checkout, receipt/change, return flow, mobile product creation, stock receiving, barcode label preview, navigation and responsive overflow at 320, 375, 430, 768, 1024 and 1440 pixels. Physical camera scanning, torch, actual printers and installed/offline behavior require validation on the target phone/printer. Optional experimental WebMCP hooks are feature-detected; the test browser did not expose that API.

## Third-party software

- ZXing Browser 0.1.5 — MIT, with the bundled ZXing decoder’s Apache-2.0 notices where applicable. [Project](https://github.com/zxing-js/browser).
- JsBarcode 3.12.1 — MIT. [Project](https://github.com/lindell/JsBarcode).
- Inter font — SIL Open Font License. [Project](https://github.com/rsms/inter).

Bundled third-party copyright/license files must be preserved when redistributing the app.
