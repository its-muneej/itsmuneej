# StoreFlow POS — Ultra Storage

This is the free website edition with Ultra Storage branding. It includes the existing POS features and the Get full version page. Version 4.1.3 adds the same current-bill draft saving behavior as the cPanel 4.1.1 update. Your connection method and store data format are unchanged.

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

Products, images, categories, brands, stock, sales, returns, expenses, settings and saved bills continue to save together. Changes require a connected session. Wait for the saved status before closing a tab. A connection is normally needed once per browser-tab session; page refresh reuses that session. Use Disconnect when finished on a shared device.
Internet is required to confirm saves. If a save is unconfirmed, use Settings → Retry save; do not repeat an unconfirmed checkout as a new sale. Refresh from Ultra Storage loads the latest records. Existing conflict checks and interrupted-save recovery are unchanged.

## Your data files

The permanent files remain data/storeflow.json for the real store and data/storeflow-demo.json for the separate demo workspace. The app creates them after the first change. Keep these files when updating. File formats, backup compatibility, key handling and browser-session identifiers are unchanged.
This edition still uses public website storage: published business records are publicly readable. The Personal Access Key authorizes changes; it does not make public data private. Renaming the interface does not hide publicly delivered website source code.
Each save sends the full workspace file. The existing 45 MiB file limit, connection limits and permissions still apply. Search uses the loaded store snapshot.

## Get full version

Use Get full version directly below Categories & brands in the sidebar, or from More on a phone, to see the full-version features and contact details. This page does not change the free edition’s features or require a storage connection.
Developed by Muneej — Founder & CEO of Muneej.com Pvt. Ltd.
Contact: +92 304 4428162

## What changed in this package — 4.1.3

The + button and typed quantities update one current-bill draft. Rapid edits are combined into one save after a 700 ms pause. Only one draft save runs at a time; if you edit during a slow save, only the latest pending bill is sent next. Pausing and editing again can update the same draft again; this does not mean one upload for an entire long billing session.

Checkout waits for the latest bill to be saved. An unchanged, already-saved bill skips the extra draft request. The existing sale-and-stock transaction, completed-draft removal, full store refresh, conflict checks and Retry save recovery remain in place. Hold, restore, reset and workspace changes cancel or finish pending draft work before replacing the bill.

Until a save is confirmed, the newest edits are still in the open tab. Wait for “Connected · saved in Ultra Storage” before closing. Closing or crashing the browser before confirmation can lose those latest edits. Each confirmed write still uploads the full workspace file; this change reduces redundant writes, not the file size or storage-service latency.

## Files changed in 4.1.3

Replace: assets/js/app.js — batched draft saves and lifecycle integration.
Replace: assets/js/db.js — release version only; storage and sale logic unchanged.
Replace: index.html — loads the updated app script.
Replace: service-worker.js — refreshes the static interface cache.
Add: assets/js/draft-saver.js — shared draft scheduler from cPanel 4.1.1.
Replace: START-HERE.html, README.md, VALIDATION.md — update guide and verification notes.

The storage connection, API adapter, calculation rules, remaining feature modules, styles and assets are unchanged. Keep your existing data/ folder. No migration, store reset, new key, login page, backend or permanent key storage is required. Internal filenames are retained for compatibility; visible interface labels use Ultra Storage.
