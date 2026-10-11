# Retry and dead-letter policy

Fictional engineering fixture. Policy RP-03.

Retry transient worker failures with exponential backoff starting at two seconds.
Apply jitter within 20 percent of the scheduled delay to avoid synchronized retries.
Allow five delivery attempts; the fifth failure moves the event to the dead-letter ledger.
HTTP 429 and 503 responses are retryable. HTTP 400 is a permanent rejection.
Use a server Retry-After hint when present, bounded by the 15 minute retry ceiling.

## Receipts
The worker must echo the original event key in its delivery receipt.
A missing receipt is recorded as an ambiguous delivery outcome.
Operators investigate ambiguous outcomes before manually redelivering an event.
The policy makes no promise that arbitrary downstream side effects happen exactly once.

