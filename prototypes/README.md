# Design prototypes

Standalone design code for the v4 direction in [`docs/relay-design-direction.md`](../docs/relay-design-direction.md). No build step and no dependency on `src/`; excluded from lint and type-checking.

| Folder | What it is |
|---|---|
| `v4/` | Interaction prototype: full-window body, triggers, pathway exploration, Try it?, What if?, time ribbon, signs. Goal and phases: [`docs/v4-prototype-goal.md`](../docs/v4-prototype-goal.md) |
| `style-frames/` | Phase 0 illustration style frames (A flat tonal · B semi-realistic · C luminous scan · D hybrid) |

## Run

```bash
python3 -m http.server 8765 --directory prototypes
```

Then open <http://localhost:8765/v4/> or <http://localhost:8765/style-frames/>.

## How `v4/` is organised

Classic scripts that share one `window.HS` namespace, loaded in this order:

| File | Owns |
|---|---|
| `js/core.js` | Helpers: `$`, reduced motion, live region, sleep |
| `js/anatomy.js` | Placeholder art: silhouette, organs, brain cutaway, level-of-detail sets, camera regions |
| `js/camera.js` | Pan, zoom, framing presets, mini-map, zoom level |
| `js/overlay.js` | Routes, pulses, end glyphs, labels, hotspots, whole-body signs |
| `js/ui.js` | Cards, tips, lighting, triggers, tree, search, Read the route, layers and settings |
| `js/scenes/*.js` | **Scene data**: routes, pathways, hotspots, gate + Try it?, What if?, time ribbon, signs, info text, cell inset, search, Read the route |
| `js/engine.js` | Scene state machine that plays any scene from its data |
| `js/app.js` | Buttons, keyboard model, first paint |

A new scene is a new file in `js/scenes/` plus its `<script>` tag; the engine should not need changes.
