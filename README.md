# StoreFlow POS — GitHub repository edition

Version 4.0.0. A static HTML/CSS/JavaScript POS with the existing StoreFlow design. No PHP, MySQL, npm install, build step or hosting terminal is required.

Open START-HERE.html for the illustrated-style setup steps.

## What is included

Products and images, categories and brands, inventory, stock receipts and adjustments, phone-camera barcode scanning, USB scanner input, billing, sell by amount, discounts/tax/charges, held bills, receipts and barcode-label printing, returns, reports, expenses, CSV import/export, complete backups and a separate demo workspace.

The Customers profile tab, Credit Ledger, Customer QR, public catalog and Online Cart are removed. Cash, Card, Bank Transfer and Other remain; this version does not create credit sales. Card/bank payments are recorded, not processed. Original customer names on imported historical receipts remain, but no customer profiles are imported.

## Host the files

Upload the contents of this ZIP to a separate HTTPS site or folder, with index.html at its root. You can use cPanel File Manager: upload, extract, then open the site's HTTPS address. Files are packaged as 0644 and folders as 0755. Keep your working cPanel/MySQL edition in its own folder; this is a separate edition, not a replacement for api/config.php.

GitHub stores the business records. The data repository must be private with Pages disabled. It can be separate from the source repository of the interface. Do not put real store data, tokens, or backups into a public site repository.

GitHub Pages' published policy does not allow it as free hosting for an online business, e-commerce site, or sites primarily facilitating commercial transactions or commercial SaaS, and discourages sensitive transactions. Use hosting that permits a business POS, such as your cPanel host, for the static interface. This package does not require PHP or MySQL even when hosted on cPanel.
https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits

## Create and connect the data repository

1. In GitHub, create a PRIVATE repository, for example `my-shop-data`. Select “Add a README” so the default branch exists. Leave GitHub Pages disabled on this repository.
2. Go to Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token.
3. Choose the correct resource owner, an expiration date, and “Only select repositories”. Select only the private data repository.
4. Set Repository permissions → Contents → Read and write. Metadata read access is included by GitHub. This app does not require Administration or Workflows permission. For an organization, obtain any approval required by its policy. The selected branch must permit your authorized direct file updates.
5. Open StoreFlow, click Connect GitHub, and enter owner, repository name, branch (or leave blank for the default), and the fine-grained token. Never paste the token into HTML/JS files or the repository.
6. Set up the shop once. Later connect the same owner/repository/branch on another device; the existing shop loads rather than asking for setup again.

The GitHub connection is the access control for this edition. There is no PHP username/password login. Anyone holding a valid write token for this repository can access and change its store data. Use the least-privilege token above, and do not share it publicly.

The token is kept in sessionStorage for the tab session and reused on page refresh. Disconnect removes it. A normal new tab/device needs its own connection. Browser features that duplicate or restore a tab/session can also copy/restore sessionStorage: explicitly Disconnect on shared devices. Tokens never appear in business files, commit messages, backups, URLs or the service-worker cache. The app includes no third-party analytics or remotely loaded JavaScript.

## Where everything is saved

- `data/storeflow.json`: products (including compressed images), categories, brands, sales, returns, stock movements, store settings, invoice counters, cashier drafts, held bills and expenses.
- `data/storeflow-demo.json`: the separate demo store.

The app creates these files after your first change. There is one complete JSON file per workspace to commit sale, stock, invoice counter and ledger changes together. Editing/deleting a current product image changes its current record. Git history retains older versions; ordinary deletion does not erase historical Git commits.

Only interface preferences, the tab token and a temporary recovery journal use browser storage. The repository is the permanent source of business records. The service worker caches interface files only, never GitHub responses or tokens. Search/filtering uses the loaded snapshot and does not make a GitHub request for each character.

## How saving behaves

- No connection: saving actions are blocked and open Connect GitHub. There is no silent fallback to a browser-only store.
- Save/Add/Complete sale: records are confirmed after GitHub accepts the commit. Do not close the tab while “Saving” or “Bill changes waiting to save” is displayed.
- Rapid bill edits: the draft saves automatically after 1.5 seconds of inactivity. Checkout and other explicit actions flush or commit the appropriate bill first. A bill still being edited is a draft, not a completed sale.
- Other connected devices check for updates every 30 seconds while the page is active and no editor/scanner is open. “Refresh from GitHub” is available in Settings.
- Concurrent edits: GitHub's file SHA prevents a stale write from overwriting another device's save. If a conflict appears, refresh, review, and repeat the action. Checkout reads current stock and rechecks the prices/quantities shown for payment.
- Interrupted save: the app records one in-flight write journal before sending it, checks whether its transaction ID was committed after a lost response, and avoids repeating a confirmed checkout. Use Settings → Retry save when instructed. Reloading/reconnecting the same tab also attempts to resolve that same authorized write. Keep the tab open until recovery is confirmed; don't create a replacement bill for an unconfirmed sale.
- Token expires: reconnect the same private repository with a replacement fine-grained token. If a write is pending, reconnect the original repository first. Resolve it before switching repositories.
- No internet: completed sales cannot be safely confirmed. This edition is not an offline checkout queue.

## Move your existing data

Safest before changing versions: open the old POS → Settings → Export complete backup. Keep the JSON somewhere safe. After connecting this version, use Settings → Import complete backup. Read the confirmation: importing replaces the selected workspace.

If the original browser-only StoreFlow store is still in this browser at the SAME website origin and path, Settings → Import old browser data reads it and offers to move it to the connected repository. It does not delete the old browser database. If the site address/path changed, use the exported JSON backup instead.

Schema 1 browser backups and compatible schema 2 cPanel backups are supported. Customer profiles and public cart requests are excluded. A backup containing credit sales/payments is rejected to avoid discarding unpaid balances; retain those records in the cPanel edition or import products through CSV. No MySQL credentials, store password hashes or GitHub token are imported.

## Sell by amount and expenses

Enable “Allow sell by amount” in the product editor. At checkout choose Amount and enter the money value. Rs. 40 at Rs. 150/kg bills exactly Rs. 40 before discount/tax, with 0.267 kg deducted. Cost is calculated for the rounded quantity; the unit precision is 0.001.

Expenses have title, date, category, amount and notes. Categories: Rent, Electricity, Salaries, Other bills, Miscellaneous. Reports subtract expenses on their recorded dates:
Net profit = sales profit after returns and discounts − expenses for the selected period.

## Capacity and speed

There is no hard product-count limit; 4,000 products were checked in an automated CSV-import test. Each save uploads the full workspace JSON, so image size and sales/history growth affect speed. This edition caps a workspace file at 45 MiB and validates before writing. The per-tab recovery journal must fit browser session storage; very large imports/images may require smaller batches. CSV imports accept at most 10,000 products per batch but browser/storage limits can require fewer.

GitHub's published general limits include 5,000 authenticated API requests per hour and secondary content-generation limits generally around 80 per minute and 500 per hour; lower endpoint/abuse limits can apply. These are not guarantees of 500 checkouts: a draft, product edit, stock update or other save is also a write. The app reports rate limits and waits until the indicated time rather than flooding retries. Keep the cPanel database edition for busy shops or many simultaneous cashiers; GitHub-backed JSON is not a high-throughput database.
https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api

## Troubleshooting

- 403 or read-only token: check Contents read/write, selected private repository, organization approval and branch protection. Don't grant broad account access to solve a typo.
- 404: check owner/name/branch, token access, and that the repository has a README/initial commit.
- A blank/new shop: confirm you're connected to the correct repository and branch. Do not reset or import over the wrong store.
- Invalid data file: the app refuses to overwrite it. Restore a known good version/backup.
- Old UI after upload: close all old StoreFlow tabs, reopen the address and hard-refresh (Ctrl+F5). The new worker removes old StoreFlow interface caches, without deleting the old business database.
- Camera: HTTPS and permission are required; support depends on browser/device. USB scanners type into the product search field.

API behavior reference: https://docs.github.com/en/rest/repos/contents
Token setup reference: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens
