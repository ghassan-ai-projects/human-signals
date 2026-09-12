# Anatomy and visual system

## Visual direction

Use a calm, legible educational interface. The body is lightly shaded and simplified; selected sources/targets and routes carry the strongest emphasis. Default application surface is light neutral, with a dark neutral canvas option for contrast if it passes all text/graphics requirements. Avoid a cinematic intro, moving background, decorative glow or continuous particle field.

Base typography: self-hosted or system sans-serif; minimum body text 16 CSS px; line height about 1.5; no text embedded in model textures. Use 4/8 px spacing increments, restrained borders and consistent panel hierarchy. Text measure is approximately 60–75 characters on wide reading panels. Labels must remain readable over anatomy by using solid/opaque backplates where needed.

Use semantic visual roles rather than assigning a fixed color to every hormone. Proposed roles: source violet, target teal, active route blue, inhibition amber, uncertainty slate with dashed styling. Final token colors must pass contrast checks. Every role has an icon, line pattern or text label; a grayscale screenshot still communicates direction, sign and selection.

## Model scope and asset strategy

R1 uses an original schematic body asset or an explicitly licensed simplified model. Start engineering with project-authored primitive meshes and semantic anchors. A scientifically reviewed, simplified model is an acceptable final aesthetic if it meets the anatomy and spatial quality bar; photorealism is unnecessary.

Use GLB for loaded models with mesh names in an asset mapping. Source geometry, export settings and licenses belong in the repository. Do not purchase assets or copy proprietary atlas content without authorization. Asset procurement must never block the 2D renderer or engine work.

One default schematic adult body is used to locate the systems in scope, with clear acknowledgment of simplification and normal anatomical variation. Do not label it a universal normal body. No body personalization, skin-tone inference, sex assignment or clinical anatomy classification is included.

## Coordinate convention

Normalize the body to height 2 world units. Origin is the midpoint of the standing body's bounding box. `+Y` is superior/up; `+X` is anatomical left; `+Z` is anterior/front. Default front camera looks toward the origin from positive Z, so anatomical left appears on the viewer's right. Brain detail uses a separate view root with the same orientation convention and a documented transform to the body anchor.

All exported GLB files must be transformed to this convention at build time. Asset tests verify bounding boxes, anchor coordinates, laterality and camera framing. A route stores anchor IDs and schematic control points; it does not use hardcoded runtime mesh indices.

## Layer and depth behavior

| View | Intro | Standard | Mechanism |
|---|---|---|---|
| Whole body | Brain and relevant glands/organs only; body shell subdued | Context-specific tissue targets and signed feedback | Same anatomy plus optional mechanism callouts; no cluttered molecule cloud |
| Brain | Relevant broad region with a contextual inset | Distinct reviewed source/target regions and named pathway | Reviewed receptor/circuit explanation in adjacent 2D diagram/text |
| Organ inset | Label and function | Relevant subregion/cell-class schematic | Source/target mechanism diagram, explicitly not literal microscopic scale |

Intro can hide secondary labels but never erase a relationship needed to answer the lesson question. Depth transitions preserve selection, camera orientation and cursor. When a required region is absent from the current view, show a “View in brain/body/inset” control and a labeled bridge in the diagram.

## Camera specification

Body front, back and reset presets are required. Brain has default, lateral and reset presets. Preserve each view's last user orientation during a session. Switching view is either an eased transition lasting at most 600 ms or an immediate switch in reduced motion. Do not promise a continuous anatomical zoom through tissue: R1 uses a framed transition between reviewed levels of detail.

Orbit polar limits keep the body upright enough for orientation; label front/back and anatomical left/right. Zoom cannot pass the nearest geometry plane. Fit bounds include selected structures and callouts. Overlay panels must not cause a selected structure to be framed behind them; use the actual unobscured viewport for fit calculations.

## Signal and edge rendering

- Circulation: labeled schematic route, directional pulse, explicit blood-borne legend.
- Portal: distinct patterned schematic route and specific label; do not draw it as generic systemic circulation.
- Synaptic: short discrete pathway emphasis and neural communication label; no blood-vessel particle styling.
- Local: nearby connection/inset with a local-action label.
- Schematic: dashed route plus “schematic communication” label.
- Not applicable: relationship connector or text-only effect; no fabricated travel.

“Stimulates” uses arrowhead plus label. “Inhibits” uses terminal bar plus label. “Modulates” uses labeled diamond/connector with the specific scoped caption. Association is nondirectional dashed context, with no traveling pulse. Feedback is labeled “feedback” in addition to its sign.

Do not use pulse count, route width, organ size or glow intensity to imply hormone concentration or effect magnitude. Trend strips have ordinal labels only. Separate show/hide emphasis from signal existence: an unhighlighted organ is not inactive biology.

## Occlusion and picking

Use depth-aware labels with collision avoidance. If labels collide, prioritize selected region, current source/target and active feedback, then collapse remaining labels into a list. No more than eight visible anatomical labels by default. A persistent list preserves omitted labels.

Selection uses dedicated hit regions if visible geometry is too small. A hit region cannot choose an invisible unrelated organ. Overlapping alternatives expose a short selection list with anatomical names. Transparent shell geometry must not intercept organ selection. Touch exploration must not require precision picking of the pituitary.

## 2D equivalent

The 2D view uses authored `diagramPosition` anchors and the exact semantic frame. It includes source/target groups, signed connectors, timing, stage captions and Why/evidence actions. It is not a screenshot of the 3D canvas. It remains interactive when WebGL is disabled.

An ordered HTML transcript and anatomy tree are available with either renderer. The visual SVG diagram can be treated as an image with concise description when its fully equivalent HTML controls are adjacent, avoiding duplicate screen-reader focus stops. No canvas-only information is required to complete a lesson or question.

## Rendering budgets and quality adaptation

Target body GLB ≤ 3 MB compressed transfer; brain detail ≤ 2 MB; all currently loaded model/texture assets ≤ 8 MB compressed. Combined visible geometry ≤ 120000 triangles, draw calls ≤ 100 and textures ≤ 2048². These are initial hard ceilings; visual quality must be achieved within them or a measured exception documented before release.

Cap device pixel ratio at 1.5 on low-quality mode and 2 on normal mode. Disable real-time shadows and postprocessing in R1. Render on demand when paused; stop particle updates when hidden. Release geometries, materials, controls and listeners on teardown.

If sustained frame time exceeds 50 ms for five seconds, reduce pixel ratio and particle detail once, with no change to lesson state. If the renderer remains unusable or loses context, pause and switch to 2D with a nonblocking message and explicit “Retry 3D.” Do not repeatedly retry in a loop. Quality adaptation must never remove a causal relationship or label.

## Visual acceptance artifacts

Capture front/back body, brain detail, an inhibitory route, a parallel state, Why/evidence, comparison, prediction and reduced-motion screenshots at desktop and 390 px phone widths. Include a grayscale check and a selected-region occlusion check. The scientific reviewer inspects route/anchor placement in both renderers. Record approved asset hashes with the reviewed scientific bundle.
