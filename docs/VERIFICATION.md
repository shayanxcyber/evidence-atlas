# Verification

Local checks were performed on **12 October 2026**. The selected release checkout was installed from its frozen lockfiles into fresh environments, using Python 3.11.15 and Node 22.23.2. Earlier development checks used Python 3.13.15. The first full-source [GitHub check run](https://github.com/shayanxcyber/evidence-atlas/actions/runs/38162448596) passed all six jobs: backend tests and Ruff on Windows/Linux with Python 3.11/3.13, the interface suite and production build, and the film lint/types/bundle.

## Backend: 21 tests

The store tests exercise deterministic identity, normalized line endings, overlapping line locators, duplicate imports, changed versions, active search versus retained citations, hostile query syntax, stop-word handling, diverse results, input limits, corpus identity, evidence links and evaluation snapshots. API tests cover import validation, source inspection, offline answers, empty evidence, saved receipts and mocked provider behavior.

Provider mocks include malformed output, missing/unknown labels and transport failure. They do not establish live endpoint compatibility or model quality. The selected fixture's retrieval scores are recorded in [demo-evaluation.json](demo-evaluation.json); its misses remain visible.

## Interface: twelve tests

The interaction suite verifies exact cited-version requests, ignored late results after cancellation, provider error recovery, keyboard document search and focus return, arrow-key tabs and filter recovery, safe version comparison, sources beyond the map limit, and clearing an earlier file when its replacement is invalid UTF-8.

Additional checks cover custom-selector arrow navigation, skipping disabled options, Escape without selection, trigger focus restoration and line comparison across insertions, replacements, deletions and repeated blank lines. The latest twelve-test run and production build passed after the case-file revision.

jsdom has no layout engine. Resize/Intersection observer stubs support the tests; real browser review checks the source map, desktop layout and narrow-screen reading separately. These checks are not a formal screen-reader or accessibility certification.

## Build and formatting

The TypeScript/Vite production build passes. React Flow is code-split into a separate module; the previous single-chunk size warning is resolved through splitting, not by changing its warning threshold. Prettier, Ruff lint and Ruff format are part of the documented check commands.

## Manual browser journey

The live fictional workspace supports import, source inspection, answer citations, card saving and evaluation. The current review covered the steady/burst dossier, library, existing cards/maps, evaluation assay, question-to-answer flow, keyboard document search, actual changed-version import, comparison and relationship popup. The editor's source rows were repaired after their inline layout failed this review. The current check selected a relationship and cancelled the draft; prior verification established card saving.

Desktop review used a measured 1440 px viewport; narrow reviews included effective widths of 345 and 361 px. Comparison stacks its panes on a narrow screen. Temporary viewport overrides are cleared after review. These are selected journeys, not exhaustive browser/device coverage.

Prepared receipts are written directly to disk through the CLI/API. Interactive browser exports still follow browser download settings; no global download preference was changed.

## Re-run

```sh
uv sync --extra dev --frozen
uv run pytest
uv run ruff check atlas tests
uv run ruff format --check atlas tests
cd web
npm ci
npm test
npm run format:check
npm run build
```

## Container check

A fresh image was built from the selected release checkout, including the current case-file interface. The container ran as user/group `10001`, served the interface and API through a loopback host binding, and seeded the eight fictional sources and one card. API checks completed a four-citation answer, matched every passage against its retained source version and original line range, and ran the twelve-question evaluation. Recall@3 was 95.8% and mean reciprocal rank was 0.944, with the same corpus fingerprint as the checked-in demo receipt. Its separate timing result is not substituted into that earlier receipt.

The release checkout was checked separately through its documented CLI and a loopback server. Importing a revised fictional note retained the earlier cited text; an evidence card referencing the old chunk saved successfully. `.dockerignore` restricts the build context to application inputs, excluding runtime databases, dependencies and media.

The source quickstart uses frozen lockfiles. The container installs the Python package's declared dependency ranges; it is not advertised as a fully locked or bit-for-bit reproducible image.

The local, container and remote checks do not establish production throughput, multiuser safety or general retrieval accuracy. Runtime databases and browser test fixtures are excluded from the source export.
