# Steady-state load test

Fictional engineering fixture. Run LT-24, release 2.4.

The steady-state test delivered 600 events per second for 30 minutes.
The workload used 16 tenants, uniform 8 KiB payloads, and a 20 ms worker response delay.
Observed gateway p95 latency was 43 ms; dispatch p95 latency was 118 ms.
The acceptance limits were 75 ms for gateway p95 and 200 ms for dispatch p95.
The steady-state acceptance gates passed.

## Limits
This run did not simulate sudden bursts, tenant imbalance, or downstream outages.
It does not establish the maximum sustainable capacity of the service.
Queue depth stayed below 400 events throughout this fixture run.
The source contains invented measurements for demonstrating evidence inspection.

