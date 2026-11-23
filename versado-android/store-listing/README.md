# Play Store listing assets

Graphics for the Versado listing on Google Play, one folder per listing language.

| File | Play Console slot | Spec |
|---|---|---|
| `*/feature-graphic.png` | Main store listing → Graphics → Feature graphic | 1024 × 500, 24-bit PNG, no alpha |
| `*/phone-1.png` … `phone-4.png` | Main store listing → Graphics → Phone screenshots (in this order) | 1080 × 1920 (9:16), 24-bit PNG |
| `../store_icon.png` | Main store listing → Graphics → App icon | 512 × 512 PNG, full square |
| `*/short-description.txt` | Main store listing → App details → Short description | ≤ 80 characters |
| `*/full-description.txt` | Main store listing → App details → Full description | ≤ 4,000 characters |

The text files here are the canonical listing copy: edit them in this folder, then paste them into the
Play Console, so the repo and the store never drift apart.

Folders: `en-US/` (English) and `pt-BR/` (Portuguese, Brazil). In the Play Console, switch the listing
language under **Main store listing → Manage translations** and upload each folder to its language.

## The four screenshots

| # | Screen | English headline | Portuguese headline |
|---|---|---|---|
| 1 | Learn hub, Mathematics track in progress | Learn by doing, one track at a time | Aprenda fazendo, uma trilha por vez |
| 2 | Lesson, Explore stage (Moves add up) | Move it. Watch it change. | Mexa. Veja mudar. |
| 3 | Lesson, Predict stage (a guess, not the answer) | Predict before you peek | Preveja antes de ver |
| 4 | Review, a due spaced check | Reviews arrive right on time | Revisões na hora certa |

Lesson content is authored in English first, so the Portuguese screenshots show Portuguese app chrome
around English lesson text. Re-capture them once lessons are translated.

## Regenerating

`source/phone.html` and `source/feature.html` are the frames (brand-blue background, the peg lattice,
Figtree headlines; copy for both languages lives in each file). To rebuild:

1. Capture the app at 390 × 844 CSS px, device scale 3 (1170 × 2532), light theme, with the app
   language set through `localStorage.i18nextLng` (`en` or `pt`). Save as
   `source/shots/<lang>-1-hub.png`, `-2-explore.png`, `-3-predict.png`, `-4-review.png`.
   The originals came from a local demo account mid-way through the Mathematics track, with the
   lesson stage set through a route override on `/api/learn/modules/*`.
2. Serve `source/` over HTTP and screenshot `phone.html?lang=<en|pt>&n=<1-4>` at 1080 × 1920 and
   `feature.html?lang=<en|pt>` at 1024 × 500, device scale 1, after `window.__ready` resolves.
