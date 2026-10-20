# Rochester Boat Company website

A fast, static, single-page site for Rochester Boat Company (Rochester, IN). No build step: open `index.html` or host the folder on any static host (GitHub Pages, Netlify, Cloudflare Pages).

## What's on it
- Animated sunset-on-the-lake hero with **live Lake Manitou conditions** (temp, wind and a boating score from Open-Meteo, no API key)
- Brand marquee: Crest, Bentley, Mercury, Suzuki, ShoreStation
- Filterable boat and outboard lineup
- **Boat Finder** quiz that recommends a lineup and pre-fills the quote form
- **Payment estimator**
- Interactive ShoreStation lift demo, plus lift & dock services
- Service department, and a **season planner** that highlights the current month
- About section, and a quote/contact form with a tap-to-call button on mobile
- Responsive and accessible, honors reduced-motion, includes LocalBusiness structured data for SEO

## Before going live
- **Quote form:** set `FORM_ENDPOINT` at the top of `script.js` to a form handler URL (e.g. Formspree). Until then the form tells visitors to call.
- **Photos:** add them to `images/` using the filenames in `images/README.md`. Until then each photo spot shows a labeled placeholder.
- Check the lineup, counties served and hours against current offerings.
