# V4 post-fix closure browser review — 2026-09-16

This is the independent post-fix browser confirmation the round scorecard was
waiting on. It re-checks the one remaining finding, `V4-FINAL-01` (narrow
reader-focus composition), after its fix in `f8a2215`, and re-sweeps for any
new P0/P1. Review was browser-driven against the local preview at
`http://127.0.0.1:8765/v4/`. Anatomy and physiology remain illustrative and are
**not** covered by this review.

## Result

No P0 and no P1 findings reproduce. `V4-FINAL-01` is resolved at both required
narrow viewports.

## V4-FINAL-01 — PASS

Route/state: `/v4/#s=meal&p=between&t=4&h=2&c=195,484,0.95&r=1`, `Read the route`
open (reader-focus active).

| Check | 1280×800 | 1024×768 |
| --- | --- | --- |
| Document horizontal overflow | none (scrollWidth = innerWidth = 1280) | none (scrollWidth = innerWidth = 1024) |
| Reader panel bounds | x = 866..1266 (14px inset) | x = 610..1010 (14px inset) |
| Reader content clipped horizontally | 0 elements past panel right | 0 elements past panel right |
| Reader scroll for long content | `overflow-y: auto`, reachable | `overflow-y: auto`, reachable |
| Evidence + source status in reader | `Illustrative draft; not scientifically reviewed` / `Source: no source assigned` present | present |
| Close control | visible, inside viewport (right 1255) | visible, inside viewport (right 999) |
| Systems panel while reader open | collapsed out of the composition | collapsed out of the composition |
| Close reader restores workspace | reader-focus removed, systems panel restored, no overflow | reader-focus removed, systems panel restored, no overflow |

Screenshots at each width show the whole-body model centred and unclipped, the
objective and current step readable, the timeline clear of the active anatomy,
and all pathway controls inside the viewport.

## Regression checks (green)

- `node scripts/v4-quality-bar.mjs`: **106/106 pass**
- `node scripts/v4-comprehension-check.mjs`: **47/47 pass**
- `node scripts/v4-browser-check.mjs`: no browser/console errors

## Scope and gates

The product remains static and browser-local. This review confirms layout,
state, reachability, and honest wording only. Scientific and anatomical
correctness of the physiology and artwork remain separate, unclosed review
gates and are not validated here.
