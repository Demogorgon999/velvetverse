# Scoped return, Story Notes and New Story

Baseline: PR #3 commit b9068b1f7b39f69597e3ea92e8a54e821b4ce059. Guest/review build only; no production app or engine changes.

Run: npm run dev:guest (Node 24.11+). Use the printed loopback URL and synthetic login. No key is needed or read. Existing model route and live gating/cost policy are unchanged.

After sign-in or Resume, Previously with Seraphina… shows up to three currently eligible, explicitly witnessed facts from that save. Without such facts it reports only a saved-exchange count or an empty-story message. It does not infer promises, unresolved plots, or summarize raw dialogue/private thought. This deterministic projection makes zero provider calls and zero budget reservations.

Story Notes displays the latest eligible, same-account/save/character facts. Correction/revocation buttons select the existing witnessed-memory form; they do not pre-authorize it. Explicit witness consent is still required. Superseded, revoked, private, offscreen, unknown and other-scope records are withheld. Same local IDs in different scopes cannot admit other-story notes.

New Story allocates a server-generated owned ID and atomically persists a blank save before any turn. It inherits no transcript, labels, engine state or authored original-story boundary. The picker lists owned saved entries, including empty saves; original dialogue remains available through Resume. The account-wide eight-save bound is checked inside the same atomic mutation, so two simultaneous creations with seven saves admit exactly one. All stories share the existing attempt allowance, reservations and original deadline. Creation/resume does not extend/rearm them. Branching/inheritance is not implemented.

Authentication protects every list/resume/create route. Wrong-account scope is denied, unknown resume IDs are not treated as an existing save, and the client clears notes/transcript/drafts on expired auth. Switching clears drafts and uses a view generation guard to reject stale hydration. Recap/notes never enter the provider packet as an extra channel; final dialogue still uses the existing immutable privacy projection and serializer.

Synthetic verification covers A/B conflicting aliases, correction and revocation, private/legacy canaries, exact serialized fake-provider bodies, auth expiry/re-login and switching, empty second story across service restart, original transcript retention, ownership rejection, simultaneous eighth-save creation, unchanged shared attempt/deadline, original-only authored boundary, and UI control consent. The existing fake guest command and regression suite remain applicable.

Responsive verification used the installed Edge headless browser with a unique temporary profile, loopback fake app and synthetic notes at 1280x960 and 390x844. Avatar, recap and notes were inspected; no horizontal overflow and zero provider calls. The experimental layout was adjusted so expanded notes do not collapse the recap area. Test-owned browser and app stopped; no personal profile was used. Screenshots remain local evidence, not source/runtime data in this PR.

Limitations: recap is a projection of manually confirmed notes, not model narrative quality or automatic event extraction. The retained transcript is still bounded to 40 exchanges; switching does not recover earlier pruned turns. Re-login defaults to the first owned story rather than saving an account preference. The legacy same-story reset endpoint remains for compatibility but is not exposed in the guest UI. No branching, public access, deployment, paid call or real credential work occurred.

Final validation: 98/98 tests in 13 files; production build (unchanged main assets), focused ESLint and diff checks passed. Existing full-lint baseline remains 10 errors and one warning in unchanged files.
