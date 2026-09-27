# Validation — one GitHub repository edition (4.1.0)

49 automated checks passed: 36 data/repository checks and 13 interface checks.

The repository tests use simulated GitHub REST responses to exercise successful saves, stale SHA conflicts, public repositories with GitHub Pages enabled, denied token permissions, rate limiting, disconnected writes, tab-session restoration, multi-device reads, interrupted requests and durable retry recovery. No real token is bundled or used in these tests.

POS checks cover exact Rs. 40 weighted checkout and rounded stock/cost, duplicate-checkout prevention, partial/full refunds, expenses, stock changes, held/draft bills, reports, 4,000-product CSV import in one commit, schema 1 backup migration, legacy browser import, credit-backup rejection, corrupted-data rejection, Unicode, large-file blob fallback and stale editor protection.

Interface checks use JSDOM. They cover connection prompts, setup, removed sidebar/mobile/direct routes, product forms, cursor/selection preservation without per-keystroke API calls, amount-mode checkout, receipts, expenses/net profit, settings, polling, held/resumed bills and disconnect. No uncaught interface errors were observed.

The complete data and interface checks ran against a simulated public website repository. All writes targeted data files in that same repository, and no commit requested CI skipping. The interface test used a GitHub Pages project URL. All JavaScript passes syntax checks; module imports and main assets resolve for account-root and project-folder Pages URLs. ZIP files have mode 0644 and folders 0755.

Limits: no live write to the user's repository was performed, since no GitHub token was supplied. Physical camera/scanner, printer, mobile keyboard and visual rendering were not tested on hardware in this update. Real connection speed, repository rules, token approvals and rate limits depend on the user's GitHub account and network.
