# Versado logo

The mark is a **V drawn as a square-root sign (√)**, built as a solid block with its depth up and to
the left. It reads three ways in one shape: the V of Versado, a check mark for a correct prediction, and
a root, as in getting to the root of an idea. The depth gives it the hands-on, object-first feel of the
lessons.

## Files

| File | Use |
|---|---|
| `versado-icon.svg` | App icon and in-app logo: white block mark on the brand-blue rounded tile. |
| `versado-icon-square.svg` | Same, full-bleed square, for platforms that round the corners themselves (maskable PWA icon, Apple touch icon). |
| `versado-icon-small.svg` | Small-size cut: heavier flat √, larger in the tile. Use at **24 px and below** (favicon, small UI). Copied to `public/favicon.svg`. |
| `versado-mark.svg` | Full-colour mark without a tile, for light backgrounds: blue front, lighter-blue depth. |
| `versado-mark-reversed.svg` | Mark for dark or photographic backgrounds: white front, translucent white depth. |
| `versado-mark-black.svg`, `versado-mark-white.svg` | One-colour mark (front face only) for single-colour printing, embossing, embroidery and stamps. |
| `versado-lockup.svg`, `versado-lockup-reversed.svg` | Icon + “Versado” wordmark, horizontal. |
| `versado-notification.svg` | Android notification icon: the small cut in white on transparent (Android tints it; colour is ignored). |

Generated icons in `public/`: `favicon.svg`, `pwa-192x192.png`, `pwa-512x512.png`,
`pwa-maskable-512x512.png`, `apple-touch-icon-180x180.png`. The React `Logo` in `@versado/ui` draws the
same geometry inline (`size="xs"` switches to the small cut).

Android (`versado-android/`, rendered from these masters): `mipmap-*/ic_launcher.png` (`versado-icon.svg`,
48–192 px), `mipmap-*/ic_maskable.png` (`versado-icon-square.svg`, 82–328 px), `drawable-*/splash.png`
(`versado-icon.svg`, 300–1200 px), `drawable-*/ic_notification_icon.png` (`versado-notification.svg`,
24–96 px) and `store_icon.png` (`versado-icon-square.svg`, 512 px, for the Play Store listing).

## Colour

| Role | Value |
|---|---|
| Tile / brand blue | `#2d6be6` (solid, no gradient) |
| Mark on tile | `#ffffff`; depth faces white at 80 % (top) and 50 % (side) |
| Mark depth on white | top `#c6d8f9`, side `#8fb2f2` |
| Wordmark ink | `#1b1e23` (`--color-gb-ink`); white on dark |
| Error tint (error dialog only) | tile `#dc2626` |

The tile is brand blue in both light and dark themes.

## Size and space

- **Minimum sizes:** block mark 32 px tall; below that use `versado-icon-small.svg`. One-colour mark 16 px.
- **Clear space:** keep at least the width of the √’s bar end (about 1/8 of the mark height) free on every side;
  for the tiled icon the tile edge is the boundary.
- **Lockup:** the wordmark is Figtree ExtraBold at 66 % of the icon height, starting 56/256 of the icon height
  after the tile. Keep these ratios when resizing.

## Don’t

- Don’t bring back the gradient tile, add shadows, or outline the mark.
- Don’t rotate or mirror the mark: flipped, the √ loses its meaning.
- Don’t drop the bar on top; without it the mark is a generic check mark.
- Don’t use the block mark below 32 px or the depth colours in one-colour printing.
- Don’t recolour the depth faces independently of the front.

## Production note

The lockup SVGs set “Versado” as live text in Figtree ExtraBold, which the app already loads. For print or
any context without the font, convert the text to outlines in a vector editor before use.

## How it was made

Designed with the logo-design skill (github.com/kaankiziltug/logo-design-skill) over four concept rounds:
the final direction combines round 3’s “Root” (√ as a V) and “Block” (extruded V). Every master scores
98–99/100 on the skill’s SVG audit (no live text in the marks, no near-miss angles, no hairlines).
