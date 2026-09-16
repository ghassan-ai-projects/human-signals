# V4 Round 2 — main-agent verification of RR-04 and RR-05

Date: 16 September 2026
Verifier: main agent. Method: the implementer's probes re-run by the main agent plus the main agent's own measurement probe (`coverage/v4-r2/probe-thought-200.mjs`), plus the official floor run independently.

## RR-04 — draft banner vs orientation line at 200% (fix `c1fc014`)

The re-review's closing pass found the RR-03 banner relocation had traded the toolbar collision for a collision with `.orient` (5,744px², covering "…IS ON YOUR LEFT" at both widths). Fix: disjoint top-right bands at bigtext — toolbar (14–62) → draft (66–95) → orient (99–114, capped 10px, pointer-events:none) → caption (118+).

Main-agent verification (`coverage/v4-r2/probe-rr-04.mjs` re-run): **ALL PASS** at 1024×768 and 1280×800 — draft∩orient 0px², orient∩caption 0px², draft∩caption 0px², all five toolbar buttons hit-test to themselves, vertical gaps ≥4px, orient text intact, zero console errors.

## RR-05 — thought tag under the caption / What-if card at 200% (fix `31fab06`)

Raised by main-agent measurement during RR-04 verification (the implementer had disclosed it as pre-existing): at 200% with What if? open, `#thought` ∩ `#caption` = 3,130px² (text-on-text, 1024×768) and ∩ `#wiCard` = 17,401px² / 10,969px². Fix: the tag gets its own bottom-left band at bigtext (between the panel and the ribbon: `[16,546→146,576]` at 1024, `[16,578→146,608]` at 1280, 10px, two lines).

Main-agent verification: implementer's `probe-rr-05.mjs` re-run — **ALL PASS** (tag ∩ panel/ribbon/caption/card/mini/zoomer/lvl-chip all 0 at both widths, gaps ≥4px, Try-card state keeps the tag hidden); the main agent's own `probe-thought-200.mjs` now measures **0 ∩ caption and 0 ∩ card at both widths** (was 3,130/17,401 at 1024). `probe-rr-03.mjs` and `probe-rr-04.mjs` still ALL PASS.

## Official floor, run independently by the main agent on `31fab06`

- `node scripts/v4-quality-bar.mjs` → **TOTAL 110/110 pass, 0 fail** (text-zoom@1024 now 4/4: caption/panel, draft-vs-buttons+ribbon-words, draft-vs-orient, thought-tag checks)
- `node scripts/v4-comprehension-check.mjs` → **TOTAL 47/47 pass, 0 fail**
- `node scripts/v4-browser-check.mjs` → **ERRORS: none**

## Disclosed, accepted residuals (not chased, with reasons)

1. At 1024 @200% the 10px orient line's left tail visually passes over the edge of the "Brain" hotspot pill (304px², down from ~2,270px² before the fix family); the line is pointer-events:none so the control stays hit-testable.
2. After answering a What if?, the scaled result card grows tall enough to cover the right side at 1024 — pre-existing card growth at 200%, not a placement defect of the tag.

## State for the final pass

All 12 committed fixes (V4-R2-01..07, RR-01..05) are main-agent verified with the floor green. The independent reviewer's final narrow pass decides the round verdict and fresh pillar scores.
