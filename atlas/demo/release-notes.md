# Release 2.4 notes

Fictional engineering fixture. Aster Relay release 2.4.

Release 2.4 introduces per-tenant dispatch concurrency budgets and receipt tracing.
The gateway rejects payloads larger than 256 KiB before they reach the queue.
Worker retry delays now honor bounded Retry-After hints.
The delivery ledger distinguishes confirmed receipts from ambiguous outcomes.

## Known issue
The overload guard can remain green during dispatch queue saturation.
Incident IR-08 tracks the oldest-event-age guard and scheduler fairness work.
The release remains at the 10 percent canary until the burst acceptance gate passes.
Release notes summarize changes; test reports contain the scenario-specific evidence.

