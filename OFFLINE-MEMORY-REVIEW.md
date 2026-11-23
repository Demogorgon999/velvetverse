# Offline memory/privacy review slice

Base: faa12c66f34f9b54abbab40df1f9b2dacfbe01c9 (public main verified 2026-11-23).
The initial commit was a separated offline slice. The follow-up now includes the functional guest chat integration; see GUEST-INTEGRATION-REVIEW.md. It remains separate from production and excludes Windows exposure tooling.

## Included

- Explicit versioned synthetic memory labels, correction/revocation chains, scope and visibility validation.
- Immutable guest eligible-memory projection and generic relevance ranking, plus the exact guest request body builder.
- Four offline test files: synthetic baseline diagnostics, selector stress, label persistence/reload, and five pure guest packet tests covering the eight scenarios and held-out terminology.
- Supporting serializer/gate/transport definitions copied from the prototype solely because the exact request builder imports them. The follow-up includes a loopback fake launcher and guest server, but no key prompt, credential, active live authority, proxy or production application route. Historical model/rate/expiry constants are not current authorization or verified current pricing. Tests do not invoke the network transport.
- Development test dependencies and offline evaluation scripts.

## Scope boundaries

All existing production source files, Character Engine, memory/relationship/life/perception engines, app routing, ordinary chat, API functions, production CSS and deployment configuration remain byte-for-byte at base. The new experimental label module is not imported by the production app.

The original unfiltered baseline is a privacy diagnostic, not a fair relevance A/B arm. Shared-eligibility A/B remains a separate experiment; full authenticated guest HTTP integration tests are now included in the follow-up; these tests make no model-quality, live recall, latency, conversion or cost claim. Guest packet tests use the actual copied builder, and the follow-up separately tests end-to-end guest server coverage with injected fake provider traffic.

Explicit trusted witness/scope labels are required; legacy fields are withheld. Natural-language truth/permission is not inferred. This can lose continuity until authorized labels exist. Generic lexical/topic relevance remains heuristic.

## Deliberately excluded

All pilot ledgers, transcripts, accounts, sessions, credentials, logs, receipts, captures, screenshots, generated reports, .env files, runtime/build/dependency folders, personal paths/hostnames/IPs, Windows/WSLC/firewall/Caddy scripts/config, live guest/owner launchers and approval windows. The added portable guest command is fake-only. Existing app timeout/rollback/routing changes are preserved in the original checkout but excluded because they change default behavior and need their own review.

## Validation

Reuse existing dependencies locally; clean consumers need the package-lock development dependencies and a Node release supporting the prototype's TypeScript imports (validated locally on Node 24).

Commands:

    npm test
    npm run build
    npm run eval:memory:repeat
    npm run eval:memory:stress
    npm run eval:memory:labels

Focused ESLint covers all new JS/TS plus tests and Vitest configuration. Full lint has pre-existing base errors, reported separately in the handoff. No hosted provider or guest instance is started.

## Publication gate

GitHub reports no Actions workflows and no deployment records. This does not prove absence of an external Git-connected Cloudflare trigger. The owner subsequently authorized review publication with that uncertainty understood; the initial Workers build was verified skipped. Never merge this review as a deployment instruction.
