# Ace Apparel Catalogues

Static, no-build web page listing every Ace Apparel uniform catalogue. A QR code points at the deployed URL. Catalogue PDFs live in Google Drive ("Ace Apparel Catalogues"); this site only links to them.

## Structure
- `index.html` – page content; one `<a class="card">` per catalogue, grouped in `<section class="group">`.
- `assets/` – `style.css`, `app.js` (search, category bar), `boot.js` (adds `js` class), brand images.
- `covers/` – local page-2 cover images (600x750 JPG, 4:5). Named after the catalogue.
- `vercel.json` – security headers (CSP etc.) and caching.

## Adding or changing a catalogue
1. Drive: share the PDF as "Anyone with the link – Viewer"; copy the file ID.
2. Export page 2 of the PDF as `covers/<slug>.jpg` (600x750).
3. Copy an existing card in `index.html`:
   `<img src="covers/<slug>.jpg" data-fb="https://drive.google.com/thumbnail?id=<ID>&amp;sz=w500" ...>`
   `data-fb` is the fallback if the local image fails; if both fail, a branded seal card shows.
4. Update the count in the section heading (`<small>` and the `.sr` text) and add a chip if it is a new category.

## Cache busting
`index.html` loads assets as `?v=<first 8 chars of the file's MD5>`. After editing `style.css`, `app.js` or `boot.js`, update the matching `?v=` value:
`md5sum assets/app.js | cut -c1-8`

## Deploy
Push to the Git repo connected to Vercel, or run `vercel --prod`. The CSP only allows Google Fonts and Drive thumbnails; any new external host must be added in `vercel.json`.

## Link trust (no custom domain)
The Vercel project can be renamed for free (Settings > General > Project Name, then Domains) to something short like aceapparel.vercel.app. If you do, update the URL in index.html (og:url, og:image, canonical, JSON-LD) and reprint the QR.

## Moving to a custom domain
Replace ace-apparel-catalogues.vercel.app in index.html (og:url, og:image, canonical, JSON-LD), then reprint the QR code.

## Known limits
- Cards without a local cover show Drive's page-1 thumbnail until a `covers/` image is added.
- Anyone with a Drive link can use Drive's download button. For true view-only, restrict download on each file in Drive.
- Share preview uses `assets/og.jpg` and the domain ace-apparel-catalogues.vercel.app; update both in `index.html` if the domain changes.
