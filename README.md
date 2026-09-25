# Muneej Digital — static store with GitHub publishing

Open **SETUP.html** for the illustrated, no-code setup guide.

## What is included

- Responsive storefront, category filtering, search, reusable product.html?product=slug page.
- Add to Cart + Buy Now on every product card and detail page.
- Local-storage cart, quantity controls, subtotals, live badge, removal and clear confirmation.
- WhatsApp checkout to 923044428162, including every item, quantity and total. Opening WhatsApp never clears the cart.
- WhatsApp-only contact page, with no contact form.
- /admin/ local login, visual product/category editors, image preview, add/edit/delete/preview.
- Real GitHub REST publishing: image blob + JSON in one tree/commit; non-forced branch update.
- Relative asset paths work on custom domains, user Pages sites, and repository subpaths.
- HTML, CSS, ES module Vanilla JavaScript, JSON, local WebP images. No package installation, build process, database, or backend is required to host it.

## Admin login

Username: adminhunyaar
Password: Admin$786$

This is a local convenience gate, not server-enforced authentication. Its verifier is public and can be bypassed. No confidential information belongs in this public site. Only your GitHub permission and token authorize publishing.

## First-time setup (no code edits)

1. Extract this ZIP on your computer. GitHub does not extract ZIP files for you.
2. Create a GitHub repository. Upload ALL the extracted files and folders into its root, including admin/, assets/, data/, index.html, product.html, contact.html, and .nojekyll. Upload the contents, not the outer enclosing folder. Keep folder names and case unchanged.
3. For a technically compatible Pages demo: repository Settings → Pages → Deploy from a branch → main → /(root) → Save. If using /docs instead, place every site file under docs/ and choose that folder in Pages and Admin. Make sure index.html is directly in the selected publishing folder. Use HTTPS. See the hosting policy note below before real commercial use.
4. Open the website's /admin/ URL. For a project repository this is https://USERNAME.github.io/REPOSITORY/admin/ — preserve the repository segment.
5. Log in using the username and password above.
6. Click Connect GitHub. Create a FINE-GRAINED token using the provided GitHub link, with a short expiration (7 days recommended), the correct resource owner, Only select repositories → your store repository, and Repository permissions → Contents: Read and write. Metadata read access is added by GitHub. Do not grant Workflows, Administration, or all-repository access. Organization owners may need to approve the token.
7. Back in Admin enter your owner, repository, publishing branch and folder. Paste the token into the password field, then Connect repository. It is sent only to api.github.com over HTTPS; it is never written to the source, JSON, localStorage, sessionStorage, cookies, URLs, or logs. Non-secret repository settings are remembered locally.
8. Add Product → select image → enter details → Publish Product. Products and categories need no manual JSON or code changes. Repeat for categories. The UI shows a commit link and deployment activity. You can check whether the live catalog has caught up.
9. After refresh, tab closure, navigation away from Admin, disconnect or logout, reconnect with a valid token. The fixed login is intentionally separate from GitHub authorization.

## Workflow details

- Three sample product listings are included to demonstrate the layout. They are examples, not supplied sellable products or licenses. Replace/delete them before accepting orders. Images are original generated cover artwork.
- Add at least one category before adding a product. Deleting a category containing products is blocked; first move or delete the products in the visual editor.
- Product slugs are automatically created, suffixing duplicates. Edits preserve existing slugs so links remain stable.
- Prices are in PKR, displayed as Rs. Old price is optional and must exceed the current price. Each cart item is capped at 99 units.
- Images: JPG/PNG/WebP, up to 10 MB and 40 megapixels. Admin decodes and re-encodes a maximum 1600 px WebP image before uploading, stripping metadata. SVG uploads are not accepted. Uploaded filenames are unique.
- Features and What's included use one line per item. Descriptions are plain text, preserving line breaks. HTML entered in a product is displayed as text, never executed.
- Delete removes the item from the active catalog. Old image files are retained to avoid deleting a referenced asset; older commits and images remain in Git history. This is not a confidential asset storage mechanism.
- Do not put paid download files, private license keys or customer data in this public repository. Deliver purchased digital goods privately through your agreed WhatsApp workflow. The store has no payment processing or automatic download fulfillment.
- Admin reloads authoritative catalog data from the selected GitHub branch. It merges against the latest commit and rejects edits if the same item changed. It commits image and JSON together, then moves the branch with force:false. Unrelated repository files are preserved. Concurrent branch changes produce an error rather than overwrite history.
- Only use Admin on a trusted HTTPS origin. Keep token access limited, revoke after use if appropriate, and do not load third-party scripts into the admin. The token is held only in memory, but browser extensions, compromised same-origin scripts or your device can still access it. The local login is not a security boundary.
- Standard GitHub OAuth web token exchange currently requires a client secret. This static application uses an explicitly entered fine-grained token rather than exposing an OAuth secret or relying on a third-party token proxy. No OAuth/PAT credential is built into the files.
- Refresh the catalog before retrying if a network failure leaves publishing status uncertain. The implementation checks the branch after a lost final response to avoid misreporting a successful commit.
- No write to a real repository has been performed for you. A GitHub repository and token were not provided. Publishing must be connected in your deployment.

## GitHub Pages policy and deployment

GitHub's published Pages policy says the service may not be used to run online businesses, e-commerce sites, or websites primarily facilitating commercial transactions. Sending checkout to WhatsApp does not establish an exemption. This code is technically compatible with GitHub Pages; do not interpret that as approval to operate an actual sales store there. Use a static host whose terms allow commerce for production. The source repository and browser GitHub admin can stay the same; configure that host to redeploy when the repository branch changes. No database or server backend is required.

GitHub Pages documentation also lists a soft limit of 10 builds/hour with branch-based publication. A commit may take a few minutes to deploy; a successful commit is not a claim that deployment has finished. Inspect repository Actions if updates do not appear. Admin only needs Contents permission; it does not modify Pages settings or workflow files.

## SEO

The reusable product page sets title and description from the selected JSON record in JavaScript. Search engines that render JavaScript can see them; many social/link preview crawlers do not execute JavaScript and will see generic page metadata. Per-product static crawlable metadata is not guaranteed with a single query-string page. This follows the requested reusable static page architecture.

## Troubleshooting

- Unstyled page or missing images: confirm the entire assets folder was uploaded, preserving subfolders. GitHub web upload accepts dragged folders from your computer.
- Catalog cannot load after double-clicking index.html: open it over HTTP/HTTPS. Browsers restrict fetch for file:// URLs. Use the deployed site, or a local static HTTP server for development.
- 401: token expired or invalid. Reconnect.
- 403: check Contents write permission, organization approval, repository access, branch rules or API rate limits.
- 404: verify owner/repository/branch/folder and that both data files have been uploaded to that branch. GitHub may also return 404 for inaccessible repositories.
- 409/422: branch changed or protection rules disallow direct commits. Refresh and review, or select an authorized publishing branch that permits direct commits.
- Changes committed but not live: verify publishing branch/folder, check Actions and wait for deployment. Click Check live store in the success dialog.
- Token is forgotten after refresh: intentional. Paste it again to reconnect. Never put the token into site files.
- Clear/deletion controls require confirmation. Opening WhatsApp creates a draft only; the customer must send the message.

## Reference documentation

- https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens
- https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps
- https://docs.github.com/en/rest/using-the-rest-api/using-cors-and-jsonp-to-make-cross-origin-requests
- https://docs.github.com/en/rest/git/trees
- https://docs.github.com/en/rest/git/refs
- https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
- https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits

## Validation performed

Checked in local Chromium on desktop and mobile: storefront rendering, cart persistence across refresh and page navigation, quantity-aware WhatsApp message and totals, clear-cart confirmation, admin login, image preparation/preview, product/category add/edit/delete, category deletion guard, stable slugs, escaped content, token disposal and stale-edit rejection. GitHub endpoint responses were simulated for the publishing tests; no real repository was accessed or changed. Core tests also verified non-forced branch writes, root/docs paths, failure handling, and recovery after a lost final response. Optional WebMCP registration is feature-detected and does not affect ordinary browsers.
