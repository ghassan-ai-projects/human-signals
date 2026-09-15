# V4 reader-focus post-fix validation — 2026-09-16

This note records the main-agent browser validation of the bounded fix for
`V4-FINAL-01`, after commit `f8a2215`. The independent browser report in
`browser-review-2026-09-16-final.md` is the historical report that raised the
finding before this fix; it is intentionally preserved as the discovery
record.

## Fresh browser evidence

The exact fully explored `meal:between` route was opened with `Read the route`
in fresh browser contexts.

| Viewport | Caption / objective | Reader | Timeline / controls | Active anatomy |
| --- | --- | --- | --- | --- |
| 1280×800 | x=30..850; clear of reader | x=866..1266 | x=14..734; all visible controls inside viewport | pancreas/liver/brain end at y=549; timeline starts y=584 |
| 1024×768 | x=30..594; clear of reader | x=610..1010 | x=14..608; all visible controls inside viewport | pancreas/liver/brain end at y=520; timeline starts y=552 |

Both contexts had no document overflow. The reader close control and adjacent
`Illustrative draft; not scientifically reviewed` / `Source: no source assigned`
status were visible. Closing the reader removed `reader-focus` and restored the
systems panel.

Screenshots:

- [1280×800 reader](validation-v4-final-reader-1280x800.png)
- [1024×768 reader](validation-v4-final-reader-1024x768.png)

## Regression evidence

- `node scripts/v4-quality-bar.mjs`: **106/106 pass**
- `node scripts/v4-comprehension-check.mjs`: **47/47 pass**
- `node scripts/v4-browser-check.mjs`: **no browser errors**
- JavaScript syntax checks and `git diff --check`: pass

The product remains static and browser-local. Anatomy and physiology remain
illustrative and not scientifically reviewed; this validation does not approve
scientific correctness or publication readiness.

Formal round closure remains pending an independent post-fix browser report.
