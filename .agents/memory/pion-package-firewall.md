---
name: Pion dependency firewall
description: Native SFU package-firewall failures were version-specific and have been resolved; compile success is separate from browser acceptance.
---

Re-check the current Go dependency graph and actual native build before
assuming the QMeet SFU is blocked by the package firewall.

**Why:** An older transitive crypto dependency was blocked for security
advisories. Updating to a compatible, approved graph resolved that build
failure; the old blanket assumption that native Pion cannot compile is stale.

**How to apply:** Read the current module/toolchain files for exact versions
and verify the native-tagged build when dependencies change. Keep browser
acceptance separate from compile/runtime readiness: neither compilation nor
forwarded RTP proves that participants can see decoded remote video.