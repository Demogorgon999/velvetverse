# Functional guest chat integration (review only)

This follow-up includes the functional friend-tested guest path, not only the selector. No production route imports it. The original normal app, Character Engine, relationship, perception and life engine source files remain unchanged. No network exposure, proxy configuration, Windows tooling, deployment, real guest records or credentials are included.

## Run locally with no key

Use Node 24.11 or newer and the development dependencies in package-lock.json.

    npm run dev:guest

Open the printed random 127.0.0.1 URL. Synthetic fixture login: guest / synthetic-guest-only. The familiar Seraphina avatar/player accepts arbitrary fictional scenes, persists its separate story in ignored .guest-review/, and supports reload/login continuity and explicit witnessed memory add/correct/revoke. All generated replies are marked MOCK; they do not demonstrate live model quality. Ctrl+C, SIGTERM, or stdin EOF stops the owned server. No fixed public port, TLS or public listener is started.

The fixture uses a separate synthetic account, loopback-only origin checks and local HttpOnly/SameSite cookie. This exception is rejected by live gates. Trusted HTTPS mode retains Secure cookies and strict exact-origin/forwarded-header validation, using guest.example.test as an inert example host. A deployment-specific origin and trusted proxy are a separate future integration decision; no deployment configuration is bundled.

The guest UI now provides New Story and Resume, not the earlier New Chat transcript-reset action. New Story durably saves a separate, empty owned story before its first turn and retains the original. The legacy same-story reset API remains for compatibility but is not offered in the guest UI. Reset Character remains absent. See STORY-RETURN-REVIEW.md. Reload/login restores the current saved transcript; logout/session expiry hides it without deleting it. Display retains up to 40 turns; provider history is separately limited to four approved exchanges and invalidated on label revisions. The fixture stops after 20 attempts, insufficient remaining reservation budget, an uncertain hold or its original two-hour deadline. Restart does not grant new attempts or renew its window. Do not reuse fixture passwords or data for public access.

## Actual request path and OpenAI connection

Guest player -> authenticated same-origin HTTP handler -> persistent atomic gate -> immutable eligible memory snapshot/ranker -> isolated roleplay worker -> exact guest serializer -> injected provider -> validated reply -> engine effects/persistent save -> filtered UI transcript.

scripts/tester/configuredGuestService.mjs composes fake (default) or explicitly approved live service. scripts/tester/guestProvider.mjs reuses an existing SERVER-SIDE OPENAI_API_KEY environment/secret binding by name through an injectable lookup. Fake mode never looks up a secret. Key presence alone cannot select live mode. Live requires trusted server configuration, a fresh explicit promo/no-paid attestation, a valid persistent window/ledger, a separately provided guest password and the HTTPS origin contract. No browser field can provide the API key or enable live; no key prompt, secret file, provisioning or production live CLI is included.

The real Responses adapter is retained: fixed allowlisted OpenAI endpoint and pinned model, store:false, no tools/browsing, output 256 tokens, input/output byte and token bounds, deadline, one dispatch per turn, no retries/model fallback. Only the authoritative scoped projection and approved history reach it; legacy scalar/experience/history duplicates, private and other-scope content are withheld. Models cannot authorize canonical state mutation. Local special-handler replies remain visibly distinguished from a model reply.

Live accounting preserves the original 20-attempt / two-hour / USD0.25 aggregate ceiling including USD0.025 headroom, atomic reservation, known-usage reconciliation, held ambiguous dispatches and restart persistence. These are internal controls, not a Platform balance query or account-side cap. The historical grant cutoff and model/rate constants are retained fail-closed; they are not current credits/pricing verification or authority to launch. Fresh live policy/authorization is required after that cutoff. Nothing here activates a paid provider in production.

## Keeping production behavior unchanged

The worker uses an explicit six-file adapter snapshot allowlist under scripts/guest-runtime/. Node's worker-local load hook serves those tested prototype versions at their original module URLs, preserving relative dependencies. Only the isolated worker sees injected final dialogue, cancellation and failed-turn rollback seams. It uses the existing character/personality/planner/relationship/perception/life orchestration; interpreter/assessment remain declared-field/neutral synthetic shims as in the pilot. This is not full hosted-engine parity or live narrative QA. Original production modules are neither edited nor remapped in the browser/build.

## Verification

    npm test
    npm run build

The suite includes the actual command startup/EOF shutdown, avatar player components, guest auth/origin/CSRF/account separation, custom dialogue and reload, explicit corrections/revocations, weather redirect without dispatch, immutable privacy projection and final wire, named-secret composition with a dummy lookup and injected fake Responses fetch, duplicate/concurrent requests, burst/attempt/cost limits, corrupt/held/restart/expiry behavior, and model text remaining narrative only. No real API requests or secret reads are performed. Historical live-policy tests use a fixed synthetic clock; no real pilot ledger is opened.

The root production build's assets remain identical to the preceding offline review build. Full lint has pre-existing base errors; focused lint covers every added/changed source and test file. The source allowlist is scripts/review-guest-files.json; runtime artifacts are never staged. CI uses the established [Skip CI] commit prefix. This PR is review-only, with no merge or rollout instruction.

Verified follow-up: 93/93 tests across 12 files; production build, focused ESLint and diff checks pass. Full lint retains 10 errors and one warning in unchanged base files. All test-owned servers and command children close during cleanup. No new visual browser or live model-quality claim is made.
