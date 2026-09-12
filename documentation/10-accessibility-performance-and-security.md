# Accessibility, performance, reliability and privacy

## Accessibility target

Implement against WCAG 2.2 AA as the target standard, with actual conformance assessed before public claims. This specification has not verified the current standard text externally. During implementation, use the applicable published standard or approved project reference when access is authorized. Automated scores alone do not establish conformance.

Required product behavior:

- Complete all R1 lessons, Why/evidence flows, comparisons and assessments with keyboard only and in 2D.
- Semantic landmarks/headings, labeled inputs, logical tab order, visible focus and no keyboard traps outside intentional dialogs.
- Text contrast at least 4.5:1 for normal text and 3:1 for large text; meaningful control boundaries and graphics at least 3:1 against adjacent colors.
- All interactive controls have a 44 CSS px target or equivalent generous spacing; small anatomy targets have list alternatives.
- Color is never the only cue for evidence, effect sign, answer feedback or track membership.
- Do not announce per-frame animation. A polite live region announces meaningful step changes and feedback. User-triggered next/previous reads the step's heading/caption; during play updates are throttled to at most one per two seconds and remain interruptible.
- Reduced motion disables traveling particles, automatic camera motion and autoplay; manual steps remain complete.
- A visible pause control is always available for animation. No flashing sequences or audio-only content.
- Reflow at 320 CSS px and 200% zoom; font enlargement and text spacing do not hide content.
- Dialog focus is contained and restored; panel navigation does not unexpectedly move focus on background animation.
- Comparison cells announce row label plus both signals. Timeline sliders have a label, keyboard increments and human-readable value text distinguishing lesson position from biology.

Manual verification: keyboard on desktop; VoiceOver with Safari on macOS and iOS; one additional screen-reader/browser combination available to the test environment. Record exact versions and any untested combination. No pass claim based solely on an unavailable platform emulator.

## Browser support

Release support is the current and previous stable major releases of Chrome, Edge, Firefox and Safari, plus current/previous iOS Safari and current Android Chrome at release time. Record exact tested versions in the release manifest or QA report. WebGL2 is an enhancement prerequisite for 3D, not an app requirement. Feature detection, not user-agent sniffing, selects fallback.

No native desktop/mobile binary, installation or app-store distribution is part of R1. The web app works through a shareable HTTPS URL. No service worker or guaranteed offline mode; already loaded lessons can continue in memory after a network loss, while new assets show recoverable load errors.

## Performance budgets

Budgets apply to a production build, cold cache, no development tools, and the actual shipped content. Report medians and worst runs from five repeats unless a percentile is specified. Use a representative baseline laptop with integrated graphics and a mid-range Android phone; record exact devices/browser/viewport and network conditions.

For repeatable automated lab tests, use a fixed CI runner/browser with 4× CPU slowdown and simulated 10 Mbps down, 1 Mbps up, 100 ms round-trip network latency. Lab results supplement physical-device testing; they do not prove phone GPU performance.

| Measure | R1 threshold | Verification |
|---|---|---|
| Initial HTML/CSS/JS shell transfer | ≤350 KB gzip equivalent, excluding lazy 3D and content | Build report |
| Lazy 3D JavaScript transfer | ≤500 KB gzip equivalent | Build report; identify decoders separately within cap |
| Manifest and search index | ≤100 KB gzip equivalent | Build artifact size |
| Complete R1 scientific bundle | ≤1.5 MB gzip equivalent | Build artifact size |
| LCP in the fixed lab profile | ≤2.5 s median; ≤3.5 s worst of five | Production-page performance trace |
| Cumulative layout shift | ≤0.1 per tested navigation | Production-page trace |
| Scripted interaction latency | ≤200 ms p95 for search, Why, depth, selection and stepping | At least 30 interactions per path |
| Search response after input | ≤100 ms p95 excluding deliberate debounce ≤100 ms | Largest released catalog fixture |
| Full frame projection | ≤8 ms p95 at max supported 2000 events/4 tracks | Baseline device benchmark |
| 3D animated frame time | ≤33 ms p95 over a 30-second Stress segment on baseline laptop | Browser/GPU trace |
| Mobile 3D quality floor | ≤50 ms p95 after quality adaptation | Physical phone trace; otherwise default to 2D for that session |
| Idle paused rendering | No continuous animation/render loop | Performance trace after 5 seconds idle |
| Memory stability | No continuing growth across 20 body/brain/lesson transitions; post-GC retained heap ≤20 MB above warmed baseline | Automated/browser diagnostic measurement |

Budgets are release criteria, not claims that this stack already achieves them. If dependency size threatens the shell budget, ensure all Three/R3F code is truly lazy, inspect chunk imports and simplify before increasing the budget. Do not exclude a necessary model or content request from the claimed user-perceived readiness time.

## Reliability behavior

| Fault | Required behavior |
|---|---|
| Network absent at first load | Browser may fail before shell; deployment offline behavior is not promised |
| Manifest or bundle fetch fails after shell | Visible retry state with navigation/help, no infinite spinner |
| Model download fails | Pause and offer/use the full 2D lesson |
| WebGL unavailable or context lost | Automatic 2D fallback; preserve cursor and selection; explicit retry |
| Local storage denied/full/corrupt | In-memory operation and one nonblocking save notice |
| Unknown/retired URL ID | Explanation and Home/search/replacement actions, no silent remapping |
| Bundle hash or schema mismatch | Fail safely for that content version; retry against a fresh manifest |
| Background tab | Pause; no skipped checkpoints or time jump on return |
| Browser window resize/orientation change | Reflow; preserve cursor, selection and question state |
| Concurrent tabs update progress | Re-read on storage event, union completion/exposure, merge attempts by stable attempt ID; preserve active in-memory question |

Assign each attempt a browser-generated random ID for merge deduplication; it is local and never transmitted. Resolve conflicting preference writes by last successful local write. Progress merges must not lose exposure flags; true dominates false. Local storage is best effort, never an educational prerequisite.

## Security and privacy

Threat surface is static supply-chain/content integrity, malicious links/strings, UI URL parsing and local data handling. There is no user authentication or database to secure.

- Never render untrusted content as raw HTML or evaluate content as code. Escape text through normal React rendering.
- Parse URL fields against known enums/IDs and length bounds. Do not allow route parameters to become arbitrary asset paths or outbound URLs.
- External reference links permit HTTPS, use safe new-tab attributes, and show destination text. No embedded external scripts, iframes, videos, fonts or tracking pixels in R1.
- Self-host assets and use immutable hashes. Set a restrictive Content Security Policy: scripts/styles/fonts/connect to same origin; prohibit objects; restrict framing and base URI. Explicitly document any WebGL image/blob exception needed by the chosen loader. Do not add `unsafe-eval`.
- Use HTTPS, no MIME sniffing and a restrictive referrer policy. Host configuration is checked in release QA.
- Lock dependencies, inspect licenses and audit known vulnerabilities at release. A necessary exception names its reachable risk and owner; no silent dismissals.
- No health inputs, personalized advice, cookies, remote analytics or error uploads. Local progress is visible and erasable. Hosting request logs are provider-controlled operational data; disclose actual provider behavior when chosen and minimize retention where configurable.
- Preview mode has a persistent draft/synthetic label and `noindex`. A public preview URL is still public access: noindex is not security. Do not include restricted source material or private reviewer information in any hosted artifact.

Production source files and public bundle are inspectable. Treat question answers as learning content, not secrets. No client-side token, environment secret or hidden admin feature belongs in the application.

## Release accessibility statement

The About page states tested access methods, the 2D alternative and known limitations. Claim WCAG conformance only after the relevant audit is completed and documented. If a required keyboard/screen-reader flow fails, it blocks R1 public release rather than being hidden in a disclaimer.
