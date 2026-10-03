# StoreFlow POS — Ultra Storage

This is the free website edition with Ultra Storage branding. It includes the existing POS features and the Get full version page. Your current connection and save behavior are unchanged.

## Update your existing website

1. Export a complete backup from Settings before updating.
2. Extract this ZIP. Upload the site contents, including index.html and the full assets folder, into your existing website folder. Replace the supplied files; do not upload only the ZIP or add an extra enclosing folder.
3. Keep your existing data folder, custom-domain CNAME file and publishing settings. This package contains no replacement business data.
4. Close old StoreFlow tabs, reopen your website and hard-refresh with Ctrl+F5. Use the same connection details and existing Personal Access Key. No store reset is required.

## Connect Ultra Storage

1. Click Connect Ultra Storage.
2. Enter the Username / Organization, Webpage name, and the branch used by your website. A blank branch uses the default.
3. Paste your Personal Access Key and click Connect Ultra Storage. The key must authorize reading and writing the selected webpage’s contents. Your software provider can supply or help configure these details.
4. Connect the same Ultra Storage and branch on another device to open the existing store.
The storage provider and authorization requirements have not changed.

## Saving your store

Products, images, categories, brands, stock, sales, returns, expenses, settings and saved bills continue to save together. Changes require a connected session. Wait for the saved status before closing a tab. Enter your connection details once on each browser. They are saved automatically, including the Personal Access Key, and reused after closing tabs or restarting the browser. Disconnect & forget removes the saved details; clearing site data or resetting the browser also removes them. Use this only on a trusted device. Private browsing and automatic site-data cleanup may not retain the connection. A key that expires or is revoked must be replaced. Disconnect any other already-open tabs separately.
Internet is required to confirm saves. If a save is unconfirmed, use Settings → Retry save; do not repeat an unconfirmed checkout as a new sale. Refresh from Ultra Storage loads the latest records. Existing conflict checks and interrupted-save recovery are unchanged.

## Your data files

The permanent files remain data/storeflow.json for the real store and data/storeflow-demo.json for the separate demo workspace. The app creates them after the first change. Keep these files when updating. Business file formats and backup compatibility are unchanged. Connection details are kept in this browser’s local storage; interrupted-save recovery stays separate in each tab’s session storage. Credentials are never added to business files or exports.
This edition still uses public website storage: published business records are publicly readable. The Personal Access Key authorizes changes; it does not make public data private. Renaming the interface does not hide publicly delivered website source code.
Each save sends the full workspace file. The existing 45 MiB file limit, connection limits and permissions still apply. Search uses the loaded store snapshot.

## Get full version

Use Get full version directly below Categories & brands in the sidebar, or from More on a phone, to see the full-version features and contact details. This page does not change the free edition’s features or require a storage connection.
Developed by Muneej — Founder & CEO of Muneej.com Pvt. Ltd.
Contact: +92 304 4428162

## What changed in this package

Visible storage names, connection labels, status and error messages now use Ultra Storage. The three explanatory paragraphs were removed from the connection window. The Get full version page was added using the existing design style. The interface cache version was advanced so updated files can load. Connection details now persist in the browser. Existing tab connections migrate automatically after successful verification. The storage API, access-key checks, business save logic and data structures remain unchanged. No login page or data encryption has been added.

## Files changed

Replace: index.html
Replace: assets/js/app.js
Replace: assets/js/repository-ui.js
Replace: assets/js/github.js
Replace: assets/js/db.js
Replace: assets/css/app.css
Replace: service-worker.js
Replace: START-HERE.html
Replace: README.md
Replace: VALIDATION.md
Internal filenames are retained for compatibility; visible interface labels use Ultra Storage.
