---
name: Managed provider capacity
description: Safety rule for Railway and Render deployments when provider billing or usage data is incomplete.
---

Railway and Render deployments must not begin unless QIROX has a verified capacity value for the selected provider. The system uses explicit server configuration for this confirmation and treats missing or exceeded capacity as a hard stop, not a warning.

**Why:** Their public lifecycle APIs support service creation, deployment, status, logs, and suspension, but billing or storage consumption is not a dependable universal metric in those API flows. Starting a new resource on an unverified plan risks unexpected consumption or failed provisioning.

**How to apply:** Keep `RAILWAY_CAPACITY_GB` or `RENDER_CAPACITY_GB` current after checking the provider account. Optional usage values can drive warnings. Set `FEATURE_DEPLOYMENT_PROVIDERS=false` to immediately disable managed Railway/Render operations while retaining Vercel and simulation.