# V4 Round 2 — main-agent validation of opening findings

Date: 16 September 2026
Validator: main agent, per the quality-bar rule that a finding is reproduced locally before implementation.
Method: Playwright probes run against `http://localhost:8765/v4/` (fresh browser contexts; deterministic waits for `HS.E.route` + pathway bar before every interaction; toast content compared before/after keypresses so a lingering restore announcement is not mistaken for feedback). Probes: `coverage/v4-r2/validate-findings.mjs`, `-findings2.mjs`, `-findings3.mjs` (gitignored). A first pass raced the share-link restore flow on two findings; the clean-context second pass is authoritative and is what is recorded below.

## Results

| Finding | Reproduced | Evidence (fresh context) |
| --- | --- | --- |
| V4-R2-01 Escape ignores popovers, exits pathway | **Yes** | Layers popover open on `#s=meal&p=between`, Escape → popover still open **and** `HS.E.route` became `null` (pathway exited underneath) |
| V4-R2-02 Escape from Try / What if? / Rebuild drops focus | **Yes (all three cards)** | focus inside card → Escape → `document.activeElement` = `BODY` for `#tryCard`, `#wiCard`, `#rbCard` |
| V4-R2-03 200% base text mid-session overlaps caption at 1024×768 | **Yes** | root font-size set to 32px after pathway entry, no resize event → `#panel` ∩ `#caption` = **302 × 93 px**; caption "You skip a meal / Glucose in the blood starts to fall" largely hidden |
| V4-R2-04 search "pupils" dead-ends | **Yes** | palette result list: "No match. Try a signal like ACTH, an organ, or 'stress'." |
| V4-R2-05 ribbon slider Home/End no-ops | **Yes** | fresh context, handle focused (`aria-valuenow` 0) → End → 0, Home → 0 |
| V4-R2-06 Blood layer has no measurable stage effect | **Yes** | `#o-heart` computed opacity 0.32 before and after toggle (classes `org dim lit` — `lit` cannot beat `dim`); no route path property changed |
| V4-R2-07 T and W silently dead on stress:fast | **Yes** | T opens no `#tryCard`, W opens no `#wiCard`; toast text unchanged across both keypresses (only the pre-existing restore announcement was visible) |

Notes from validation that refine the fixes:

- `available()` in `core.js` returns true for `document.body` (it has client rects), which is why
  `layers.opener()` can capture the stage as the restore target even on click paths — fixing the
  opener alone is not enough; body/html must be excluded as focus-restoration targets.
- The ribbon finding is state-sensitive: a probe that reuses a page where the gate was revealed
  sees `aria-valuenow` 4 from hash restore and can misread End as working. Regression probes must
  use a fresh context and assert from a known `aria-valuenow`.
- On stress:fast the visible toast after T/W is the share-link restore announcement
  ("Opened a moment, paused"), not feedback; probes must diff toast content around the keypress.

All probes exited with zero console errors/pageerrors, matching the opening review.

## Disposition

All seven findings validated → all seven go to implementation as bounded, separately committed
changes, in dependency order: interactivity Escapes and focus (01, 02), ribbon keys (05), honest
no-target feedback (07), text-scale observer (03), Blood layer visibility (06), search body signs (04).
