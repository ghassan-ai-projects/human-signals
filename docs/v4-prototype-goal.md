# Goal: finish the v4 interaction prototype

Date: 15 September 2026
Owner of the direction: [relay-design-direction.md](relay-design-direction.md) (v4)
Lives in: [`prototypes/v4/`](../prototypes/v4/) — plain HTML, CSS and JS, no build step, opened directly or published as an artifact.

## The goal in one line

> **All three triggers work end to end on one illustrated body, at the quality bar of the flagship scene, and a first-time learner can trigger, watch, explore and try each one without instructions.**

"Done" means §11 Phase 2 of the design direction (interaction prototype on placeholder art) is complete for every scene in §3, the prototype tasks in §10 can be run on it, and nothing on screen says "not in this concept" for a trigger.

## Standing rules for every phase

1. **One commit per phase**, on the `design/v4-prototype` branch. A phase is committed only after it is run in a browser with no console errors.
2. **Spec first.** Behaviour follows the design direction. Where the prototype has to go beyond it, the change is written back into the doc in the same commit.
3. **Honest science.** Textbook-level content only, marked "Illustrative draft · not reviewed science". No numbers, gauges, doses, diseases or treatments. Quantity is never encoded by brightness, speed, size or count.
4. **Every animation has a still equivalent** (reduced motion is a first-class path), and everything on the body is also reachable by keyboard and in Read the route.
5. **Each phase leaves the prototype better to look at and to use**, not only more complete. Every phase ends with a short "what I'd improve next" note in its commit message body.

## Phases

| # | Phase | What ships | Done when |
|---|---|---|---|
| 0 | **Bring it home** | Design docs, style frames and the stress prototype committed to the repo; this goal | Files open from the repo exactly as the published artifacts do |
| 1 | **Scene engine** | The single file split into `index.html`, `css/`, `js/`; every scene-specific rule (hotspots, routes, Try it?, What if?, time ribbon, signs, search entries, Read the route) moved into scene data. Behaviour unchanged | Stress scene passes the same run-through as before; adding a scene needs data, not engine edits |
| 2 | **Visual pass: hybrid style D** | Organ form shading (highlight/base/shadow ramp, one light direction), organ detail lines, better silhouette, pre-rendered lit glow, route draw-on, pulse trail, arrival ripple, ghost-to-solid reveal draw, trigger atmosphere on the stage | Side-by-side screenshots before/after; routes and hotspots remain the most salient thing on screen (squint test); grayscale still reads |
| 3 | **"You skip a meal"** | Pancreas with islet detail, muscle and fat targets; *Between meals* (glucagon → liver) and *After a meal* (insulin → liver, muscle, fat) routes; glucose feedback ghost + Try it?; What if? the liver couldn't answer glucagon; signs (hunger, liver releases glucose, tissues take up glucose); ribbon `after eating → hours later → between meals → liver responds → steady again` | Full run-through of the scene, mouse and keyboard |
| 4 | **"It gets dark"** | Eyes as light sensors, body clock (SCN) and pineal gland in the brain cutaway; light → clock → pineal → melatonin route; melatonin acts back on the clock (modulates ◇); What if? the lights stay on; signs (pupils widen in dim light, drowsiness builds, body cools slightly); stage darkens with the ribbon `dusk → evening → night → early morning → morning light` | Full run-through of the scene, mouse and keyboard |
| 5 | **Connected and complete** | *More* side sheet (Why trail, evidence, glossary, also appears in, related pathways); "Leads to" chips joining scenes on the same body (cortisol → glucose → *After a meal*); compact causal diagram in Read the route generated from scene data; Try it? wording follows zoom level | Every ⓘ reaches More; every scene is reachable from another |
| 6 | **Remembered and shareable** | Local progress (visited, revealed, attempts, dismissed tips) with *Continue* at the top of the panel and *Erase progress* in settings; deep links restoring trigger, route, zoom framing, time and revealed state, paused | Reload restores progress; a copied link reopens the same moment |
| 7 | **Craft and access** | Tree keyboard model complete (Home/End, type-ahead, Enter select), 150 ms hover preview, mini-map drag-to-pan, double-click zoom, focus never hidden under floating panels, label/leader collision pass at 1280/1440/1920, grayscale check, reduced-motion walk-through of all three scenes | §10 tasks 1–12 can be run on the prototype; no console errors at any of the three sizes |
| 8 | **Publish and evidence** | Updated artifact, screenshots per scene per zoom level in `docs/design-review-evidence/v4/`, a short review note listing what still needs owner decisions and scientific/anatomy review | Artifact link shared; evidence committed |

## Out of scope (named, so they are not silently dropped)

- Real commissioned anatomy art (§11 Phase 1) — placeholder art keeps improving, but it is not the final illustration.
- Back view, thyroid axis and dopamine scenes, Practice, Compare by overlay — §11 Phase 5 / §13, after the three triggers are tested.
- Porting into the React app in `src/` — §11 Phase 3, after owner decisions D7 and D11.

## Decisions still open (owner)

- Illustration style (Phase 0 frames; the prototype adopts D · Hybrid as a working choice).
- D7 What if? as authored counterfactuals.
- D11 Zoom is depth (removes the depth selector).
