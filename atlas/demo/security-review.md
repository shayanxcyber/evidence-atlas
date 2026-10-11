# Token isolation and retention review

Fictional engineering fixture. Review SR-11.

Worker access tokens remain in the dispatch service's secret store.
The browser receives a job status identifier, never a worker token.
The event payload retention period is seven days.
Delivery metadata is retained for 30 days for operational diagnosis.
Tenant names are omitted from aggregate latency reports.

## Review notes
Redact Authorization headers from error logs and trace exports.
The review checked the gateway-to-worker credential boundary using dummy tokens.
It did not evaluate a live identity provider or establish regulatory compliance.
Rotate a worker token without interrupting another tenant's delivery budget.

