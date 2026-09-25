# ShePrints3D.pk

You Imagine. We Design. She Prints.

A complete static website for a woman-led 3D design and printing studio in Pakistan. All production files are plain HTML, CSS, JavaScript, SVG and local WebP images. No installation, build step, database, backend, API key or external font service is required.

## Start here

1. Extract **ShePrints3D-GitHub-Pages.zip** on your computer.
2. Open `index.html` to preview the website locally. Keep the `assets` folder beside the HTML files.
3. Add your real public business details in `assets/js/config.js` before publishing.
4. Edit the seven sample catalog entries and confirmed prices in `assets/js/products.js`.
5. Upload the **extracted contents**, including the `assets` folder, to the root of your GitHub repository. Do not upload only the ZIP: GitHub Pages does not extract it.

`index.html` must be in the publishing root, not inside an additional `sheprints3d` folder.

## Add your contact details

Open `assets/js/config.js` in a text editor. Enter your WhatsApp number using the international country code and digits only, without `+`, spaces, or hyphens. For a Pakistani mobile number, replace the leading `0` with `92`.

- `whatsapp`: your actual business WhatsApp number. When valid, inquiry buttons automatically open a prefilled WhatsApp message.
- `phone`: a display phone number, optionally beginning with `+`.
- `email`: your real business email address.
- `instagram` / `facebook`: complete `https://` profile URLs. Empty values hide those links.
- `location`: currently `Pakistan`; replace with your public studio location if wanted.
- `currency`: `PKR` by default.

The supplied contact fields are intentionally empty because the brief did not supply a verified number, address, email or social links. Until you add a WhatsApp number, product inquiry links open the contact page with the selected product prefilled. Visitors can prepare, copy or download their inquiry, but cannot send it directly to the studio until a real contact destination is configured.

## Publish to GitHub Pages

1. Create or open a GitHub repository. On GitHub Free, use a public repository for Pages.
2. Upload the extracted website files and commit them to `main`.
3. Open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Choose **main** and **/(root)**, then save.
6. After GitHub finishes publishing, open the Pages URL shown in settings.

The empty `.nojekyll` file is included. If your file manager hides it during upload, add an empty file named `.nojekyll` in the repository. Plain HTML also works without a site generator.

### Your custom domain

`CNAME` already contains `sheprints3d.pk`. Also enter `sheprints3d.pk` in **Settings → Pages → Custom domain** and save; the file alone does not configure the repository setting.

Configure the domain's DNS to point to GitHub Pages according to GitHub's current instructions linked below. Use your actual GitHub username for any `www` CNAME target, without a repository name or `https://`. Enable **Enforce HTTPS** once GitHub makes it available. DNS and certificate readiness are separate from these website files.

If you want to test only on a `github.io` address first, remove `CNAME` until the domain is ready. Main page and image links are relative and work at both the domain root and a repository subpath. For nested 404s on a temporary project subpath, set `errorPageBase` in `404.html` to `/YOUR-REPOSITORY/`; restore `/` when moving to your custom domain. The value `/` is correct for the requested `sheprints3d.pk` deployment.

Canonical URLs, Open Graph URLs, `robots.txt` and `sitemap.xml` target `https://sheprints3d.pk/`. Update those if you permanently change the domain.

Official references, checked September 2026:

- [Configuring a publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- [Managing a custom domain](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)
- [Securing your site with HTTPS](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https)

## Pages and editing

| File | Purpose |
| --- | --- |
| `index.html` | Immersive homepage, services, process, electronics, replacement parts, projects and accessories |
| `shop.html` | Searchable catalog with category filters |
| `about.html` | Studio philosophy and product development process |
| `contact.html` | Project inquiry form and brief preview |
| `404.html` | Failed-print error page |
| `assets/css/style.css` | Shared visual system and page styling |
| `assets/css/responsive.css` | Tablet, phone and short-screen layouts |
| `assets/js/config.js` | Public contact information and currency |
| `assets/js/products.js` | Central product catalog |
| `assets/js/main.js` | Navigation, contact links and personalized name preview |
| `assets/js/animations.js` | Scroll stages, parallax, hover tilt and motion preferences |
| `assets/js/shop.js` | Product cards, search, filters and inquiry links |
| `assets/js/contact.js` | Validation, brief preparation, copying and downloads |
| `IMAGE-PROMPTS.json` | Full original prompts and AI visual provenance |
| `QA-NOTES.md` | Verification and practical limitations |

Navigation and footers are written into all five HTML files so the core pages are usable without JavaScript. If changing navigation labels, update each HTML file. Products require JavaScript; a no-script contact fallback is included.

To add a product, copy one object in `products.js`, use a unique `id`, add an image under `assets/images/products/`, and update its name, description, category and colors. Set `price` to a number after confirming a real price; `null` displays **Price on request**. Supported categories are All, Desk, Gadgets, Gaming, Organization and Personalized. All displayed products are editable starter concepts, not verified current inventory.

## How the static inquiry works

The form prepares a message in the visitor's browser. It does not submit to GitHub, upload files, store inquiries or create orders. After previewing the brief, the visitor can copy/download it or choose WhatsApp/email once you configure a destination. Opening WhatsApp does not automatically send a message.

Reference selection lists filenames only. Visitors must attach the actual files in WhatsApp or email. For a future form service, change `contact.js` and the upload explanation together; do not add a secret key to public JavaScript.

The default form uses `method="dialog"` to prevent a no-JavaScript page from posting personal details into a URL. With JavaScript enabled, the submit handler validates the form and opens the inquiry preview.

## Visuals and motion

Includes 16 original AI-generated images, optimized to local WebP files (about 1.2 MB total). These are visual concepts, not photos of actual inventory, completed client work or the real studio. Replace them with actual product photography when available. No invented founder names, reviews, awards, years of operation or sales counts are included.

The main process sequence follows scrolling on larger screens. Stage buttons also work by mouse, keyboard and touch. Reduced-motion users and short viewports get a compact, manually controlled sequence. Core content remains readable if animations are unavailable. Hover effects only activate for devices with fine pointers.

All source files are included and editable. Keep an original backup before customizing.
