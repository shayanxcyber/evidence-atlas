# Building an inspectable investigation

Evidence Atlas starts with a specific engineering problem: the source material behind a conclusion can disagree or change after that conclusion was written. A document search is useful, but the investigation needs a durable record of which text was used, what its operating conditions were, and what evidence pushes against the conclusion.

The project brings that trail into one local workspace. The central design decision is to separate **what is currently searchable** from **what a saved citation actually references**.

## The demonstration problem

Aster Relay’s fictional release 2.4 passes a steady load test at 600 events per second across sixteen tenants. Its p95 latency is 118 ms. A later burst reaches 4,000 events per second for one tenant; the dispatch backlog reaches 18,000 events and p95 latency rises to 12 seconds.

These observations describe different conditions. The passing test supports steady-state behavior. It does not establish burst behavior. The incident also explains a concrete mechanism: the overload guard watches gateway latency while dispatch work queues elsewhere.

The opening dossier uses those actual fixture values. Dot counts share a event-rate unit; latency bars share a scale. Source actions open the load test and incident report directly. The first interaction therefore leads from a visible engineering discrepancy into its evidence, rather than starting with an empty question box.

The demo is deliberately fictional. It can be installed, changed and evaluated without an account, private logs or a remote service.

## Invariant 1: a citation survives a revised document

A citation cannot mean “whichever source is latest.” Importing an edited document creates a content-addressed version and its chunks. The active pointer and FTS rows move to that version, while the earlier source text remains stored.

An answer carries its passage’s document ID, version ID, chunk ID, full content hash and original line range. The inspector requests that version explicitly. Cards reference chunks with the same retained identity.

This creates two useful behaviors at once: searches find current material, and historical conclusions retain their original source trail. Re-importing identical normalized text reactivates the existing version rather than adding a duplicate. Reactivating an earlier version is also reflected in the corpus fingerprint.

The implementation is in [atlas/store.py](../atlas/store.py). Store tests distinguish current retrieval from an earlier retained citation. Hashes establish content identity; they do not establish that a document is trustworthy.

## Invariant 2: a receipt describes one corpus

Suppose an import finishes between retrieval and fingerprint creation. Without a shared read snapshot, an answer could hold passages from the old corpus but identify the new corpus.

Retrieval and fingerprint generation share a SQLite read transaction. Evaluation likewise retrieves its cases and corpus identity in one snapshot. Import updates version storage, chunks, active search rows and the active pointer in a write transaction.

WAL, foreign keys and explicit connection lifetimes support the local store. These are practical consistency choices for one workspace. They are not a claim that SQLite concurrency alone supplies a distributed or multiuser service.

## Invariant 3: disagreement remains inspectable

An evidence card stores a conclusion, notes and explicitly typed links: supports, contradicts or context. The backend validates that each referenced chunk exists. The interface shows the linked text and whether its version remains active.

That relationship is a judgment made while investigating. Atlas does not infer that two sentences contradict each other or decide which source is correct. Keeping the relationship explicit makes it possible to review the judgment alongside the text and conditions it refers to.

The source map helps navigate those links. It represents collection membership, retrieval results or authored relationships; its layout is not a semantic similarity result. A complete list remains available, including documents beyond the eight-node map limit.

## A baseline whose misses are visible

FTS5 with BM25 gives this prototype a useful lexical baseline without an embedding service. Query terms are quoted as literals, capped and joined with OR; user punctuation cannot become search syntax. Results retain the best passage per document so one source does not occupy every slot.

The authored twelve-question suite names expected documents. Receipts preserve returned names, rank, passages, recall, reciprocal rank, timing, corpus fingerprint and suite hash. The included run has mean Recall@3 of 95.8% and mean reciprocal rank of 0.944.

Q07’s expected source is third. Q11 retrieves one of two expected sources. Both remain visible in the interface and checked-in JSON. These gaps are useful: a future reranker or semantic retrieval experiment can be compared against the same cases and identities. The fixture is too small and closely authored to support general accuracy or performance claims.

## Request lifetime matters in the interface

Cancelling a request should prevent its late result from replacing the current view. The browser combines AbortController with request identity, ignoring a completion from an earlier request even if the transport does not honour abort. It keeps error, cancellation, empty and successful outcomes separate.

The API checks client disconnection before persisting an answer. A provider request already running is not guaranteed to stop immediately. Mocked provider tests cover malformed output, missing and unknown labels, and transport failure. No live endpoint behavior is claimed.

Imported source text is rendered as React text nodes. It is not inserted as executable Markdown HTML. Version comparison uses a bounded line-alignment algorithm, separate line numbers and changed-row marks. The 240-line preview limit remains explicit; the original source is still retained.

## Design around the investigation

The interface follows a case-file direction: paper, olive and rust; restrained sans-serif controls; a serif investigation heading; and monospace locators. The content supplies the composition. The release discrepancy leads the opening; exact sources lead the inspector; individual misses lead the evaluation assay.

Applied resources serve specific interactions: Radix custom selects, cmdk document/action search, SmoothUI-derived navigation and upload, Magic UI-derived arrival/comparison patterns, Motion transitions and React Flow navigation. The [design notes](DESIGN.md) record these adaptations and the selected reference mechanisms.

Keyboard search, arrow-key tabs, focus restoration, explicit field labels and list alternatives support real use. Responsive source inspection stacks comparison panes and keeps all workspace tabs available. Automated interaction tests do not substitute for layout review; selected desktop and narrow-screen journeys were inspected separately.

## The film is built from components

The 32-second Remotion composition follows the same sequence: question, citation, retained versions, measured retrieval. It imports the application’s citation, answer, source-line, version-pane and assay components, then controls their movement by frame. Its props are authored fictional demonstration material, not a recording of a live request.

The citation moves through a dedicated gap between panels. Connector masks exclude headings, captions and the moving panel envelopes. Camera changes keep the compared versions legible. A standard-library Python generator produces the original stereo score; fonts and audio live in the checkout.

This makes the motion project editable alongside the application and avoids frozen screenshot panels. See the [film source and commands](../videos/evidence-atlas-film/README.md).

## What this build demonstrates

The work spans data modeling, transactional consistency, source/version identity, API boundaries, retrieval evaluation, request cancellation, interactive frontend state and authored motion. Those concerns meet in one runnable journey rather than a collection of disconnected feature demos.

It is still a prototype. Larger corpora need bounded candidate retrieval and pagination. Shared hosting needs authentication, workspace isolation, request limits and operational controls. Document formats beyond UTF-8 text need their own extraction and locator contracts. A semantic retrieval experiment needs a broader evaluation set before any quality claim.

Those extensions have a clear baseline to improve: retained citations, corpus-specific receipts and visible failure cases.
