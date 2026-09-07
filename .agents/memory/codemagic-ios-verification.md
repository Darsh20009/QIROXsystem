---
name: Codemagic iOS verification
description: Environment boundary for validating Capacitor iOS builds and signed IPA output.
---

The Replit development environment cannot execute the iOS verification stages locally because it runs Linux and does not provide Xcode, CocoaPods, or Codemagic CLI access. Configuration parsing, shell syntax, dependency installation, and artifact declarations can be validated locally; CocoaPods, Xcode, signing, and IPA creation require a Codemagic macOS build.

**Why:** Claiming a signed IPA was created without a completed Codemagic run would make the release status unverifiable.

**How to apply:** Treat local checks as preflight validation only, and use a follow-up run on the configured Codemagic workflows to confirm `ios-build` reaches Xcode and `ios-release` produces the IPA artifact.