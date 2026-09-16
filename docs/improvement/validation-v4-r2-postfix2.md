# V4 Round 2 — main-agent verification of the re-review fixes (RR-01..03)

Date: 16 September 2026
Verifier: main agent. Method: the same probe that reproduced the three re-review findings (`coverage/v4-r2/validate-rr.mjs`) re-run against the fixed HEAD, plus a visual check of the 200% layout screenshot, plus the official floor run independently.

## Finding → fix → verification (main agent's own measurements)

| Finding | Fix commit | Verification |
| --- | --- | --- |
| V4-R2-RR-01 Compare Escape stale state | `d62e7f9` | Escape from Compare → `document.activeElement` = `#bAdv` (was `BODY`); route kept `between`; drawing returned to the pathway state (2 active-route lines + 3 faint; was 5 solid stale, 0 faint); legend hidden |
| V4-R2-RR-02 Blood emphasis lost on scene load | `24e2c27` | Blood on, then `openPathway('stress','fast')`: `#r-adrenaline` 4.6px (was 2.6px), 3 bloodlit routes, heart lit, toggle still checked; toggle off clears everywhere |
| V4-R2-RR-03 200% text blocks toolbar | `018e84e` | At 1024×768 @200%: draft ∩ Layers/Hints/Settings = 0/0/0 px² (was 4278/1360/1360); `elementFromPoint` at Layers hits `bLayers` (was a covering DIV); ribbon word overlap 0px (was 63px); screenshot `coverage/v4-r2/probe-rr-03-1024.png` shows the banner as a small non-interactive pill below the toolbar and all controls reachable |

## Official floor, run independently by the main agent on the fixed HEAD

- `node scripts/v4-quality-bar.mjs` → **TOTAL 108/108 pass, 0 fail** (includes the two new durable text-zoom@1024 regression checks added in `018e84e`)
- `node scripts/v4-comprehension-check.mjs` → **TOTAL 47/47 pass, 0 fail**
- `node scripts/v4-browser-check.mjs` → **ERRORS: none**

## Implementer deviations (accepted)

1. `applyBloodLayer` keeps the pre-existing heart `bloodlit` toggle (removing it would have regressed verified V4-R2-06); only the route-state gate was dropped.
2. The bigtext draft banner moved to `top:70px` rather than 84px: measured at 1024 the caption starts at 104px and the banner is ~29px tall, so 84px would have overlapped the caption the round had just fixed.

## Next gate

Narrow closing re-review by the independent reviewer: re-verify RR-01..03 plus a sweep of the earlier seven fixes, fresh pillar scores, and the round verdict.
