# Bryant Lake & Lawn website

A static design template for Bryant Lake & Lawn LLC (Rochester, IN). No build step: upload `index.html`, `styles.css`, `script.js` and the `images/` folder to any web host (GoDaddy cPanel `public_html`, Netlify, GitHub Pages).

## Transitions
- **Intro:** logo reveal on a yellow line, then the screen splits open like a curtain onto the hero
- **Hero:** aerial photo pushes in on load and keeps zooming as you scroll; headline rises line by line
- **Section wipe:** any in-page link sweeps a yellow panel with the logo across the screen, jumps, then lifts away
- **Smooth scrolling:** weighted scroll via Lenis (loaded from unpkg; the site works without it)
- **Headlines:** every section heading rises in word by word
- **Photos:** wipe open from the bottom, then ease from zoomed-in to resting as they scroll
- **Statement:** words light up as you read down
- **Services:** cards stack, each one sinking back and dimming as the next slides over
- **Gallery:** vertical scroll moves it sideways on desktop, swipe on phones
- **Marquee:** speeds up, skews and flips direction with your scrolling
- **Cursor:** custom yellow cursor that grows on links and shows "View" over photos; buttons pull toward it; price and spec cards tilt in 3D
- **Forecast panel:** cells cascade in when you switch lakes; the score ring draws itself
- **Form:** fades out into an animated check mark "Request sent" state
- **Footer:** the BRYANT letters rise one by one
- All motion turns off for visitors who set "reduce motion" on their device

## Placeholders to wire up
- Hero conditions bar: static sample values in `index.html` (`#heroTicker`)
- Rentals forecast panel: `SAMPLE` data at the top of `script.js`
- Quote form: see the "Hook your own submission here" comment in `script.js`
- Social links: the `href="#"` values in the Follow Us section

## Photos
See `images/README.md`.
