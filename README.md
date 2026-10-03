# StoreFlow POS — one GitHub repository edition

Version 4.1.0. A static HTML/CSS/JavaScript POS with the existing StoreFlow design. No PHP, MySQL, npm install, build step or hosting terminal is required.

Open START-HERE.html for the setup steps. One repository hosts the GitHub Pages website and saves its business records. No second website, separate data repository or cPanel hosting is required.

## What is included

Products and images, categories and brands, inventory, stock receipts and adjustments, phone-camera barcode scanning, USB scanner input, billing, sell by amount, discounts/tax/charges, held bills, receipts and barcode-label printing, returns, reports, expenses, CSV import/export, complete backups and a separate demo workspace.

The Customers profile tab, Credit Ledger, Customer QR, public catalog and Online Cart are removed. Cash, Card, Bank Transfer and Other remain; this version does not create credit sales. Card/bank payments are recorded, not processed. Original customer names on imported historical receipts remain, but no customer profiles are imported.

## Upload and enable GitHub Pages

1. Create a public GitHub repository, for example `my-pos`. If you already have a repository for the earlier GitHub POS, you can update that same repository. Export a complete backup from the old POS first.
2. Extract this ZIP on your computer. In your repository choose Add file → Upload files. Upload the extracted site CONTENTS, including `index.html` and the complete `assets` folder, at the repository root. Do not upload just the ZIP or put everything inside an extra enclosing folder. Keep any existing `data` folder and custom-domain CNAME file.
3. Commit the files to `main` (or your chosen publishing branch).
4. Open repository Settings → Pages. Under Build and deployment choose Deploy from a branch → `main` → `/ (root)` → Save.
5. Wait for GitHub's deployment to finish, then open the HTTPS website shown on the Pages screen, normally `https://YOUR-USERNAME.github.io/my-pos/`. For an account site, use a repository named `YOUR-USERNAME.github.io` and open `https://YOUR-USERNAME.github.io/`. Custom domains continue to work.
6. For an existing installation, replace the supplied interface files, close old POS tabs and hard-refresh the site (Ctrl+F5). Do not delete your saved data files to update the app.

The package includes a no-Jekyll marker, uses relative asset paths, and needs no PHP, MySQL, npm install, build command or terminal. No GitHub Actions workflow needs to be pasted or edited for this setup.

## Connect the same repository

1. In GitHub go to Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token.
2. Select the correct resource owner and an expiration date. Under “Only select repositories”, select the SAME repository you uploaded the website into, for example `my-pos`.
3. Set Repository permissions → Contents → Read and write. Metadata read access is included by GitHub. No Administration or Workflows permission is needed. Organizations may require token approval; the publishing branch must allow your authorized direct file updates.
4. Open your GitHub Pages POS and click Connect GitHub.
5. Enter your GitHub owner name, website repository name, and the SAME branch used by Pages (usually `main`). Paste the fine-grained token, then click Connect repository. Never paste the token into a source file or commit it to the repository.
6. Set up the shop once. On another device, open the same site and connect the same owner/repository/branch to load the existing shop.

The public-repository and “Pages enabled” restrictions from the previous package are removed. Everything uses this one repository. The token is sent only to GitHub's API to authorize access; there is no second service receiving your credentials or data.

The fine-grained token authorizes CHANGES. There is no separate username/password login. Store data files in this public repository—including products, costs, sales, expenses and shop details—are publicly readable, as requested. Keep your token private: someone with its write access can modify repository files. A disconnected POS page prompts for a connection before changing records.

The token is kept in sessionStorage for the tab session and reused on page refresh. Disconnect removes it. A normal new tab/device needs its own connection. Browser features that duplicate or restore a tab/session can also copy/restore sessionStorage: explicitly Disconnect on shared devices. Tokens never appear in business files, commit messages, backups, URLs or the service-worker cache. The app includes no third-party analytics or remotely loaded JavaScript.

## Where everything is saved

- `data/storeflow.json`: products (including compressed images), categories, brands, sales, returns, stock movements, store settings, invoice counters, cashier drafts, held bills and expenses.
- `data/storeflow-demo.json`: the separate demo store.

The app creates these files in the same website repository after your first change. You do not need to create or upload empty data files. There is one complete JSON file per workspace to commit sale, stock, invoice counter and ledger changes together. Editing/deleting a current product image changes its current record. Git history retains older versions; ordinary deletion does not erase historical Git commits.

Only interface preferences, the tab token and a temporary recovery journal use browser storage. The same website repository is the permanent source of business records. The connected POS reads and writes directly through GitHub’s API, so it sees confirmed records without waiting for the GitHub Pages copy to redeploy. Directly opening a published JSON URL can show an older cached/deployed copy until Pages updates. The service worker caches interface files only, never GitHub responses or tokens. Search/filtering uses the loaded snapshot and does not make a GitHub request for each character.

## How saving behaves

- No connection: saving actions are blocked and open Connect GitHub. There is no silent fallback to a browser-only store.
- Save/Add/Complete sale: records are confirmed after GitHub accepts the commit. Do not close the tab while “Saving” or “Bill changes waiting to save” is displayed.
- Rapid bill edits: the draft saves automatically after 1.5 seconds of inactivity. Checkout and other explicit actions flush or commit the appropriate bill first. A bill still being edited is a draft, not a completed sale.
- Other connected devices check for updates every 30 seconds while the page is active and no editor/scanner is open. “Refresh from GitHub” is available in Settings.
- Concurrent edits: GitHub's file SHA prevents a stale write from overwriting another device's save. If a conflict appears, refresh, review, and repeat the action. Checkout reads current stock and rechecks the prices/quantities shown for payment.
- Interrupted save: the app records one in-flight write journal before sending it, checks whether its transaction ID was committed after a lost response, and avoids repeating a confirmed checkout. Use Settings → Retry save when instructed. Reloading/reconnecting the same tab also attempts to resolve that same authorized write. Keep the tab open until recovery is confirmed; don't create a replacement bill for an unconfirmed sale.
- Token expires: reconnect the same repository with a replacement fine-grained token. If a write is pending, reconnect the original repository first. Resolve it before switching repositories.
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

GitHub's published general limits include 5,000 authenticated API requests per hour and secondary content-generation limits generally around 80 per minute and 500 per hour; lower endpoint/abuse limits can apply. These are not guarantees of 500 checkouts: a draft, product edit, stock update or other save is also a write. The app reports rate limits and waits until the indicated time rather than flooding retries. A busy shop or many simultaneous cashiers can reach these limits; GitHub-backed JSON is not a high-throughput database. Branch-based Pages publishing also has a soft limit of 10 builds per hour. Saves do not wait for a Pages rebuild, but published static copies can lag behind the repository.
https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api

## Troubleshooting

- 403 or read-only token: check Contents read/write, selected website repository, organization approval and branch protection. Don't grant broad account access to solve a typo.
- 404: check owner/name/branch, token access, and that the repository has a README/initial commit.
- A blank/new shop: confirm you're connected to the correct repository and branch. Do not reset or import over the wrong store.
- Invalid data file: the app refuses to overwrite it. Restore a known good version/backup.
- Old UI after upload: close all old StoreFlow tabs, reopen the address and hard-refresh (Ctrl+F5). The new worker removes old StoreFlow interface caches, without deleting the old business database.
- Camera: HTTPS and permission are required; support depends on browser/device. USB scanners type into the product search field.

## GitHub hosting rules

GitHub Pages’ hosting rules still apply, including its restrictions on sites primarily facilitating commercial transactions or commercial SaaS. Making records public does not remove that restriction. This code change enables the requested single-repository technical setup; it does not change GitHub’s terms.
https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits

Pages publishing reference: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
API behavior reference: https://docs.github.com/en/rest/repos/contents
Token setup reference: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens
