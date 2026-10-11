# API guide

FastAPI's interactive schema is available at `/docs`. The UI and API share an origin; no CORS wildcard is enabled.

| Method and route | Result |
| --- | --- |
| `GET /api/status` | Active document count, corpus fingerprint and provider configuration readiness |
| `GET /api/documents` | Active document metadata and retained-version counts |
| `POST /api/documents` | Import `{title, content}` as a new or existing version |
| `GET /api/documents/{id}?version={versionId}` | Exact source text, hash and version list; latest when omitted |
| `GET /api/search?q={question}&limit=4` | Snapshot fingerprint and ranked passages |
| `POST /api/answers` | Answer receipt from `{question, mode, limit}` |
| `GET /api/answers` | Twenty newest saved answer receipts |
| `POST /api/cards` | Save `{title, note, links}` with `chunk_id` and typed `relation` |
| `GET /api/cards` | Saved cards and their original source passages |
| `POST /api/evaluations?k=3` | Run the built-in suite against the active corpus |
| `GET /api/evaluations` | Twenty newest evaluation receipts |
| `GET /api/runs/{id}` | A saved answer or evaluation receipt |

Answer modes are `evidence` and `model`; the default is `evidence`. Result limits are integers from 1 to 10. Questions have a maximum length of 1,000 characters. Cards require 1–20 valid chunk links, with `supports`, `contradicts`, or `context` as the relationship.

An empty retrieval returns `status: "no_evidence"`, no citations, and an explanatory response. It does not save an answer receipt. Invalid input is rejected with 422; missing document versions or run IDs return 404. Connected mode without configuration returns 409. Unusable provider output or invalid labels return 502 and are not saved.

For a direct local export in PowerShell:

```powershell
$run = Invoke-RestMethod -Method Post -Uri 'http://127.0.0.1:8765/api/evaluations?k=3'
$run | ConvertTo-Json -Depth 20 | Set-Content -Encoding utf8 '.atlas/evaluation.json'
```

This writes the API result directly to disk. Browser export controls remain available for ordinary interactive use and follow the browser's download preferences.
