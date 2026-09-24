# Muneej — Personal Portfolio

A complete static personal website, ready for GitHub Pages.

## Preview it first

Extract the ZIP and double-click `index.html`. Keep `style.css`, `script.js`, and the `assets` folder next to it.

There is no installation, build command, database, API key, or paid dependency.

## Put it live on GitHub Pages

1. Sign in to GitHub and create a **public repository**. Name it `portfolio`, or use `YOUR-GITHUB-USERNAME.github.io` for a site at your account's main Pages address.
2. In the repository, choose **Add file → Upload files**. On an empty repository, use the **uploading an existing file** link.
3. Upload the **contents of the extracted ZIP**, including the `assets` folder. Do not upload the ZIP itself or an extra containing folder. `index.html` must be visible at the repository's top level.
4. Select **Commit changes**.
5. Open **Settings → Pages**.
6. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
7. Choose **main** and **/(root)**, then **Save**.
8. Wait for the Pages deployment to complete. The same Settings → Pages screen will show your website link. Open it once GitHub reports that the site is live.

If your repository uses a different default branch name, select that branch instead of `main`.

GitHub's official instructions: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

All asset paths are relative, so the website works at both a main Pages address and a project address ending in `/portfolio/`.

## Included files

- `index.html` — all page content, navigation, metadata, and embedded favicon.
- `style.css` — responsive layouts, colors, hover effects, and animations.
- `script.js` — project details, motion preference, mobile navigation, particles, pointer effects, and scroll reveals.
- `assets/hero.webp` — optimized, original chrome-and-lime artwork.
- `.nojekyll` — tells GitHub Pages to serve the static files directly. If your file picker hides it, the other files still form a normal static site; you can also create an empty `.nojekyll` file through GitHub.
- `README.md` — these instructions.

## Make it yours

- Edit the visible text in `index.html`.
- Edit the `projects` object in `script.js` to change the project detail panels and website links.
- Change `--lime`, `--bg`, and `--text` near the top of `style.css` to change the colors.
- Replace `assets/hero.webp` with your own artwork if desired.

Contact links currently point to **https://muneej.com**. BulkBooster links to **https://bulkbooster.shop**. GenFlume AI is marked **in development**; ShowcaseMe inquiries go through Muneej.com. No unverified email address, phone number, or social handle has been added.

If you want direct email or WhatsApp contact later, replace the contact URLs with your correct public contact links in `index.html`.

## Interactions

- Floating artwork and labels.
- Mouse-responsive hero parallax and subtle particles.
- Magnetic buttons and a soft cursor ring on compatible desktop devices.
- Project card tilt, spotlights, and animated brand graphics.
- Clickable project detail panels (Escape or the close button dismisses them).
- Expandable expertise sections.
- Scrolling text, section reveals, and reading progress.
- Responsive mobile navigation.
- Motion pause/resume control, saved on the current device where browser storage is available.
- Automatic reduced-motion support and keyboard focus states.

The main content, links, and expertise sections remain accessible with JavaScript disabled. The interactive project panels need JavaScript. The site uses system fonts and bundled assets, with no external font or animation-library requests.

## Updating your live site

Upload changed files into the same repository and commit them. GitHub Pages will publish the update. If you still see an old version, refresh after the deployment has completed.

## Troubleshooting

- **GitHub displays a README instead of the website:** Put `index.html` at the top level of the selected publishing folder.
- **Missing artwork or styling:** Upload `assets/hero.webp`, `style.css`, and `script.js` with the original names and folder structure. Names are case-sensitive.
- **Animations do not move:** Check the Motion button and your device's reduced-motion accessibility preference.
- **404 just after enabling Pages:** Check the deployment status in the repository's Actions tab and confirm that Pages uses your correct branch and `/(root)`.

## Ownership and scope

The full editable website source and its artwork are included. This is a personal portfolio: linked businesses continue to run on their own websites. There is no form that pretends to send messages or collect submissions.

The artwork was generated for this portfolio. Project visuals are stylized brand presentations, not screenshots of the businesses' actual interfaces.
