---
name: GitHub history recovery
description: A repository overwritten by an empty initial commit may still be recoverable from an unreachable commit SHA.
---

When a GitHub repository is force-replaced with an empty root commit, inspect public push events and dangling commit SHAs before assuming the code is lost. A recovered commit can be restored through the GitHub refs API after preserving the current ref in a backup branch.

**Why:** The normal branch history may show only the empty commit while GitHub still retains the previous commit objects, and Git HTTPS authentication can fail even when the same token works with the GitHub API.

**How to apply:** Record the current branch SHA, create a backup ref first, update the target ref to the verified historical commit, and verify the recursive tree before reporting success.