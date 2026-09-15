# Human Signals v4: Watch the body respond

Date: 13 September 2026
Status: agreed direction, v4 (desktop). Supersedes v1–v3 of this document and the *experience* design in [desktop learning design plan](desktop-learning-design-plan.md).
Keeps: every scientific, evidence, accessibility, privacy and release constraint in `documentation/`. Where v4 changes a documented requirement, §9 flags it.
Inputs: [desktop UI findings](desktop-ui-findings.md), product docs 01–14. No application code was inspected.

---

## 0. The idea in one line

> **Something happens to you. You watch the body respond. Then you explore it and try it yourself.**

The experience is an **atlas-style anatomy app** (a full-window illustrated body, floating panels, smooth zoom) that knows **causality**. Every organ you see can tell you what signal it sends, where the signal goes, and what changes as a result.

The learning loop:

```text
   Trigger ──▶ Watch ──▶ Explore ──▶ Try
 "Something      brain     numbered     Try it? hotspots
  stressful      lights,   hotspots,    What if?
  happens"       body      zoom, ⓘ
                 responds
```

### Agreed decisions

| Decision | v4 |
|---|---|
| Platform | Desktop only (1280–1920 px designed, 1024 px minimum) |
| Screen | **Detailed 2D body illustration fills the window.** A thin floating toolbar, no fixed columns |
| Navigation | Hormone tree (Body → System → Pathway → Signal) as a **translucent, collapsible overlay panel** |
| Tree ⇄ body | Hover or select a node → its organs light up. Click an organ → its node is selected |
| Zoom | **Smooth, continuous and bounded**: body → organ → structure. The surrounding body dims but stays visible, and a mini-map shows where you are |
| Text | **Labels only** by default, varying with zoom level. Everything else sits behind ⓘ cards → *More*, plus one dismissible tip per zoom level |
| Entry | **Triggers** beside the tree: "Something stressful happens", "You skip a meal", "It gets dark" |
| Lessons | **Pathway exploration**: ▶ Play pathway, numbered hotspots in causal order, feedback as a ghost line, optional **Try it?**, one **What if?** per pathway, Fast | Slow toggle |
| Whole-body response | Visible, qualitative **signs** on the illustration (heart quickening, pupils widening, faster breathing, liver releasing glucose). Each sign is tied to a reviewed claim; there are no numbers or gauges (§4.7) |
| Time | A slim, draggable **time ribbon**, `now → seconds → minutes → hours`, shows the body changing, including feedback returning it to calm. Words only, never measured time (§4.8) |
| Depth | **Zoom is depth:** whole body = plain story; organ = pathway names, transport and feedback; cell = small 2D mechanism inset. This replaces the Intro / Standard / Mechanism selector (§2.7) |
| Removed from v3 | Fixed step column, always-visible detail panel, step-based lessons with Continue, separate Expanded mode, Body ⇄ Map lesson switch |
| Rendering | 2D first, atlas-app quality. 3D only if a test proves it teaches more |
| Engagement | Discovery, direct manipulation and seeing consequences. No points, streaks, goals, milestones or celebrations |

---

## 1. Principles

1. **The body is the interface.** Everything happens on the illustration. Panels float, and they collapse or close when they are not needed.
2. **Watch, then explore, then try.** The body shows a response first; understanding comes from poking at it.
3. **Labels, not paragraphs.** On the canvas, text is a name or a single line. Depth is always one deliberate click away.
4. **Order without steps.** Causality is carried by the route itself and its numbered hotspots, not by screens and a Continue button.
5. **Motion is meaning.** A pulse travels a route once and never loops. Speed never encodes biology. Every animation has a still equivalent.
6. **Schematic is honest.** Routes show *that* a message travels and *where* it arrives, never the vessel or nerve it takes.
7. **The learner is in control.** Nothing plays until the learner triggers it, and questions never interrupt.
8. **Honest and calm.** Every claim has evidence one click behind ⓘ → *More*. The draft state is a quiet persistent chip.

---

## 2. The screen

### 2.1 Default view (1440 × 900)

```text
┌───────────────────────────────────────────────────────────────────────────────────┐
│ ╭──────────────────────────────────────────────────╮                              │
│ │ ◉ Human Signals  🔍 Search ⌘K  ☰ Systems  ◧ Layers  ⚙ │                          │
│ ╰──────────────────────────────────────────────────╯                              │
│ ╭─ SYSTEMS ───────────────────╮                ╭────╮                             │
│ │ WHAT HAPPENS IF…            │                │brain│                            │
│ │  ⚡ Something stressful…     │                ╰─┬──╯                             │
│ │  ◔ You skip a meal          │                ╱  ╲                               │
│ │  ☾ It gets dark             │               │ ♥   │                             │
│ │ ─────────────────────────── │               │liver│ ● adrenal glands            │
│ │ ▾ Stress response           │               │     │                             │
│ │   ▾ HPA axis            ▶   │               │ kidneys                           │
│ │      CRH  ACTH  CORT        │                ╲___╱                              │
│ │   ▸ Fast route          ▶   │                                                   │
│ │ ▸ Thyroid                   │                                     ╭──────────╮  │
│ │ ▸ Blood glucose             │                                     │ mini-map │  │
│ │ ▸ Dopamine                  │                                     │  ▯ view  │  │
│ │ ▸ Daily rhythms             │                                     ╰──────────╯  │
│ ╰─────────────────────────────╯                                                   │
│ 💡 Click any organ to zoom in.  ✕       Draft · not reviewed       −  +  ⟲  Front│Back│
└───────────────────────────────────────────────────────────────────────────────────┘
      illustration: full window (tree panel floats over its left edge)
```

### 2.2 Floating toolbar
- Top-left, 48 px tall pill, translucent surface.
- **Contents:** brand · **Search** (`/`, `⌘K`) · **☰ Systems** (toggles the tree panel, `S`) · **◧ Layers** (§2.6) · **⚙ Settings** (depth default, labels, tips, motion, theme, local data, About & sources).
- It never grows beyond one row. Contextual controls appear in the **pathway bar** (§4.2), not here.

### 2.3 The hormone tree: a floating overlay panel
- **Placement:** anchored under the toolbar on the left, 300 px wide, up to the window height minus 120 px, with internal scroll.
  - **Surface:** 88% opaque with a 16 px backdrop blur while the illustration is still, switching to 96% opaque during zoom and playback, so the blur costs nothing while animating.
  - **Collapse:** the panel collapses to a 40 px "Systems" tab on the left edge.
- **Sections:**
  1. **What happens if…** lists the three triggers (§3).
  2. **The tree:** Body → System → Pathway → Signal, as a vertical indented tree. Rows grow and collapse with a short spring (≈ 280 ms). One system is open at a time.
- **Row design:**
  - **System:** colour dot + name + chevron.
  - **Pathway:** name + mini chain glyph + **▶** (plays that pathway).
  - **Signal:** mono abbreviation badge (`CORT`) + name + context line for repeated signals (`Dopamine · movement`).
- **Hover a node** (after 150 ms) → its organs **preview-light** on the body (outline + faint tint). Leaving the row restores the view.
- **Select a node** → its organs **light persistently**, a label appears on each, and ⓘ is available. If a lit organ is outside the current view, the view pans once to include it. Selecting never zooms in on its own.
- **Click an organ on the body** → the matching node is selected and the tree scrolls to it and expands its branch.
  - When the organ maps to several nodes (e.g. the hypothalamus makes CRH, TRH and dopamine), a small ⓘ card lists them. Choosing one selects it.
- **Grammar:** tree indentation means *belongs to*, never *causes*. Arrows exist only on routes.
- **Keyboard:** WAI-ARIA tree model (Up/Down, Right expand or enter, Left collapse or parent, Enter select, Home/End, type-ahead). Focus previews the organs just as hover does, and Enter selects.

### 2.4 Zoom: one continuous, bounded canvas

| Level | Approx. scale | What appears | Labels |
|---|---|---|---|
| **Body** | 1× | Whole-body illustration, organ layer | Organ names (only lit or relevant organs by default) |
| **Organ** | ~3–5× | Organ detail: adrenal cortex / medulla, pituitary anterior / posterior lobes, pancreatic islets indicated, thyroid lobes. Brain switches to a **sagittal cutaway**, labelled "cutaway view" | **Signal names** made or received there (`CRH`, `ACTH`, `cortisol`) |
| **Structure** | ~10–16× | A single structure: anterior pituitary cell region, adrenal cortex layer, islet with alpha/beta cells indicated | **One-liners** ("Releases ACTH into the blood") |

- **How to zoom:**
  - Click an organ → smooth zoom to its organ framing (≈ 550 ms spring).
  - Click a structure inside it → zoom to structure.
  - Trackpad pinch or wheel → continuous zoom.
  - Double-click → zoom in one level.
  - `+` / `−` or the toolbar buttons → step zoom; `0` → whole body.
- **Surroundings:** the rest of the body stays visible, dimmed to about 35%, so the learner never loses context.
- **Detail fades in** at level thresholds (semantic level of detail). It never pops in.
- **Bounded:** below Structure there is one more authored stop, **Cell** (§2.7). It shows a small 2D mechanism inset, not a deeper zoom into the artwork. Zoom stops there with gentle elastic resistance; there is no free zoom to molecules (doc 01).
- **Mini-map** (bottom-right, 120 × 160): a body thumbnail with a viewport rectangle. Clicking it zooms out to the body; dragging the rectangle pans.
- **Views:** Front | Back at the bottom-right, with the persistent caption "Front view · the body's right is on your left".

### 2.5 Text: labels by zoom level, depth behind ⓘ

**Labels**
- Shown only for what is lit, selected or in the current pathway, with a maximum of 8 on screen.
- Others appear on hover or keyboard focus.
- Every label sits on an opaque plate. Leader lines never cross each other or a route.
- Positions are authored per zoom level, with automatic collision avoidance as a fallback.
- **Show all labels** (`L`, settings) is available for review and teaching.

**ⓘ cards**
- Clicking ⓘ on any label opens a 300 px card anchored beside it.
- The card holds a title, **one or two lines (≤ 160 characters)**, an evidence chip, and **More**.
- Esc or clicking outside closes it.

**More** (right-side sheet, 420 px, floating over the illustration)

| Element | Contents |
|---|---|
| Header | The selected organ or signal, or the relationship `Cortisol ⊣ Hypothalamus` |
| Explanation | At the depth of the current zoom level (§2.7); a "Read the deeper version" link shows the next level's text without zooming |
| Why? | The trail (REQ-009) |
| Evidence | Claim-level (REQ-011/012) |
| Glossary | Terms (REQ-018) |
| Also appears in | Contexts for repeated signals |
| Links | Related pathways · Compare with… |

The sheet preserves the camera, selection and playback state. Closing it returns focus to the ⓘ.

**Tips**
- **One tip per zoom level**, plus one on first pathway entry and one on first Try it?.
- A tip shows once, is dismissed with ✕ or by doing the thing it suggests, is never repeated (stored locally), and can be turned off entirely in settings.
- Tips never cover a hotspot, never appear during playback, and wait for about 2 s of idle time.

### 2.6 Layers (◧)
Toggles, several of which can be on at once:

| Layer | Shows | Default |
|---|---|---|
| **Nervous** | Brain, spinal cord, simplified sympathetic trunk; routes that travel by nerve | Off (auto-suggested in nerve-route scenes) |
| **Endocrine** | Glands emphasised: hypothalamus, pituitary, pineal, thyroid, adrenals, pancreatic islets | On |
| **Blood** | The heart as the pump; blood-borne routes emphasised and labelled "carried in the blood"; other routes dim | Off (auto-suggested in blood-route scenes) |

**Guardrail:** the Blood layer does **not** draw an arterial or venous tree in R1. Blood-borne relationships remain schematic routes (§5.3), so a drawn vessel is never confused with a teaching route. Adding real vasculature is a separate decision (§9, D9).

### 2.7 Zoom is depth
The Intro / Standard / Mechanism selector is removed. **How close you look decides how deep the explanation goes.** The facts, evidence strength and correct answers stay the same at every level. Only wording and detail change.

| Zoom level | Depth | Labels and ⓘ text | Example (cortisol) |
|---|---|---|---|
| **Whole body** | Plain story (was *Intro*) | Everyday words, one main idea, no pathway names | "Your adrenal glands release a stress hormone that helps keep energy available." |
| **Organ** | Pathway names, transport, feedback (was *Standard*) | Named signals, route type, feedback | "ACTH in the blood tells the adrenal cortex to release cortisol. Cortisol later brakes the hypothalamus and pituitary." |
| **Structure** | Precise location | One-liners at structure level | "The adrenal cortex is the outer layer. The medulla inside makes adrenaline." |
| **Cell** | Mechanism (was *Mechanism*) | A **small 2D mechanism inset** anchored to the structure, with 3–5 labelled parts | Cortisol crosses a liver cell membrane, binds its receptor inside the cell, and the complex changes which genes are active, so glucose production rises |

**Rules**
- **Reaching Cell:** it is available only where a reviewed mechanism exists. A small "Cell ›" chip appears on the structure label; clicking it or zooming past Structure opens the inset.
- **The inset:** a floating 360 × 260 px 2D diagram. The illustration stays behind it, dimmed. The inset has its own Read-as-text list and evidence chip.
- **Uncertainty survives:** context, uncertainty and "what remains unknown" are reachable at every level through ⓘ → *More* (REQ-010's rule that shallow depth never hides uncertainty).
- **Questions:** Try it? wording follows the zoom level at which it is opened. The assessed idea and the answer do not change (doc 09).
- **Deep links** store the zoom level, and therefore the depth.
- **Educators and advanced learners:** a setting, *Start at organ level*, makes Organ the default framing when a pathway opens.

---

## 3. Entry: triggers

Triggers are the Human States (REQ-007) in plain language. They sit at the top of the tree panel.

| Trigger | State | Pathways it opens |
|---|---|---|
| **Something stressful happens** | Stress | Fast route (nerves → adrenal medulla → adrenaline) · Slow route (HPA axis → cortisol) |
| **You skip a meal** | Meal & fasting | Between meals (glucagon) · After a meal (insulin), reached through the scene's "What about after eating?" link |
| **It gets dark** | Sleep & circadian timing | Light → body clock → pineal gland → melatonin |

**On click:**
1. The trigger chip becomes active, and a one-line caption appears at the top-centre: "Something stressful happens."
2. **The brain lights** (≈ 600 ms fade and glow on the hypothalamus region), labelled "The brain registers it".
3. **The body starts responding:** the fastest pathway of the state plays once as an overview (for Stress, the Fast route pulse in ~3 s: nerves → adrenal glands → heart). Every other pathway of the state is drawn as a faint route.
4. The **pathway bar** appears (§4.2) with **Fast | Slow**, and a tip suggests: "Now follow the slow route: press ▶."

**First visit:** the tree panel is open with the triggers visible, and the tip reads "Start here: pick something that happens to you." There is no tutorial or modal.
**Returning visit:** the top of the panel shows "Continue · HPA axis · 3 of 5 hotspots visited".

---

## 4. Pathway exploration: the lesson

### 4.1 The scene

```text
┌───────────────────────────────────────────────────────────────────────────────────┐
│ ╭ toolbar ╮                          "Something stressful happens"                │
│ ╭ tree ╮                    ╭─ brain (cutaway at zoom) ─╮                          │
│ │ …    │                    │  ① Hypothalamus           │                          │
│ ╰──────╯                    │  ② Anterior pituitary     │╌ ╌ ╌ ╌ ╌?╌ ╌╮  ghost    │
│                             ╰──────────┬────────────────╯             ┊ feedback  │
│                                        │ ACTH · schematic route        ┊           │
│            (body dimmed to 35%)        ▼                               ┊           │
│                                   ③ Adrenal cortex ── cortisol ─▶ ④ Liver          │
│                                        ?  Try it?                   glucose ◇◇     │
│                                                                                   │
│        ╭───────────────────────────────────────────────────────────────────────╮  │
│        │ HPA axis  ▶ Play pathway  ①✓ ②✓ ③ ④ ⑤?  Fast│Slow  What if?  ≡ Read  ✕ │  │
│        ╰───────────────────────────────────────────────────────────────────────╯  │
└───────────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Pathway bar
A floating pill at the bottom-centre, visible only while a pathway is open. It holds:
- pathway name;
- **▶ Play pathway** (Pause while playing);
- **hotspot dots** in causal order, where visited shows a check and a Try it? shows a `?`;
- **Fast | Slow** when the state has both;
- a qualitative time chip ("within seconds" / "over minutes, lasting hours");
- **What if?**;
- **≡ Read the route**;
- **✕** to leave the pathway.

### 4.3 Behaviour

**Entering a pathway** (tree ▶, pathway row, or Fast | Slow):
- The body dims to 35% except the organs involved.
- The camera frames the whole route once (skipped under reduced motion).
- The schematic route is drawn with **numbered hotspots** on each organ in causal order.
- Nothing travels until ▶ is pressed.

**▶ Play pathway:**
- A **pulse travels the route once** from ① to the last hotspot, pausing about 700 ms at each to show its one-line label.
- It **never loops**. Pause stops it where it is; Play resumes; pressing ▶ after it ends restarts.
- Play uses one fixed presentation speed. Time is described only by qualitative chips, and **speed never encodes biology**.
- Play does **not** reveal gated segments (feedback). They stay ghost lines.

**Hotspots:**
- Clicking a hotspot **zooms to that organ or structure** and shows its **one-line label**. The segment leading into it highlights, and ⓘ offers more.
- A visited hotspot gets a **subtle check**.
- Hotspots can be visited in any order, but numbering, the route direction and keyboard order always follow causality.
- **States:** unvisited (outlined number) · focused (ring) · current (filled number) · visited (number + small check) · Try it? (dashed ring + `?`).

**Effects (qualitative, on the body):**
- Effects are shown visually where they happen. For cortisol, a small fixed set of glucose glyphs leaves the liver with the label "glucose made available". For adrenaline, the heart shows one ripple with the label "heart beats faster".
- **Quantity is never encoded.** Glyph counts are fixed and ripple speed is not a heart rate. There are no numbers, and every effect has a text label.

**Feedback as a ghost:**
- Feedback relationships start as a **faint amber dashed line with a `?` badge** at its midpoint and **no end glyph**. Its label reads "Something acts back here".
- It stays a ghost until the learner opens **Try it?** on it or taps **Show me**. The line then solidifies into amber with inhibition bars and its one-line label.

**Try it?** (optional prediction hotspots, REQ-014 as changed in §9):
- Try it? hotspots sit **before** the segment they would reveal.
- **Opening one:** a compact card opens beside it with a one-line question. Candidate organs get dashed rings, and the rest of the body dims further.
- **Answering:** tap one or more organs, then **Check**. Selecting never submits.
- **Result:**
  - Correct organs get a green solid ring and wrong picks a warm amber ring (never red).
  - **The answer animates** on the body.
  - A **one-line correction** specific to the choice appears, with ⓘ Why? available.
- *Skip* closes the card, and *Show me* reveals without an attempt.
- **Recording (doc 09):** a first attempt before the answer was exposed is unassisted. If Play or Show me already revealed it, the attempt is recorded as practice. Opening Why before answering marks the attempt as assisted.

**What if?** (one per pathway, authored):
- Available once the pathway's feedback is revealed. The button reads, for example, "What if the brake stops working?"
- **Setup:** a **"Thought experiment · simplified"** chip appears top-centre, and the feedback line gets a break glyph labelled "blocked".
- **Predict:** the learner predicts first with 2–3 option chips (e.g. *cortisol stays high* · *cortisol falls* · *nothing changes*).
- **Outcome:** an **authored, reviewed** qualitative outcome plays (hotspot badges such as "stays high", with no numbers), followed by a one-line explanation.
- *Restore* returns the normal pathway.
- What if? is never framed as disease, a drug or treatment, and never offers sliders or combinations.

**Fast | Slow toggle:**
- Present when a state has routes of different time scales.
  - **Fast:** nerve route. The Nervous layer auto-enables; the route runs from brain → spinal cord → sympathetic nerves → adrenal medulla, then adrenaline is carried in the blood to the heart. Chip: "within seconds".
  - **Slow:** blood route. HPA axis → cortisol. Chip: "over minutes, lasting hours".
- Switching crossfades the routes (≈ 400 ms) and keeps the camera and visited states.

**Explored:**
- When every hotspot is visited and gated segments are revealed, the pathway bar shows "Route explored" and offers *What if?* and the other route.
- There is no celebration, score or badge.

**Read the route** (≡, `R`), the text equivalent (REQ-021/026):
- A side sheet with a **compact causal diagram** at the top (role-shaped nodes and connectors) and an **ordered list** below. Each item gives source → signal → target, transport, effect sign, qualitative timing and evidence, plus *Go to hotspot*.
- Gated items read "Hidden until you try it · Try it? / Show me".
- Everything available on the body is available here.

### 4.4 Worked example: the flagship scene "Something stressful happens → HPA axis"

*Illustrative textbook-level content for design. It requires scientific review before release.*

| # | Beat | What the learner does | What the body does | Text on screen |
|---|---|---|---|---|
| 0 | Home | — | Whole body, Endocrine layer. Tree panel open with triggers | Tip: "Start here: pick something that happens to you." |
| 1 | Trigger | Clicks **Something stressful happens** | Caption appears; hypothalamus region glows in the head | "The brain registers it" |
| 2 | Body responds | — (plays once after the trigger) | Nervous layer fades in; **Fast route** pulse: brain → spinal cord → adrenal medulla → heart ripple. ~3 s, once. Slow route drawn faint | Labels in sequence: "Nerves signal the adrenal glands" · "Adrenaline released" · "Heart beats faster". Chip: "within seconds" |
| 3 | Choose | Clicks **Slow** in the pathway bar | Nervous layer fades out; HPA route drawn with hotspots ①–④ and a ghost feedback line; body dims except the brain, pituitary, adrenals and liver | Tip: "Numbers show the order. Press ▶ to watch it travel." Chip: "over minutes, lasting hours" |
| 4 | Watch | Presses **▶ Play pathway** | Pulse ① → ② → ③ → ④, pausing ~700 ms at each; glucose glyphs leave the liver; the ghost line stays ghost | ① "Hypothalamus releases CRH" · ② "Pituitary releases ACTH" · ③ "Adrenal cortex releases cortisol" · ④ "Glucose made available" |
| 5 | Explore ① | Clicks hotspot **①** | Zooms to the head; brain cross-fades to sagittal cutaway; hypothalamus and pituitary visible, with a short portal route between them | Organ level: `CRH` label. ⓘ card: "The hypothalamus turns the brain's alarm into a hormone signal, CRH." → More |
| 6 | Explore ② | Clicks **②**, then clicks inside the pituitary | Zooms to structure: anterior vs posterior lobe; anterior lit | Structure level: "Anterior lobe releases ACTH into the blood." Tip: "Scroll out, or click the mini-map to zoom out." |
| 7 | Try it? (optional) | Opens the **?** before ③: "Where does ACTH act?" and taps adrenal cortex | Camera frames the torso; candidate rings on adrenal cortex, liver and thyroid; answer animates as the ACTH route draws to the adrenals | Correct: "ACTH travels in the blood to the adrenal cortex." Recorded as practice, because Play already showed it |
| 8 | Explore ③ | Clicks **③** | Zooms to the adrenal gland: cortex (outer) lit, medulla (inner) dim | Organ level: `cortisol` (cortex), `adrenaline` (medulla, dim). ⓘ: "The outer layer makes cortisol; the inner core makes adrenaline." |
| 9 | Ghost | Hovers the dashed `?` line | Line brightens slightly | "Something acts back here · Try it?" |
| 10 | Try it? feedback | Opens it: "Where does cortisol act to slow its own release? Tap all that apply." Taps the pituitary only → **Check** | Pituitary: green ring; hypothalamus: green ring shown as missed; **answer animates**: the ghost solidifies into two amber routes with inhibition bars to the pituitary and hypothalamus, and a pulse travels each once | "Nearly. Cortisol also acts on the hypothalamus. This is negative feedback." ⓘ Why? "Acting at the top turns down every later step at once." |
| 11 | Explored | — | Pathway bar: all dots checked, "Route explored" | — |
| 12 | What if? | Clicks **What if the brake stops working?**, picks *cortisol stays high* | "Thought experiment · simplified" chip; break glyph on the feedback routes; ② and ③ hotspots get "stays high" badges | "Without the brake, ACTH and cortisol stay high for longer." → Restore |
| 13 | Read | Presses `R` | Side sheet: compact diagram + ordered route | 1 Stressful event → hypothalamus (nerve input) · 2 Hypothalamus → CRH → anterior pituitary (portal blood; stimulates) · 3 Anterior pituitary → ACTH → adrenal cortex (blood; stimulates) · 4 Adrenal cortex → cortisol → liver and many tissues (blood; glucose made available) · 5 Cortisol ⊣ anterior pituitary and hypothalamus (negative feedback) |

### 4.5 Keyboard
- **Global:**
  - `/` or `⌘K` search · `S` systems panel · `L` all labels;
  - `+` / `−` zoom · `0` whole body · arrow keys pan when the canvas has focus;
  - `Esc` closes the topmost card or sheet, then zooms out one level, then leaves the pathway, in that order.
- **In a pathway:**
  - `Space` play/pause;
  - `]` / `[` or `Tab` / `Shift+Tab` move through hotspots **in causal order** (Try it? hotspots sit in sequence);
  - `Enter` opens a hotspot or Try it? · `T` Try it? on the current item · `W` What if? · `F` / `G` fast / slow · `R` Read the route.
- **Candidate organs** in Try it? are focusable in anatomical order (head → pelvis). `Enter` toggles selection, and `Check` is the last stop.
- **Screen readers:**
  - Hotspots announce "Step 2 of 4, anterior pituitary, releases ACTH, visited".
  - During Play, a polite live region reads each label.
  - Organs are also reachable as a list through the tree (Body lens) and Read the route.
- **Focus:** always visible (3 px outline). Floating panels never obscure the focused element (WCAG 2.4.11).

### 4.6 Reduced motion
- **Zoom:** instant camera change with a 150 ms cross-fade.
- **▶ Play:** no travelling pulse. Each segment and its label appear instantly, and the learner advances with `Space` or *Next* in the pathway bar. There is no auto-advance.
- **Organs and effects:** no glow pulse, ripple or glyph motion. Effects are static glyphs with labels.
- **Transitions:** tree rows, cards and tips appear without sliding. Ghost-to-solid is instant, as are What if? outcome badges.
- **Parity:** everything remains fully usable. The reduced-motion path is tested as a first-class flow.

### 4.7 The whole body responds
A response is not only a route. The body **shows signs** of it, so the learner connects the hidden signal to something they have felt.

| Sign | Where on the illustration | Treatment | Appears when |
|---|---|---|---|
| Heart quickening | Heart | Soft ring ripples at a slightly faster cadence than rest, plus the label "heart beats faster". The cadence is illustrative, not a heart rate | Fast route reaches the heart |
| Pupils widen | Eyes (face detail at head zoom) | Pupil shape widens once, with the label "pupils widen" | Fast route, sympathetic effect |
| Breathing quickens | Lungs and airways | Gentle expand–contract, slightly quicker than rest, with the label "breathing quickens" | Fast route |
| Liver releases glucose | Liver | A fixed set of glucose glyphs drifts out, with the label "glucose made available" | Fast route (adrenaline) and slow route (cortisol), labelled by cause |
| Calming | All active signs | Signs ease back to rest one by one; labels read "settling" | Time ribbon moves through recovery (§4.8) |

**Rules**
- **Evidence:** every sign is bound to a **reviewed claim** (source, target, effect, context). Its ⓘ shows that claim and its evidence. A sign without an approved claim is not shown.
- **Always qualitative:** there are no numbers, gauges, meters, bpm or percentages. Cadence, glyph count and size are fixed illustrative values and never scale with "how much".
- **Legibility:** signs are subtle, on at most 4 organs at a time, and never distract from the route in focus. They dim to 50% while a hotspot or Try it? card is open.
- **Reduced motion:** signs become a static state (a ring outline, a widened pupil shape, glyphs placed without motion), and each sign keeps its label.
- **Screen readers:** when a sign appears, a polite live region announces it ("Heart beats faster, from adrenaline"). Signs are also listed in Read the route under *What you would notice*.

### 4.8 Time ribbon with recovery
A slim, draggable ribbon along the bottom edge, above the pathway bar, shows **how the body changes over time**, in words only.

```text
  now ─────── seconds ─────── minutes ─────── hours ─────── calm again
   ●━━━━━━━━━━━━━━━━━━━━◉
   alarm      heart faster     cortisol rises    brake acts    signs settle
```

- **Segments:** qualitative waypoints: `now → seconds → minutes → hours → calm again`. Waypoints are **evenly spaced**, so the ribbon's length never implies proportional time. The caption "Words show order and rough timescale, not measured time" sits under ⓘ.
- **Dragging** the handle scrubs the scene's authored states: which routes are active, which signs are visible, and whether feedback has acted. Releasing snaps to the nearest authored state. Each state has a one-line caption (e.g. *minutes: "cortisol is rising in the blood"*).
- **Recovery is part of the story.** The last waypoint shows feedback returning the body to calm: cortisol's brake reduces CRH and ACTH, and signs settle.
- **Feedback stays gated:** if the ghost feedback line has not been revealed, dragging into *hours* shows a Try it? prompt at the ribbon ("What brings the body back to calm?") and pauses there until the learner tries or taps Show me.
- **Links to Play:** ▶ Play pathway moves the handle as the pulse travels. Dragging pauses Play.
- **Fast | Slow:** the ribbon highlights the waypoints relevant to the selected route (*seconds* for Fast, *minutes–hours* for Slow).
- **Keyboard:** the ribbon is a slider with discrete steps. Left/Right move between waypoints, and each announces its word and caption.
- **Reduced motion:** moving the handle changes states instantly.

---

## 5. The 2D illustration standard

The illustration is the product's face and its biggest design investment.

### 5.1 Style
- **Decided with style frames** (§11 Phase 0). Candidates: flat tonal, semi-realistic medical, and luminous scan. A strong hybrid to include is semi-realistic organ form without texture on a dark stage.
- **Reference quality:** atlas-style anatomy apps, precise and calm at every zoom level.

### 5.2 Structure of the artwork
- **Layered semantic vector groups:**
  1. silhouette;
  2. skeletal hints (orientation only);
  3. organ layer;
  4. nervous layer;
  5. endocrine emphasis layer;
  6. blood-context layer (heart only in R1);
  7. level-of-detail layers per zoom level;
  8. label, route and hotspot overlays (drawn by the app, not in the artwork).
- **Zoom-level detail sets:**
  - Body set;
  - **Organ sets:** brain sagittal cutaway, pituitary with lobes, adrenal with cortex and medulla, pancreas with islets indicated, thyroid;
  - **Structure sets:** anterior pituitary region, adrenal cortex layer, islet (alpha/beta indicated).
- **Views:** front (default) and back where a scene needs it.
- **Binding:** every organ, sub-structure and zoom-level element carries a stable semantic ID matching content anchors (e.g. `anat.adrenal.cortex.left`). Content binds to IDs and framing presets, never to pixel coordinates.
- **Hit areas:** organ shapes, with an invisible minimum 44 × 44 px hit target for small structures at the current zoom. Structures too small to hit at Body level are reached by zooming or through the tree.
- **Organ states:** rest · dimmed (35%) · hover-preview (outline + faint tint) · lit (fill emphasis + 2 px outline + label) · candidate (dashed rotating ring) · correct (green solid ring) · picked-wrong (warm solid ring). Each has a non-colour cue.

### 5.3 Routes, hotspots and effects

| Element | Treatment |
|---|---|
| **Schematic route** | 3 px stroke in the role colour, with a 7 px casing in the stage colour so it floats above the anatomy. Smooth geometric arcs through open space; never traces where a vessel or nerve runs, never branches like anatomy, never passes through organs (one clean arc where crossing the silhouette is unavoidable) |
| Route label | Mono, on an opaque plate: `ACTH · schematic route` on first appearance, then `ACTH · blood` |
| Stimulates | Arrowhead |
| Inhibits | Flat bar |
| Modulates | Diamond + scoped caption |
| **Association** (non-causal) | **Grey dotted line, no end glyph**, labelled "linked with" *(changed from dashed; see §9)* |
| **Unrevealed (ghost)** | **Faint amber dashed line**, no end glyph, `?` badge at the midpoint |
| Feedback (revealed) | Amber solid, routed outside the main chain, bars at the targets |
| **Hotspot** | 28 px circle (44 px hit area) with a number; plate-coloured fill; role-coloured ring when current; small check when visited |
| Try it? hotspot | Dashed ring + `?` |
| Pulse | 8 px core + soft halo in the route colour; travels once |
| Effect glyphs | Small fixed-count pictograms (glucose hexagons, a heart ripple), each with a text label; never scaled by amount |

Schematic explainer (ⓘ in the pathway bar): "Routes show that a message travels and where it arrives. They are not drawings of blood vessels or nerves."

### 5.4 Guardrails
- **Never literal:** no route resembles a vessel, nerve or duct in shape, texture, colour or branching. Reviewers check this in every scene.
- **Never quantitative:** no brightness, thickness, speed, glyph count or pulse size encodes concentration, strength or duration.
- **Grayscale:** order (numbers), direction and sign (end glyphs), ghost state (`?`), lit / candidate / correct states and dimming all read without colour.
- **Reduced motion:** §4.6 applies to every scene.
- **Anatomy review gate:** every organ shape, position, proportion, laterality, zoom-level detail, cutaway and anchor ID passes qualified anatomy review before any scene using it publishes. License and provenance are recorded separately.

### 5.5 When to bring back 3D
Only if a prototype test shows 3D outperforms the 2D illustration on a spatial task without slowing exploration. Otherwise it is not built for R1.

---

## 6. Design tokens

Style-dependent values are locked after the Phase 0 decision. The example values below come from the three style frames.

### 6.1 Floating UI

| Token | Light | Dark | Use |
|---|---|---|---|
| `float-surface` | `rgba(255,255,255,.88)` | `rgba(14,25,30,.88)` | Toolbar, tree panel, pathway bar, ⓘ cards (at rest) |
| `float-surface-solid` | `rgba(255,255,255,.96)` | `rgba(14,25,30,.96)` | The same surfaces during zoom and playback |
| `float-blur` | 16 px | 16 px | Backdrop blur at rest only |
| `float-radius` | 16 px panels · 999 px toolbar and bar · 14 px cards | — | — |
| `float-shadow` | `0 8px 28px rgba(15,27,31,.14)` | `0 8px 28px rgba(0,0,0,.45)` | Floating elements only |
| `ink` / `ink-2` / `ink-3` | `#0F1B1F` / `#4B5C61` / `#7C8C90` | `#E4ECEB` / `#A3B3B5` / `#70828A` | Text |
| `primary` | `#1D5BD6` | `#8DB0FF` | Buttons, selection, focus |
| `sys-*` | stress `#D0643F` · thyroid `#1E9486` · glucose `#B7821A` · dopamine `#7A5BD8` · rhythms `#3C63C4` | lighter variants | Tree system dots only |

### 6.2 Illustration (per candidate style)

| Token | A · Flat tonal | B · Semi-realistic | C · Luminous scan |
|---|---|---|---|
| `stage` | `#EEF3F2` | radial `#F4F7F6 → #E4EAE9` | radial `#0B1A20 → #040A0D` |
| `silhouette` | `#E0E7E6`, no edge | gradient `#D5DDDC / #E8EDEC`, edge `#BFCAC8` | `#0F2B33 → #081419`, edge `#2A5A66` + glow |
| `organ-ramp` | 1 flat tone per organ | 3 tones (highlight / base / shadow) + detail lines at 38% | 1 translucent tone, edge `#3F8494` |
| `organ-dim` | 42% | 55% | 50% |
| `organ-lit` | tone + 2.2 px `primary` outline + 16% halo | same | `#8FDCFF` 55% fill + edge + pre-rendered glow |
| `label-plate` | `#FFFFFF` + soft shadow | `#FFFFFF` + `#C9D3D1` edge | `#0B171C` + `#24444F` edge |
| `leader` | `#8A9A9E` | `#6F8185` | `#3E6D79` |

### 6.3 Roles and routes (style-adjusted for stage contrast)

| Token | On light stage | On dark stage |
|---|---|---|
| `route-message` | `#1B78B8` | `#7CCBFF` |
| `route-feedback` | `#D9870B` | `#FFB547` |
| `route-ghost` | `route-feedback` at 40%, dashed 6 / 6 | same |
| `route-association` | `#8FA3A8`, dotted 1.5 / 5 | `#6F8A91`, dotted |
| `route-casing` | stage colour, 7–8 px | stage colour, 7 px |
| `role-source` / `relay` / `target` | `#6E4FE0` / `#2F6FDB` / `#0E8A62` | `#A98BFF` / `#6FA8FF` / `#43D99A` |
| `state-correct` | `#0E8A62` | `#43D99A` |
| `state-revisit` | `#B8740E` | `#F0C27E` |

### 6.4 Type

| Token | Spec |
|---|---|
| UI | Google Sans Flex → Roboto Flex → system sans |
| Data | Roboto Mono |
| `label-organ` | 13/16, 600, on plate |
| `label-signal` | 12/16 mono, 500, route colour |
| `label-oneliner` | 14/20, 500 |
| `card-title` | 17/22, 600 |
| `card-body` | 14.5/21 |
| `more-title` | 24/30, 600 |
| `tree-row` | 14/18 |

### 6.5 Zoom and level of detail

| Token | Value |
|---|---|
| `zoom-body` | 1× (fit window height minus 48 px) |
| `zoom-organ` | 3–5× (authored per organ) |
| `zoom-structure` | 10–16× (authored per structure) |
| `zoom-max` | Structure framing + 15% elastic |
| `lod-threshold` | Detail layers cross-fade over ±20% around each level |
| `dim-context` | 35% |
| `labels-max` | 8 on screen |

### 6.6 Motion

| Token | Value | Use |
|---|---|---|
| `zoom-spring` | ~550 ms, critically damped | Click-to-zoom, mini-map zoom-out |
| `tree-spring` | ~280 ms | Row grow and collapse |
| `light` | 200 ms fade + 2.6 s gentle pulse (lit only) | Organ lighting |
| `pulse-travel` | Fixed presentation speed; ~800 ms per segment; ~700 ms dwell at hotspots | ▶ Play |
| `ghost-reveal` | 600 ms draw | Ghost → solid |
| `card` | 180 ms, emphasised decelerate | ⓘ cards, tips |
| `route-swap` | 400 ms cross-fade | Fast \| Slow |

Reduced-motion equivalents are defined in §4.6.

### 6.7 Performance budget (added to doc 10)
- **Frame rate:** **60 fps target, 50 fps p95 floor** during zoom, Play and route swaps at 1440 × 900 on a 2020-class integrated GPU (M1 MacBook Air, Intel Iris Xe). Input response ≤ 100 ms.
- **Asset size:** illustration total ≤ 2 MB compressed; ≤ 500 KB loaded for the Body level; zoom-level detail sets lazy-loaded per organ.
- **Rendering:** animate only transform and opacity of overlay layers. The static artwork is cached per zoom level (rasterised tiles or canvas layers). There are no live blur or glow filters during animation; any glow is pre-rendered. Backdrop blur is off while animating.

---

## 7. Copy

- **Triggers:** second person, present tense, everyday situations: "Something stressful happens" · "You skip a meal" · "It gets dark".
- **Labels:** noun or noun + verb: "Adrenal cortex" · "Releases cortisol" · "Glucose made available".
- **ⓘ cards:** ≤ 160 characters, one idea, no jargon without a glossary link.
- **Try it?** is a question in one line; corrections are one line starting with *That's it*, *Nearly* or *Not quite*.
- **Schematic:** "ACTH · schematic route" (first appearance).
- **What if?:** "What if the brake stops working?" with the chip "Thought experiment · simplified".
- **Tips:**
  - Body: "Click any organ to zoom in."
  - Organ: "Click inside to look closer."
  - Structure: "Scroll out, or click the mini-map to zoom out."
  - Pathway: "Numbers show the order. Press ▶ to watch it travel."
  - Try it?: "Tap the organs you think, then Check."
- Never use "happiness chemical", "love hormone" or personalised physiology (REQ-029).

---

## 8. How v4 still meets the product requirements

| Requirement | v4 |
|---|---|
| REQ-001 entry | Trigger, tree, organ click or search reaches a pathway in ≤ 3 selections |
| REQ-002/003 body and brain | 2D body with front/back, bounded zoom, brain cutaway at organ level (rotation: see D5) |
| REQ-004 search | Command palette over signals, synonyms, structures, triggers and pathways |
| REQ-005 journeys | Pathway scenes expose every semantic stage through hotspots and Read the route; absent feedback is stated |
| REQ-006 transport | ▶ Play / Pause / restart; hotspots as previous/next and seek (see D3) |
| REQ-007/008 states and time | Triggers with Fast \| Slow routes; qualitative time chips; no timeline, no invented measurement |
| REQ-009/010 Why, depth | Why in *More*; **depth follows zoom level** (§2.7), with all three reviewed depth variants still authored; uncertainty reachable at every level (see D11) |
| REQ-011/012 evidence | Evidence chip in ⓘ; full claim-level evidence in *More* |
| REQ-013 compare | *More* → Compare with… opens a split body view and aligned table |
| REQ-014 predictions | Optional Try it? hotspots (see D4) |
| REQ-015 transfer | Practice from ☰ menu, using held-out scenes; What if? is not counted as transfer |
| REQ-016 local progress | Visited hotspots, revealed items, attempts and dismissed tips stored locally and erasable |
| REQ-017 links | URL restores trigger, pathway, zoom framing, selection, depth and revealed state, paused |
| REQ-018 glossary | Terms in ⓘ and *More* return to the same camera and selection |
| REQ-019 failures | Placeholder silhouette + tree remain usable if art fails to load; Read the route always available |
| REQ-021/022 access, motion | §4.5 and §4.6 |
| REQ-023 budgets | §6.7 |
| REQ-024/031 privacy, static | Unchanged: no accounts, no telemetry, static hosting |
| REQ-026 parity | Body scene and Read the route share one semantic frame; the illustration never adds claims |
| REQ-020/029 review | Scenes, What if? outcomes, effects glyphs and illustration all pass review gates |

---

## 9. Spec changes this direction requires

| # | Change | Affects |
|---|---|---|
| D1 | Home is the full-window body with floating toolbar, overlay tree and triggers. The five top-level destinations are removed: Human States become triggers; Compare lives in *More*; Practice and About live in ☰ and settings | doc 02 navigation and screen table |
| D2 | **Journeys become exploration scenes** (numbered hotspots, ▶ Play, Read the route) instead of stage strip + playback + step flow | doc 02 journeys, doc 06 presentation layer (the engine's semantic frames remain) |
| D3 | **REQ-006 transport becomes ▶ Play / Pause / restart plus hotspots** (hotspots = previous/next and seek). A speed control is not offered, because speed never encodes biology | doc 01 REQ-006, doc 06 |
| D4 | **REQ-014 predictions become optional Try it? hotspots.** Playback does not pause at checkpoints; the revealing segment stays a ghost until Try it? or Show me; exposure and assisted rules unchanged | doc 01 REQ-014, doc 02 predictions, doc 09 |
| D5 | REQ-002 "rotatable" becomes 2D front/back views plus bounded zoom; REQ-003 brain detail becomes a zoom-level cutaway | doc 01 REQ-002/003, doc 07 |
| D6 | 2D is the primary and only R1 renderer; 3D is conditional on a test | doc 07, ADR-005/008 |
| D7 | **What if?**: one authored, reviewed counterfactual per pathway. *Needs explicit decision*: doc 14 lists "intervention control" as requiring a new specification decision | doc 14, doc 01 exclusions wording, doc 04 claims |
| D8 | **Continuous zoom bounded at Structure**, plus one authored Cell stop (D17), with semantic level of detail | doc 01 R1 boundary, doc 07 |
| D9 | **Layers toggle (Nervous · Endocrine · Blood)**; Blood shows the heart and blood-borne routes, not a vessel tree. A drawn vasculature layer would need a new decision because it conflicts with the schematic-route guardrail | doc 07 |
| D10 | **Connector grammar:** association changes from dashed to **dotted grey**; **dashed faint amber + `?`** now means "not yet revealed" | doc 04 visual semantics, doc 07 |
| D11 | **Zoom is depth (REQ-010 change).** The learner-selected Intro / Standard / Mechanism control is removed; depth is chosen by zoom level (body → organ → cell), with a "start at organ level" setting. The three reviewed depth variants are still required. *Needs explicit decision*: REQ-010 and doc 02 global controls specify a depth selector | doc 01 REQ-010, doc 02 global controls, doc 09 depth rubric |
| D15 | **Whole-body signs** (heart, pupils, breathing, liver glucose) as qualitative illustration states, each bound to a reviewed claim | doc 04 claim coverage, doc 07 visual rules, REQ-008/029 |
| D16 | **Time ribbon** with qualitative, evenly spaced waypoints and recovery, replacing any timeline or lesson-position slider | doc 01 REQ-007/008, doc 06 presentation |
| D17 | **Cell-level mechanism inset** as the one authored stop below Structure | doc 01 R1 mechanism boundary (still 2D, small diagrams) |
| D12 | Learn page removed; progress appears as "Continue" in the tree panel and as visited hotspots | doc 02, doc 09 local results |
| D13 | Desktop-only scope | findings scope |
| D14 | One-time tips and their dismissals added to local data (erasable with progress) | doc 09, doc 10 storage list |

---

## 10. Validation

**Prototype tasks** (6–8 learners; 1280 × 800, 1440 × 900, 1920 × 1080):
1. **First 10 seconds, no instructions:** does the learner click a trigger or an organ within 10 s?
2. Find where cortisol is made using the tree (hover and select), and say which organ lit.
3. Zoom into the pituitary, name its two lobes, then return to the whole body using the mini-map.
4. Follow the HPA axis and explain the order without reading the numbers aloud.
5. **Ghost line:** "What does the dashed line with `?` mean?" The learner must say it has not been revealed yet, not that it is an association.
6. **Schematic check:** "Is this line a blood vessel or a nerve?" Every learner must say no.
7. Complete the feedback Try it? and explain negative feedback in their own words.
8. Explain the difference between Fast and Slow without inventing exact times.
9. Use What if? and say whether it describes a real patient (it must be read as a thought experiment).
10. **Keyboard only:** complete the flagship scene, including Try it? and Read the route.
11. **Reduced motion:** complete the flagship scene.
12. **Screen reader:** Read the route gives the same understanding as task 4.

**Quality bar before propagating beyond the flagship:**
- **Screen and labels:** the illustration is legible and uncluttered at 1280, 1440 and 1920 px, with no more than 8 labels on screen by default and no leader-line crossings.
- **Salience:** the current relationship is the most salient thing on screen at every zoom level (squint test).
- **Grayscale:** passes for routes, hotspots, ghost, lit and candidate states.
- **Performance:** meets the §6.7 budget on the reference hardware.
- **Accessibility:** WCAG 2.2 AA, including focus-not-obscured by floating panels.
- **Review:** anatomy review signed off for every organ, zoom level and cutaway in the flagship. Scientific review signed off for every label, ⓘ card, effect, Try it? correction and What if? outcome.

---

## 11. Delivery

| Phase | Output | Gate |
|---|---|---|
| **0 · Style frames** | Three style frames (flat tonal · semi-realistic · luminous scan) plus the hybrid, all showing **the same v4 flagship view**: full-window body, tree overlay open, HPA pathway with hotspots ①–④, ghost feedback, pathway bar, one ⓘ card. Also one organ-level frame (adrenal cortex/medulla) per style | Owner chooses a style by eye |
| **1 · Illustration brief & commission** (largest investment) | Brief: R1 structure list with IDs, zoom-level sets, cutaways, framing presets, chosen style, light/dark ramps, hit sizes, label rules, route guardrails, layer and ID conventions. Commission a medical illustrator, or build a specified vector set | Anatomy reviewer approves the brief and the first organ set |
| **2 · Interaction prototype** | Placeholder art: full-window zoom with mini-map, overlay tree ⇄ organ lighting, triggers, pathway bar, hotspots, ▶ Play, ghost + Try it?, What if?, Fast \| Slow, Read the route, keyboard, reduced motion | Prototype tasks 1–12 on placeholder art |
| **3 · Engine & system** | Scene renderer (layers, zoom levels, level of detail, cached artwork), label placement, route and hotspot engine bound to semantic frames, text alternative, tokens, performance instrumentation | §6.7 budget; grayscale and a11y review |
| **4 · Flagship scene** | "Something stressful happens" (Fast + HPA) on approved art and reviewed content | Quality bar §10 |
| **5 · Propagate** | "You skip a meal", "It gets dark", thyroid axis, dopamine contexts, compare, practice | Per-scene scientific and anatomy review |

---

## 12. Open decisions

| Decision | Owner input needed |
|---|---|
| Illustration art style | Phase 0 frames |
| What if? steps (D7) | Accept as authored counterfactuals, or defer |
| Rotation requirement (D5) | Accept front/back + zoom in place of rotation |
| Blood layer scope (D9) | Heart + blood-borne routes only (recommended), or a drawn vasculature layer with a stronger route style |
| Tree panel on first visit | Open with triggers (recommended), or collapsed with a single prompt |
| Default layer set per scene | Auto-suggest (recommended), or learner-only |
| Zoom is depth (D11) | Accept removing the depth selector |

---

## 13. Later, after the prototype

These are worth designing only once the flagship scene has been tested.

- **Pathways connecting on the same body.** A route's effect becomes another route's trigger without leaving the scene: cortisol → glucose made available → rising glucose → pancreas → insulin. A small "leads to" chip at an effect hotspot opens the connected pathway on the same body, keeping zoom and time.
- **Everyday-question entry points.** Beyond triggers, plain questions open a scene at the right moment: "Why does my heart pound before an exam?", "Why am I hungry at night?", "Why can't I sleep after screens?" Each is authored to a reviewed scene, never a free-text answer.
- **Compare by overlay.** Two routes on one body at once (e.g. adrenaline vs cortisol), each in its own route style, with a shared time ribbon showing their different timescales. Replaces the side-by-side compare in *More*.
- **Share a moment.** A link that restores the scene, zoom level (and therefore depth), time-ribbon position, revealed state and selection, paused. This is useful for educators and study groups (REQ-017 extension).
