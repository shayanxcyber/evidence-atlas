# Aster Relay architecture

Fictional engineering fixture. Service: Aster Relay 2.4.

Relay accepts events, writes them to a durable queue, and dispatches them to subscribed workers.
The gateway acknowledges an event only after the queue transaction commits.
Each tenant has an independent concurrency budget of 32 active dispatches.
Worker receipts include an event key, attempt number, and delivery timestamp.
The retry scheduler owns delayed delivery; the gateway does not sleep on worker failures.
Payloads are limited to 256 KiB. Larger payloads are rejected before enqueueing.

## Storage boundary
The event log is append-only. A delivery receipt is separate from the original event.
The queue keeps undelivered events for seven days, then moves them to an expired-events ledger.
The ledger is an operational record, not an automatic replay queue.

## Routing
Health probes use a separate pool from dispatch workers.
Trace identifiers cross the gateway, queue, scheduler, and worker boundaries.
The fictional deployment uses two gateway instances and four dispatch workers.

