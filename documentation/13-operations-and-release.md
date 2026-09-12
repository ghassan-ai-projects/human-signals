# Operations and release

## Operating model

Human Signals is a static web app. Operations consist of building reviewed content and licensed assets, serving immutable files over HTTPS, verifying browser behavior and publishing corrections. There is no authentication service, database, API server, migration service or background job to operate.

Choose the static hosting provider during deployment. The specification is provider-neutral and does not authorize creating paid services or publishing this repository. Hash routing avoids server-side route rewrites. A subdirectory deployment must set the Vite base path explicitly and be tested; route construction uses the configured base, not a hardcoded root domain.

## Configuration

| Value | Location | Rules |
|---|---|---|
| Application version | Package/build metadata | Immutable per release |
| Content version and hashes | Generated manifest | Match actual content bytes and approved scientific scope |
| Asset base path | Build configuration | Same-origin; normalized path; tested root and subdirectory |
| Preview/production mode | Explicit build command | Production rejects fixtures/drafts; no hidden review bypass |
| Optional issue URL | Public configuration | Validated HTTPS project URL; absence uses copyable issue template |
| Optional publisher contact | Public configuration | Actual owner-provided channel only |

No API key, OAuth client, database URL or secret environment variable is needed. Do not add placeholder credentials or environment examples suggesting otherwise.

## Immutable artifact layout

Each deployment includes the HTML entry, hashed application chunks, hash-named content manifest/bundle, model/texture assets and a release manifest. The HTML selects a single content manifest for that build. Use an embedded manifest path or build configuration; never combine an old application shell with whichever mutable bundle happens to be “latest.”

The release manifest records app version, content version, build ID, source revision when available, runtime and dependency-lock hash, content-byte hash, scientific approval hash, asset hashes, test report paths and build mode. It excludes private reviewer contact details and learner data.

Do not modify deployed immutable files in place. Publish a new complete release and switch the host's deployment pointer atomically. Retain at least the two previous known-good releases so old browser sessions can still load their referenced files during the cache window.

## Cache and headers

- HTML entry and any mutable release pointer: revalidate on every navigation (`no-cache` or equivalent).
- Hash-named JavaScript, CSS, content and assets: long-lived immutable caching, up to one year.
- Correct content types for JSON, GLB, JavaScript, fonts and images; reject content sniffing.
- HTTPS and a tested Content Security Policy; restrict framing, object sources, base URI and referrer transmission.
- Do not use a service worker in R1. A new browser navigation receives a coherent new app/content version; an existing session may finish using its already loaded old version.

If an old bundle is unavailable, show a refresh/retry message. Do not splice in new records while the learner is midway through a question. There is no remote live-update service.

## Release sequence

1. Start from a clean checkout or document any intentional uncommitted input; install locked dependencies.
2. Run typecheck, lint, content validation, unit/integration and production build. Approval must cover the exact scientific hash.
3. Run browser, budget, manual accessibility and visual/scientific checks against that built artifact. Preserve reports.
4. Inspect the compiled catalog, source/license pages, preview exclusion and no-auth/no-database network profile.
5. Build the release manifest and stage the exact artifact for review.
6. If publication is authorized, deploy atomically to the chosen host. Exercise Home, shared journey step, Stress, evidence, comparison and forced 2D fallback.
7. Check headers/caches and content hashes from the served files. Record actual URL, build/version and smoke-test results.
8. Retain the prior release and record rollback instructions for the host.

Engineering tests passing in development do not prove the production artifact or live deployment is correct. Test the actual artifact and, when deployed, actual served content.

## Rollback

Trigger rollback for broken primary navigation, invalid/missing bundle, severe rendering/accessibility failure, unsupported scientific content or a privacy regression. Switch to the last known-good complete release, invalidate only the mutable entry/pointer as needed, then repeat the smoke test. No database rollback is needed.

After rollback, local progress from a newer content version is retained as historical and excluded from current-version interpretation. The older app must ignore unknown progress fields safely. If it cannot read a newer storage schema, it operates in memory and offers explicit reset rather than deleting data automatically.

A scientific correction can require withdrawing a lesson rather than returning to an older equally flawed version. Publish a coherent corrected/tombstoned catalog. On old deep links explain withdrawal and offer reviewed alternatives without silent replacement.

## Monitoring without a backend

R1 has no default remote user analytics or error reporting. Use build/CI status and manual smoke checks; optionally use provider uptime/static-file health checks if later configured by the owner. Do not create scheduled monitors as part of implementation without a request.

About displays app/content versions, review date, model/route simplification and licenses. A local diagnostics action helps users report failures voluntarily. Network traces during QA verify that lesson activity and answers are not transmitted.

Without remote telemetry, the owner cannot measure real-user failure rates or learning across visitors automatically. State this operational limit honestly. Do not add tracking to fill that gap without a new explicit scope decision.

## Maintenance cadence

- Before every release: content/schema tests, lockfile/security/license review, supported-browser checks and affected scientific/visual review.
- At least annually: reassess scientific sources and refresh the 365-day review gate. Earlier if a credible issue is reported.
- When dependencies change: rerun affected browser/3D/accessibility and performance checks; no automatic major upgrades directly to production.
- When assets change: revalidate semantic anchors/laterality, licenses, hashes, visual review and budgets.
- When learning questions change: reassess answer families, exposure map and progress versioning.

## Incident/correction record

Record incident ID/date, affected app/content versions, observed behavior, impacted requirements/claims, reproduction, user impact, immediate mitigation, root cause, fix, reviewer approval, test evidence and published correction/rollback version. Do not include personal learner information. The record is concise but preserves evidence; “fixed” alone is insufficient.
