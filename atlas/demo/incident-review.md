# Burst saturation incident review

Fictional engineering fixture. Incident IR-08, release 2.4.

A burst of 4,000 events per second from one tenant saturated the dispatch queue.
Queue depth reached 18,000 events within 90 seconds.
The gateway continued accepting events while dispatch p95 latency rose to 12 seconds.
The tenant concurrency budget was enforced, but the shared retry scheduler became congested.
The overload guard incorrectly used gateway latency instead of queue age.

## Corrective decision
Pause the full rollout until the overload guard uses oldest-event age.
Keep the 10 percent canary active with the burst traffic generator disabled.
Repeat the burst test after the scheduler fairness patch and overload guard are deployed.
Passing the steady-state load test does not satisfy the burst acceptance gate.

