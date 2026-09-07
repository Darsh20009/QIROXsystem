---
name: Workspace runtime logs
description: Reliability rules for project start, Shell, build, and runtime logs in the Workspace
---

Workspace runtime output must be retained independently of whether the child process is still running, and the Logs panel should open as soon as a long-running start or build begins.

**Why:** Installation and start commands can take time or fail before the process record exists; showing only live output makes a valid operation look frozen and hides the actionable error after exit.

**How to apply:** Keep a bounded per-project history for start, install, Shell, and build output; expose that history through the logs endpoint after exit; poll runtime status while the Workspace is open.