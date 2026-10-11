# Rollout acceptance checklist

Fictional engineering fixture. Change CR-24.

The release begins at a 10 percent canary, then advances to 25, 50, and 100 percent.
Each stage requires 20 minutes without a rollback trigger.
Pause rollout when oldest-event age exceeds 30 seconds for three consecutive minutes.
Roll back when permanent rejection rate exceeds 0.5 percent over a five minute window.
The operator records both the trigger and the source dashboard before changing traffic.

## Required evidence
Steady-state load, burst saturation, and worker-outage tests must pass independently.
A green gateway health probe alone cannot establish dispatch readiness.
The release approver needs a signed checklist and links to all three test reports.
The burst saturation gate is currently open, according to incident IR-08.

