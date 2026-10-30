# TrackEcom brand kit

## The idea

TrackEcom's mark is not a map pin, a route line or an abstract swoosh. It is the thing our customers handle all day: **a parcel**.

- **A kraft box seen from above.** Its edges are slightly uneven, like a real box that has travelled.
- **Hand-applied tape with torn ends.** The two strips are a little crooked, the way a person tapes a parcel, not a machine.
- **The tape forms ⵜ**, the letter *T* in **Tifinagh**, the Amazigh alphabet used across Algeria. Every sealed parcel quietly carries our initial in a local script.
- **A red ink "checked" stamp** in the corner: the order has been confirmed and the parcel is ready to go, which is the moment TrackEcom exists for.
- **A stencil wordmark**, cut like the lettering sprayed on shipping crates and warehouse shelves.

The result should feel like a warehouse in Algiers or Oran, not like a generic tech start-up.

## Files

All files live in [`assets/brand`](assets/brand).

| File | Use |
|---|---|
| `trackecom-logo.svg` | Primary horizontal logo on light backgrounds |
| `trackecom-logo-dark.svg` | Primary horizontal logo on dark backgrounds |
| `trackecom-stacked.svg` / `-dark.svg` | Stacked logo with the tagline, for splash screens, packaging and print |
| `trackecom-wordmark.svg` / `-dark.svg` | Stencil wordmark only |
| `trackecom-icon.svg` | The parcel on its own: app icon, favicon, avatar, packing stickers |
| `png/*.png` | Raster exports (icon 192 and 512 px, logo, stacked) |
| `generate.py` | Script that regenerates every SVG |

The SVGs are self-contained: the letters are converted to outlines, so they render the same everywhere without installing a font.

## Colours

| Name | Hex | Role |
|---|---|---|
| Kraft | `#C98F55` | The parcel; warm surfaces and illustrations |
| Kraft Shadow | `#A8723F` | Folds, secondary illustration tone |
| Tape Green | `#16523F` | Tape, "ECOM" in the wordmark, primary buttons |
| Tape Green (dark mode) | `#3FA37E` | "ECOM" on dark backgrounds |
| Stamp Red | `#C8382B` | Confirmation stamp, alerts and status highlights |
| Ink | `#1C1A17` | Text and "TRACK" in the wordmark |
| Paper | `#F6EEE1` | Backgrounds, text on dark |

Green and red nod to Algeria without copying the flag. Use Stamp Red sparingly: it means "confirmed" or "needs attention".

## Typography

- **Wordmark:** Inter Display Black with stencil cuts (SIL Open Font License). Use the SVG, never retype it.
- **Interface:** Inter (Regular, Medium, Bold).
- **Arabic:** IBM Plex Sans Arabic or Noto Kufi Arabic.
- **Tifinagh:** Noto Sans Tifinagh, for any Amazigh text.

## Usage rules

- Keep clear space around the logo equal to the width of one strip of tape on all sides.
- Minimum size: icon 24 px, horizontal logo 140 px wide.
- Keep the tape crossing centred so it reads as ⵜ. Do not straighten the tape, recolour the parcel, or add shadows and gradients.
- The parcel can stand alone on packing stickers, delivery slips and the app icon.
- Tagline: *Livraison suivie, partout en Algérie* (FR) · *توصيل متتبَّع في كل أنحاء الجزائر* (AR) · *Tracked delivery, everywhere in Algeria* (EN).
