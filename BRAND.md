# TrackEcom brand kit

## The idea

The TrackEcom mark is a **T drawn by hand**, as if someone sketched a delivery route on paper.

- The **crossbar** is the journey from the seller (the small hollow dot on the left) to the hub.
- The **stem** is the road to the customer: solid for the distance already covered, **dotted** for the part still in transit.
- The **red dot with a halo** is the destination, pulsing like a live location.
- A faint **pencil under-stroke** sits behind the ink, and the wordmark carries a hand-drawn marker underline. These small imperfections are deliberate: they give a precise logistics product a human, local feel.

## Files

All files live in [`assets/brand`](assets/brand).

| File | Use |
|---|---|
| `trackecom-logo.svg` | Primary horizontal logo on light backgrounds |
| `trackecom-logo-dark.svg` | Primary horizontal logo on dark backgrounds |
| `trackecom-stacked.svg` / `-dark.svg` | Stacked logo with the tagline, for splash screens and print |
| `trackecom-wordmark.svg` / `-dark.svg` | Wordmark only, where the icon is already shown nearby |
| `trackecom-icon.svg` | App icon, favicon, avatar |
| `png/*.png` | Raster exports (icon 192 and 512 px, logo, stacked) |
| `generate.py` | Script that regenerates every SVG |

The SVGs are self-contained: the letters are converted to outlines, so they render the same everywhere without installing a font.

## Colours

| Name | Hex | Role |
|---|---|---|
| Atlas Green | `#0E5C3F` | Icon background, primary brand colour |
| Ecom Green | `#14774F` | "Ecom" in the wordmark, primary buttons |
| Mint (dark mode) | `#4FC08D` | "Ecom" on dark backgrounds |
| Pulse Red | `#E2463A` | Destination dot, underline, alerts and live states |
| Ink | `#14211B` | Text |
| Cream | `#FFF4E2` | Route stroke, text on dark |
| Sand | `#F3E3C3` | Pencil sketch, warm surfaces |

Green and red nod to Algeria without copying the flag. Use Pulse Red sparingly: it means "live" or "needs attention".

## Typography

- **Inter** (Bold for headings and the wordmark, Regular/Medium for UI), licensed under the SIL Open Font License.
- **Noto Kufi Arabic** or **IBM Plex Sans Arabic** for Arabic interfaces.

## Usage rules

- Keep clear space around the logo equal to the height of the red dot's halo.
- Minimum size: icon 24 px, horizontal logo 120 px wide.
- Do not recolour the route, stretch the mark, add shadows or place the light logo on a busy photo.
- Tagline: *Livraison suivie, partout en Algérie* (FR) · *توصيل متتبَّع في كل أنحاء الجزائر* (AR) · *Tracked delivery, everywhere in Algeria* (EN).
