# Arabic and display preferences

The header and sign-in screen offer English / العربية and light / dark appearance.
Preferences are stored in this browser. Switching language does not reload the
page or change notebook units, saved records, ingredient amounts or filter IDs.

`preferences.js` translates visible interface text and new dynamic content using
the local `ar.json` dictionary, with reviewed Modern Standard Arabic terminology
and interface copy in `ar-glossary.js`. The longer course and Materials entries
were initially machine translated; they remain available for wording review.
The website does not contact a translation service at runtime.

Search accepts English and Arabic. Arabic uses a right-to-left layout. Botanical
names, source files, original artwork, chemical identifiers and user-authored
notebook text keep their original form. Original PDF and ebook downloads are
preserved rather than replaced by translated editions.

To correct a translation, add or update its exact English key in
`ar-glossary.js`. This takes precedence over the generated dictionary.
