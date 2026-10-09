# Islam · Perfume Atelier

Personal perfumery workbench for GitHub Pages, with liquid perfume, solid perfume, diffuser and dilution calculators; searchable study cards; local course file opening; and a formula notebook with proportional scaling and JSON backups.

Run locally: `python -m http.server 4173`, then open http://localhost:4173. Test: `npm test`. No dependencies or build step.

## Publishing

In repository Settings → Pages → Build and deployment → Source, select GitHub Actions. Push to main or run Publish Perfume Atelier. Expected address: https://toubaslam.github.io/Islam_Perfume/.

The repository and website are public, as authorized by the owner for free GitHub Pages hosting. The supplied course materials are included in the public repository and website at the owner’s request. Saved personal formulas remain in browser storage.

## Data and measurements

Formulas save only in this browser on this site address. Export backups regularly; import them to move between devices. The course library includes all supplied PDFs, the Word ebook, calculator workbooks and app screenshots. PDFs have a mobile-friendly page reader, page navigation, zoom and original downloads. The Word ebook opens its corresponding PDF edition for reading while preserving the DOCX download. XLSX previews show original worksheet values and formulas; Numbers files download for opening in Numbers. Duplicate guide/printable files share stored assets. Study cards remain available below the library.

The liquid spreadsheet uses 22 drops/mL; the app makes this estimate adjustable. The reed spreadsheet divides percentage times 100 by batch volume; the app corrects this to volume times percentage divided by 100. The solid spreadsheet mixes fragrance mL with base grams; this app uses grams throughout with editable example percentages. Weight and volume cannot be interchanged without densities. Defaults are arithmetic examples, not validated product recipes or safety assessments. Notebook formulas represent concentrate.

## Refresh the course library

Run `python scripts/build_library.py --source "D:/MyApps/Perfume"` (requires PyMuPDF, Pillow and openpyxl). The generator scans supported documents and images outside this project folder, copies originals, deduplicates identical files and generates page images, covers and `library.json`. Review the manifest before committing new course files. Public deployment copies only app files and `assets/`.
